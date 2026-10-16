// Build the Godforge hero pages' data from the game-data export
// (E:\GameAssets\Exports\godforge, built by _pipeline\godforge\update.mjs; hero text, kits and
// stats come from godforge.gg, which wins any disagreement with the game files).
//
// Writes:
//   src/gf/data/game/heroes/<slug>.json   one per hero in heroes.json, in the GfHero shape the
//                                         hero page renders, plus summary + lore
//   src/gf/data/legacy-ids.json           old numeric hero-page ids → slug (for redirects)
//   public/godforge/abilities/<slug>/*.webp  ability icons
//
// heroes.json stays the roster (slugs, local portraits/full art, rarity, realm…). Only heroes
// on it are written, so the export's held "Exalted" entries and bosses never reach the site.
// heroes-api.json (the ravenpyros API data) is still read for the old ids and the archetype
// descriptions; ravenpyros remains the source for dungeons, bosses and weapons.
//
//   node scripts/sync-godforge.mjs          # dry run
//   node scripts/sync-godforge.mjs --write
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const EXPORT = process.env.GF_EXPORT || 'E:\\GameAssets\\Exports\\godforge'
const WRITE = process.argv.includes('--write')
const OUT = path.join(ROOT, 'src', 'gf', 'data', 'game', 'heroes')
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '')
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

// Health is stored ÷15 in the export (Anubis 110 → 1,650 HP in game).
const HP_SCALE = 15

// Ascension stat codes. 0, 1 and 8 are HP / ATK / DEF; they always come as a trio with the
// same value, so the order between them doesn't matter for display.
const ASC_STAT = { 0: 'hp', 1: 'atk', 8: 'def', 3: 'cdmg', 4: 'spd', 5: 'res', 6: 'acc', 7: 'init', 10: 'divinity' }
// Awakening stat codes, decoded by matching every hero against the labelled ravenpyros data.
const AWK_STAT = {
  11: 'ignore_def', 15: 'ignore_res', 17: 'turnmeter_mult', 18: 'divinity_mult', 19: 'barrier_mult',
  20: 'shield_mult', 21: 'heal_mult', 26: 'dmg_mult', 27: 'damage_reduction_mult', 29: 'ignore_res',
  30: 'strong_hit_chance_mult', 31: 'attunement_mult', 32: 'armor_mult', 33: 'weapon_mult',
  40: 'incoming_turnmeter_mult', 41: 'incoming_divinity_mult',
}
const TYPE = { basic: 'Basic', core: 'Core', passive: 'Passive', ultimate: 'Ultimate', imprint: 'Imprint' }
const TARGET_LABEL = {
  Single: 'Target', AllEnemy: 'All Enemies', AllAlly: 'All Allies', Self: 'Self', SingleAlly: 'Ally',
  AllAllyExceptSelf: 'Other Allies', RandomEnemy: 'Random Enemy',
}
const STAT_ABBR = { healthMax: 'HP', attack: 'ATK', defense: 'DEF', speed: 'SPD', faith: 'FTH', health: 'HP' }
const pct = (v) => `${Math.round(v * 1000) / 10}%`

function formula(d) {
  const parts = (d.damageStats || []).map((s) => `${pct(s.value)}${STAT_ABBR[s.stat] ?? s.stat}`)
  return parts.length ? parts.join('+') : null
}

// Status effect names the hero page can draw as icons (src/gf/data/status-effects.json), longest
// first so "DEF Up II" wins over "DEF Up".
const EFFECT_NAMES = read(path.join(ROOT, 'src/gf/data/status-effects.json'))
  .map((e) => e.name)
  .sort((a, b) => b.length - a.length)
const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const EFFECT_RE = new RegExp('(?<![\\w[])(' + EFFECT_NAMES.map(escapeRe).join('|') + ')(?![\\w\\]])', 'g')

