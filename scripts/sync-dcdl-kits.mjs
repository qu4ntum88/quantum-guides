// Refresh DCDL champion kits and legacy skill text from the game-data export
// (E:\GameAssets\Exports\dcdl, built by E:\GameAssets\Exports\_pipeline\dcdl\update.mjs).
//
// Champions/legacy: only skill DESCRIPTIONS are replaced (ultimate, skills[], globalSkill,
// legacySkills[]). Names, images, tiers, Quantum's Take and every other field are kept, except
// that a skill/enhancement name within a few letters of the game's is corrected to its spelling.
// Combat Cycle: each boss's skills[] becomes its current in-game kit (names + text only).
//
//   node scripts/sync-dcdl-kits.mjs          # dry run: report what would change
//   node scripts/sync-dcdl-kits.mjs --write  # apply
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const EXPORT = process.env.DCDL_EXPORT || 'E:\\GameAssets\\Exports\\dcdl'
const WRITE = process.argv.includes('--write')

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const oneLine = (s) => (s || '').replace(/\s+/g, ' ').trim()
function editDistance(a, b) {
  const d = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0]; d[0] = i
    for (let j = 1; j <= b.length; j++) {
      const t = d[j]
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = t
    }
  }
  return d[b.length]
}

function readAll(dir, file) {
  const out = []
  ;(function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name === file) out.push(JSON.parse(fs.readFileSync(p, 'utf8')))
    }
  })(dir)
  return out
}

// ---------- champions ----------
const champions = readAll(path.join(EXPORT, 'champions'), 'champion.json')
const herosPath = path.join(ROOT, 'src/dcdl/data/heros.json')
const heros = JSON.parse(fs.readFileSync(herosPath, 'utf8'))
const ALIAS = { atom: 'theatom', deathmetalbatman: 'batmandeathmetal' }
// Site rarity -> game rarity. "Iconic" is a site label the game data marks as Mythic+.
const siteRarity = (r) => (r === 'Mythic +' || r === 'Iconic' ? 'Mythic+' : r)

function findChampion(site) {
  const base = site.name.replace(/\s*\((Legendary|Mythic \+|Mythic|Iconic)\)\s*/g, ' ').replace(/\s*\([^)]*\)\s*$/, '').trim()
  const key = ALIAS[norm(base)] || norm(base)
  let c = champions.filter((g) => norm(g.name) === key)
  if (c.length > 1) c = c.filter((g) => g.rarity === siteRarity(site.rarity))
  if (c.length <= 1) return c[0] || null
  // Still ambiguous (e.g. two Mythic+ Flashes): pick the one whose skill names overlap most.
  const names = new Set([site.ultimate?.name, ...(site.skills || []).map((k) => k.name)].map(norm))
  const score = (g) => g.skills.filter((k) => names.has(norm(k.name))).length
  return c.sort((a, b) => score(b) - score(a))[0]
}

let kitChanges = 0
const unmatched = []
const log = []
const forceJobs = [] // generated enhancement icons to copy into public/
const championMatches = new Map() // site id -> export record
for (const s of heros) {
  const g = findChampion(s)
  if (!g) { unmatched.push(s.name); continue }
  championMatches.set(s.id, g)
  const set = (obj, field, value, label) => {
    if (!obj || !value) return
    const v = oneLine(value)
    if (oneLine(obj[field]) !== v) { obj[field] = v; kitChanges++; log.push(`${s.name} — ${label}`) }
  }
  const ult = g.skills.find((k) => k.slot === 'Ultimate')
  set(s.ultimate, 'description', ult?.text, 'Ultimate')
  const gameSkills = g.skills.filter((k) => /^Skill \d/.test(k.slot))
  const skillMatch = new Map() // site skill name (normalized) -> game skill
  ;(s.skills || []).forEach((sk, i) => {
    const m = gameSkills.find((k) => norm(k.name) === norm(sk.name)) || gameSkills[i]
    if (m) skillMatch.set(norm(sk.name), m)
    // A near-miss name is a site typo ("Judgement" vs the game's "Judgment"): take the game's spelling.
    if (m && norm(m.name) !== norm(sk.name) && editDistance(norm(m.name), norm(sk.name)) <= 3) {
      log.push(`${s.name} — skill name "${sk.name}" → "${m.name}"`); sk.name = m.name; kitChanges++
    }
    set(sk, 'description', m?.text, `skill "${sk.name}"`)
  })
  set(s.globalSkill, 'description', g.globalSkill?.text, 'Global Skill')

  // Multiversal Force Enhancements (site `upgrades`): text with every level's value, matched
  // by name. Where the site has no image, use the hexagon icon rebuilt from game art; a
  // champion with no enhancements listed yet gets them created from the game data.
  const enhanced = (g.talents || []).filter((x) => x.enhanced && x.text)
    .sort((a, b) => String(a.icon).localeCompare(String(b.icon)))
  const forceImage = (tal) => {
    if (!tal.forceIcon) return undefined
    const src = readAllPaths(path.join(EXPORT, 'champions'), tal.forceIcon)
    if (!src) return undefined
    forceJobs.push({ src, dest: path.join(ROOT, 'public/dcdl/heros/upgrade_images', tal.forceIcon) })
    return `./upgrade_images/${tal.forceIcon}`
  }
  if (!s.upgrades?.length && enhanced.length) {
    s.upgrades = enhanced.map((tal) => ({ name: tal.name, description: oneLine(tal.text), image: forceImage(tal) }))
    kitChanges++
    log.push(`${s.name} — added ${enhanced.length} Multiversal Force Enhancements`)
  } else {
    for (const u of s.upgrades || []) {
      // By name, else through the skill it enhances (site skill → game skill → talent with that icon).
      let tal = enhanced.find((x) => norm(x.name) === norm(u.name))
      if (!tal) {
        const skill = skillMatch.get(norm(u.name.replace(/\s*-\s*Enhanced\s*$/i, '')))
        tal = skill && enhanced.find((x) => x.icon === skill.icon)
        // Rename only a typo; a real difference (Mythic Red Hood's "Reborn Outlaw:" prefix) keeps the site name.
        if (tal && editDistance(norm(tal.name), norm(u.name)) <= 3) {
          log.push(`${s.name} — enhancement name "${u.name}" → "${tal.name}"`); u.name = tal.name; kitChanges++
        }
      }
      if (!tal) continue
      set(u, 'description', tal.text, `enhancement "${u.name}"`)
      if (!u.image) { u.image = forceImage(tal); if (u.image) { kitChanges++; log.push(`${s.name} — icon for "${u.name}"`) } }
    }
  }
}

// ---------- legacy ----------
const pieces = readAll(path.join(EXPORT, 'legacy'), 'legacy.json')
const legacyPath = path.join(ROOT, 'src/dcdl/data/legacy.json')
const legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf8'))
let legacyChanges = 0
const legacyUnmatched = []
const legacyMatches = new Map() // site id -> export record
for (const l of legacy) {
  const icon = norm(path.basename(l.image || '', '.png'))
  const p = pieces.find((x) => norm(x.images.icon) === icon) || pieces.find((x) => norm(x.name) === norm(l.name))
  if (!p) { legacyUnmatched.push(l.name); continue }
  legacyMatches.set(l.id, p)
  for (const sk of l.legacySkills || []) {
    const kind = /general/i.test(sk.image || '') ? 'General' : /exclusive/i.test(sk.image || '') ? 'Exclusive' : null
    const m = p.skills.find((x) => norm(x.name) === norm(sk.name)) || (kind && p.skills.find((x) => x.kind.startsWith(kind)))
    const v = oneLine(m?.textSteps)
    if (v && oneLine(sk.description) !== v) { sk.description = v; legacyChanges++; log.push(`${l.name} — legacy skill "${sk.name}"`) }
  }
}