/** Bracket every known status effect in a line of skill text ("[Banish]") and tidy stat names. */
function richText(text) {
  if (!text) return text
  return text
    .split(/(\[[^\]]*\])/)
    .map((part) => (part.startsWith('[') ? part : part.replace(EFFECT_RE, '[$1]')))
    .join('')
    .replace(/HEALTHMAX/g, 'HP')
}

// ── Inputs ───────────────────────────────────────────────────────────────────
const roster = read(path.join(ROOT, 'src/gf/data/heroes.json')).filter((h) => h.rarity)
const api = read(path.join(ROOT, 'src/gf/data/heroes-api.json')).heroes.filter((h) => !h._error)
const apiByName = new Map(api.map((h) => [norm(h.name), h]))
const archetypeDesc = Object.fromEntries(api.filter((h) => h.archetype_description).map((h) => [h.archetype, h.archetype_description]))

const exported = new Map()
const heroesDir = path.join(EXPORT, 'heroes')
for (const realm of fs.readdirSync(heroesDir)) {
  for (const name of fs.readdirSync(path.join(heroesDir, realm))) {
    const dir = path.join(heroesDir, realm, name)
    const p = path.join(dir, 'hero.json')
    if (fs.existsSync(p)) exported.set(norm(read(p).name), { dir, h: read(p) })
  }
}

// ── Build ────────────────────────────────────────────────────────────────────
const icons = []
const records = []
const legacyIds = {}
const missing = []
const unknownCodes = new Set()