// ---------- Combat Cycle bosses ----------
// Each boss's skills are replaced with its CURRENT in-game kit: names and the in-game text
// only. The export's "detailed" text variants, cooldowns and damage factors are left out
// on purpose (not shown in game / held back from the site for now).
const ccDir = path.join(EXPORT, 'game-modes', 'combat-cycle')
const ccPath = path.join(ROOT, 'src/dcdl/data/combat-cycle.json')
const cc = JSON.parse(fs.readFileSync(ccPath, 'utf8'))
const ccBosses = fs.existsSync(ccDir) ? readAll(ccDir, 'boss.json') : []
const bare = (s) => norm(s).replace(/^the/, '')
let ccChanges = 0
for (const b of cc) {
  const g = ccBosses.find((x) => bare(x.name) === bare(b.name))
  if (!g) continue
  const kit = g.currentKit.filter((s) => s.name && s.text)
  // Phase II Power-Up is the same generic passive on every boss; list it last.
  kit.sort((a, z) => (/phase ii/i.test(a.name) ? 1 : 0) - (/phase ii/i.test(z.name) ? 1 : 0))
  const next = kit.map((s) => ({ name: s.name, description: oneLine(s.text) }))
  if (JSON.stringify(next) !== JSON.stringify((b.skills || []).map((s) => ({ name: s.name, description: s.description })))) {
    b.skills = next
    ccChanges++
    log.push(`${b.name} — Combat Cycle kit (${next.map((s) => s.name).join(', ')})`)
  }
}

// ---------- Game-data extras (src/dcdl/data/game/*.json) ----------
// Data the site shows beyond the kit text, keyed by the site's own ids: champion base
// stats (already capped at the live max level by the export), talents, lore, skill-level
// unlock stars; legacy Gear Effects per star, skill upgrade paths, classes, art.
const STAT_LABEL = { HpHero: 'HP', AtkHero: 'ATK', DefHero: 'P. DEF', FortHero: 'S. DEF' }
const championData = {}
for (const [id, g] of championMatches) {
  championData[id] = {
    gameId: g.gameId,
    maxLevel: g.stats?.maxLevel ?? null,
    skillUnlocks: Object.fromEntries(g.skills.filter((s) => s.name).map((s) => [s.slot, s.levels.map((l) => l.unlockStar)])),
    // Full stat curve, level firstLevel..maxLevel, one array per stat (drives the 1–700 slider).
    curves: g.stats?.curves ? Object.fromEntries(Object.entries(g.stats.curves).map(([k, v]) => [STAT_LABEL[k] || k, v])) : null,
    firstLevel: g.stats?.firstLevel ?? 1,
    // Force talents with per-level effects and costs (AC/DC Shards + Dollars).
    talents: (g.talents || []).filter((t) => t.name && !/_/.test(t.name)).map((t) => ({
      name: t.name,
      enhanced: t.enhanced,
      text: t.text ? oneLine(t.text) : null,
      upgrades: t.upgrades.map((u) => ({ level: u.level, championLevel: u.requiresChampionLevel, acdc: u.cost?.acdc ?? 0, dollars: u.cost?.dollars ?? 0, effect: oneLine(u.effect) })),
    })),
    lore: g.lore.map((p) => ({ unlockStar: p.unlockStar, text: oneLine(p.text) })),
  }
}
// The in-game Strategy Guide, with the champions and legacy pieces it names resolved to site
// ids (null when the site has no page for one) so the page can link and pop them up.
const siteChampionByGameId = new Map([...championMatches].map(([id, g]) => [g.gameId, id]))
const siteLegacyByGameId = new Map([...legacyMatches].map(([id, p]) => [p.gameId, id]))
// Some pieces exist twice in the game (Honkin' Huge Hammer, Power Battery: a second copy for
// the Mythic+ champion) while the site has one page, so fall back to the name.
const siteLegacyByName = new Map([...legacyMatches].map(([id, p]) => [norm(p.name), id]))
for (const [id, g] of championMatches) {
  const gd = g.guide
  if (!gd) continue
  const piece = (p) => ({ id: siteLegacyByGameId.get(p.gameId) || siteLegacyByName.get(norm(p.name)) || null, name: p.name })
  championData[id].guide = {
    overview: oneLine(gd.overview),
    recommendedStats: gd.recommendedStats,
    tags: gd.tags,
    bestFor: gd.bestFor,
    legacyPieces: gd.legacyPieces.map((p) => ({ ...piece(p), reason: p.reason ? oneLine(p.reason) : null, signature: p.signature })),
    alternatives: gd.alternatives.map(piece),
    champions: gd.champions.map((c) => ({ id: siteChampionByGameId.get(c.gameId) || null, name: c.name })),
    lineups: gd.lineups,
  }
}
const legacyData = {}
const ART_DIR = path.join(ROOT, 'public/dcdl/legacy/legacy_art')
const artJobs = []
for (const [id, p] of legacyMatches) {
  const artName = p.images.art ? `${p.images.art}.webp` : null
  if (artName) {
    const src = readAllPaths(path.join(EXPORT, 'legacy'), `${p.images.art}.png`)
    if (src) artJobs.push({ src, dest: path.join(ART_DIR, artName) })
  }
  legacyData[id] = {
    quality: p.quality,
    uniqueTo: p.uniqueTo?.name || null,
    classes: p.classes,
    art: artName ? `/dcdl/legacy/legacy_art/${artName}` : null,
    // Compact table: one header row of stat names, then [starLabel, ...values] per star.
    gearEffects: p.gearEffects.length ? {
      stats: p.gearEffects[0].effects.map((e) => `${e.stat}${String(e.value).endsWith('%') ? ' %' : ''}`),
      rows: p.gearEffects.map((g) => [g.label, ...g.effects.map((e) => String(e.value))]),
    } : null,
    skills: p.skills.map((s) => ({
      name: s.name,
      kind: s.kind.startsWith('Exclusive') ? 'exclusive' : 'general',
      steps: s.textByUpgrade.map((u) => ({ label: u.label, text: oneLine(u.text) })),
    })),
    guide: p.guide,
  }
}
function readAllPaths(dir, file) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) { const hit = readAllPaths(p, file); if (hit) return hit }
    else if (e.name === file) return p
  }
  return null
}
const GAME_DIR = path.join(ROOT, 'src/dcdl/data/game')
const writeIfChanged = (file, data) => {
  const next = JSON.stringify(data, null, 2) + '\n'
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === next) return false
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, next)
  return true
}

console.log(`Game-data extras: ${Object.keys(championData).length} champions, ${Object.keys(legacyData).length} legacy pieces, ${artJobs.length} legacy art images`)
console.log(`Combat Cycle boss kits updated: ${ccChanges}`)
console.log(`Champion kit fields updated: ${kitChanges}${unmatched.length ? ` · unmatched: ${unmatched.join(', ')}` : ''}`)
console.log(`Legacy skill descriptions updated: ${legacyChanges}${legacyUnmatched.length ? ` · unmatched: ${legacyUnmatched.join(', ')}` : ''}`)
if (WRITE) {
  // Only touch files that changed (keeps the commit hook's "Updated:" stamps honest).
  if (kitChanges) fs.writeFileSync(herosPath, JSON.stringify(heros, null, 2) + '\n')
  if (legacyChanges) fs.writeFileSync(legacyPath, JSON.stringify(legacy, null, 2) + '\n')
  if (ccChanges) fs.writeFileSync(ccPath, JSON.stringify(cc, null, 2) + '\n')
  // One file per champion: each page reads only its own at build time (the combined file
  // with full stat curves is several MB).
  for (const [cid, d] of Object.entries(championData)) writeIfChanged(path.join(GAME_DIR, 'champions', `${cid}.json`), d)
  if (fs.existsSync(path.join(GAME_DIR, 'champions.json'))) fs.rmSync(path.join(GAME_DIR, 'champions.json'))
  // One file per legacy piece, read by its page with fs. Never in public/: that folder is
  // stripped from the page's function (next.config.js), so runtime re-renders lost the data.
  for (const [lid, d] of Object.entries(legacyData)) writeIfChanged(path.join(GAME_DIR, 'legacy', `${lid}.json`), d)
  // Legacy art: convert the game's PNGs to WebP once (skip ones already converted).
  const { default: sharp } = await import('sharp')
  fs.mkdirSync(ART_DIR, { recursive: true })
  for (const j of artJobs) if (!fs.existsSync(j.dest)) await sharp(j.src).webp({ quality: 82 }).toFile(j.dest)
  for (const j of forceJobs) if (!fs.existsSync(j.dest)) fs.copyFileSync(j.src, j.dest)
  console.log('Written.')
} else {
  console.log('Dry run — pass --write to apply. First changes:\n  ' + log.slice(0, 15).join('\n  '))
}