for (const r of roster) {
  const ex = exported.get(norm(r.name))
  if (!ex) { missing.push(r.name); continue }
  const { dir, h } = ex
  if (h.playable === false || h.implemented === false) continue
  const old = apiByName.get(norm(r.name))
  if (old) legacyIds[String(old.id)] = r.id

  const iconPath = (icon) => {
    if (!icon) return null
    const src = path.join(dir, 'abilities', `${icon}.png`)
    if (!fs.existsSync(src)) return null
    const rel = `/godforge/abilities/${r.id}/${icon}.webp`
    icons.push([src, path.join(ROOT, 'public', rel)])
    return rel
  }

  const abilities = h.abilities || []
  // Awakening abilities index into the kit without its leader bonus.
  const awakenable = abilities.filter((a) => !a.isLeaderBonus)
  const awakenedAt = new Map()
  for (const [level, idx] of Object.entries(h.awakening?.awakeningAbilities || {})) {
    const a = awakenable[idx]
    if (a?.awakeningBonus) awakenedAt.set(a, Number(level))
  }

  const skills = abilities.map((a, i) => {
    const level = awakenedAt.get(a)
    return {
      id: i,
      type: a.isLeaderBonus ? 'Leader Bonus' : TYPE[a.type] ?? a.type,
      name: a.isLeaderBonus ? undefined : a.name,
      description: a.isLeaderBonus ? a.text.replace(/\n/g, ' in ') : richText(a.text),
      icon_url: iconPath(a.icon),
      divinity_cost: a.requiredDivinity ?? null,
      damage_formula: (a.damage || []).map(formula).filter(Boolean),
      ...(a.cooldown != null ? { cooldown: a.cooldown } : {}),
      effects: (a.statusEffects || []).map((e) => ({
        effect_name: e.statusEffectName,
        target: e.effectTarget,
        target_label: TARGET_LABEL[e.effectTarget] ?? e.effectTarget,
        chance: Math.round((e.chance ?? 1) * 100),
        hits: 1,
        duration: e.duration ?? 0,
        visibility: e.isVisible === false ? 'Hidden' : 'Displayed',
      })),
      awakening_bonuses: level
        ? [{ level, description: a.awakeningBonus, upgrade_description: richText(a.awakeningBonus) }]
        : [],
    }
  })

  const ascension_bonuses = Object.entries(h.ascension || {}).flatMap(([rank, mods]) =>
    mods.flatMap((m) => {
      const stat = ASC_STAT[m.statType]
      if (!stat) { unknownCodes.add(`asc ${m.statType}`); return [] }
      return [{ rank: Number(rank), stat, multiplier: m.bonusMultiplier || 0, flat_bonus: m.bonusFlat || 0 }]
    }),
  )

  const awakening_bonuses = [
    ...Object.entries(h.awakening?.awakeningModifiersList || {}).flatMap(([level, mods]) =>
      mods.flatMap((m) => {
        const stat = AWK_STAT[m.statType]
        if (!stat) { unknownCodes.add(`awk ${m.statType}`); return [] }
        return [{ level: Number(level), type: 'Stat', description: null, stat, multiplier: (m.bonusFlat || 0) / 100, flat_bonus: 0 }]
      }),
    ),
    ...[...awakenedAt].map(([a, level]) => ({
      level,
      type: 'Ability',
      description: richText(a.awakeningBonus),
      skill_type: TYPE[a.type] ?? a.type,
    })),
  ].sort((x, y) => x.level - y.level)

  const ult = abilities.find((a) => a.type === 'ultimate')
  const s = h.stats || {}
  const faction = (h.realm || r.faction || '').toUpperCase()

  records.push({
    id: old?.id ?? 0,
    slug: r.id,
    name: h.name,
    title: h.title || null,
    summary: h.summary || null,
    lore: h.lore || null,
    rarity: h.rarity || r.rarity,
    affinity: h.affinity || r.affinity,
    affinity_icon: h.affinity ? `/godforge/gf_heroes/affinity/${h.affinity}.png` : null,
    allegiance: h.allegiance || r.allegiance,
    allegiance_icon: h.allegiance ? `/godforge/gf_heroes/allegiances/Allegiance_${h.allegiance}.png` : null,
    archetype: h.archetype || r.archetype,
    archetype_icon: h.archetype ? `/godforge/gf_heroes/archetypes/Archetype_${h.archetype}.png` : null,
    archetype_description: archetypeDesc[h.archetype] ?? null,
    faction: h.realm || r.faction,
    faction_icon: faction ? `/godforge/gf_heroes/factions/${faction}.png` : null,
    portrait_url: r.portrait || r.fullArt,
    image_url: r.fullArt,
    stats: {
      hp: Math.round((s.health ?? 0) * HP_SCALE),
      atk: s.attack ?? 0,
      def: s.defense ?? 0,
      spd: s.speed ?? 0,
      init: s.faith ?? 0,
      acc: s.accuracy ?? 0,
      res: s.resistance ?? 0,
      initial_divinity: ult?.initialDivinity ?? 0,
      crate: s.criticalChance ?? 10,
      cdmg: s.criticalDamage ?? 50,
    },
    ascension_bonuses,
    awakening_bonuses,
    skills,
  })
}

console.log(`${records.length} of ${roster.length} roster heroes built from the export, ${icons.length} ability icons`)
if (missing.length) console.log(`Not in the export (kept off the new pages): ${missing.join(', ')}`)
if (unknownCodes.size) console.log(`Unmapped stat codes (skipped): ${[...unknownCodes].join(', ')}`)
if (!WRITE) {
  console.log('Dry run. Re-run with --write.')
  process.exit(0)
}

fs.mkdirSync(OUT, { recursive: true })
const keep = new Set(records.map((r) => `${r.slug}.json`))
for (const f of fs.readdirSync(OUT)) if (!keep.has(f)) fs.rmSync(path.join(OUT, f))
for (const r of records) fs.writeFileSync(path.join(OUT, `${r.slug}.json`), JSON.stringify(r, null, 1) + '\n')
fs.writeFileSync(path.join(ROOT, 'src/gf/data/legacy-ids.json'), JSON.stringify(legacyIds, null, 1) + '\n')

let n = 0
for (const [src, dest] of icons) {
  if (fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs) { n++; continue }
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  await sharp(src).resize({ width: 128, height: 128, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toFile(dest)
  n++
}
console.log(`Wrote ${records.length} hero files, legacy-ids.json and ${n} icons.`)
