// Build the site's Invokers: Titan Legacy data from the game-data export
// (E:\GameAssets\Exports\invokers, built by E:\GameAssets\Exports\_pipeline\invokers\update.mjs).
//
// Writes:
//   src/inv/data/roster.json             one slim row per Invoker/Titan (grid, tier lists, links)
//   src/inv/data/units/<kind>/<slug>.json full record per unit (stats, skills × 11 levels, tolerances, bio)
//   src/inv/data/tier-lists.json         the official tier lists, one per boss (invokers + titans)
//   src/inv/data/meta.json               chip icons/colours (element, class, faction, soul sign, role)
//   public/invokers/units/<kind>/<slug>/  portrait.webp, full.webp, skills/<n>.webp
//   public/invokers/icons/...             element / class / faction / soul sign / role icons
//
// Anything the export marks hidden or coming soon is skipped (creator-program NDA: only
// released content goes on the site).
//
//   node scripts/sync-invokers.mjs          # dry run: counts only
//   node scripts/sync-invokers.mjs --write  # write data + images
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const EXPORT = process.env.INV_EXPORT || 'E:\\GameAssets\\Exports\\invokers'
const WRITE = process.argv.includes('--write')
const DATA = path.join(ROOT, 'src', 'inv', 'data')
const PUB = path.join(ROOT, 'public', 'invokers')

// Tier → points for the Overall score (average across every boss list a unit appears on).
const TIER_POINTS = { 'S+': 7, S: 6, 'A+': 5, A: 4, B: 3, C: 2, D: 1, E: 0 }
const POINT_TIERS = Object.entries(TIER_POINTS).sort((a, b) => b[1] - a[1])

const decode = (s) =>
  typeof s === 'string'
    ? s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    : s

const SKILL_LABEL = (t) =>
  t === 'Combo' ? 'Combo Attack'
  : /^Active Skill(\d)$/.test(t) ? `Skill ${t.slice(-1)}`
  : t === 'Anima In' ? 'Invokation'
  : t

// "omnissi-astral" → "Astral Omnissi"; "althar" → "Althar". The export's invoker lists call
// the Omnissi variants "Garuda" in their titles and the titan lists "Omnissi"; one name here.
function bossName(id) {
  const m = id.match(/^omnissi-(\w+)$/)
  if (m) return `${m[1][0].toUpperCase()}${m[1].slice(1)} Omnissi`
  return id[0].toUpperCase() + id.slice(1)
}
// The per-unit ratings name lists by title ("Astral Garuda", "Althar Titan"); map to ids.
function ratingListId(name) {
  const n = name.replace(/ Titan$/, '')
  const m = n.match(/^(\w+) (Garuda|Omnissi)$/)
  return m ? `omnissi-${m[1].toLowerCase()}` : n.toLowerCase()
}

// Overall score: the average of a unit's tier points across every boss list it is on, 0–100.
function overallScore(ratings) {
  const pts = Object.values(ratings).map((t) => TIER_POINTS[t]).filter((p) => p !== undefined)
  if (!pts.length) return null
  const avg = pts.reduce((a, b) => a + b, 0) / pts.length
  return { tier: null, score: Math.round((avg / 7) * 1000) / 10, lists: pts.length }
}

// Overall tier. A plain rounded average squeezes everyone toward the middle (the best Invoker
// averages about A+), so units are ranked by score and tiers are handed out in the same
// proportions the boss lists themselves use. Equal scores always share a tier.
function assignOverallTiers(entries, lists) {
  const share = Object.fromEntries(POINT_TIERS.map(([t]) => [t, 0]))
  for (const l of lists) {
    const counts = l.rows.map((r) => [r.tier, r.groups.reduce((n, g) => n + g.members.length, 0)])
    const total = counts.reduce((n, [, c]) => n + c, 0)
    for (const [t, c] of counts) if (t in share && total) share[t] += c / total / lists.length
  }
  const ranked = entries.filter((e) => e.overall).sort((a, b) => b.overall.score - a.overall.score)
  let cum = 0
  const cuts = POINT_TIERS.map(([t]) => [t, (cum += share[t]) * ranked.length])
  ranked.forEach((e, i) => {
    const prev = ranked[i - 1]
    e.overall.tier =
      prev && prev.overall.score === e.overall.score
        ? prev.overall.tier
        : (cuts.find(([, c]) => i < c - 1e-9)?.[0] ?? 'E')
  })
}

const slugFile = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function writeImage(src, dest, resize) {
  if (!fs.existsSync(src)) return false
  if (!WRITE) return true
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  if (fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs) return true
  let img = sharp(src)
  if (resize) img = img.resize({ ...resize, fit: 'inside', withoutEnlargement: true })
  await img.webp({ quality: 82 }).toFile(dest)
  return true
}

// ── Chip icons + colours (from the scraped site records) ─────────────────────
const characters = (() => {
  const raw = path.join(EXPORT, '_raw')
  const runs = fs.existsSync(raw) ? fs.readdirSync(raw).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort() : []
  for (const r of runs.reverse()) {
    const p = path.join(raw, r, 'site', 'characters.json')
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'))
  }
  return []
})()
const ASSETS = path.join(EXPORT, '_assets')
const meta = { element: {}, class: {}, faction: {}, soulSign: {}, role: {}, tolerance: {} }
const GROUP_KEY = { Element: 'element', Class: 'class', Faction: 'faction', 'Soul Sign': 'soulSign', Role: 'role' }
const iconJobs = []
function siteIcon(url, sub, name) {
  if (!url) return null
  const src = path.join(ASSETS, ...url.split('/').filter(Boolean))
  if (!fs.existsSync(src)) return null
  const rel = `/invokers/icons/${sub}/${slugFile(name)}.webp`
  iconJobs.push([src, path.join(ROOT, 'public', rel)])
  return rel
}
for (const c of characters) {
  for (const ch of c.heroChips || []) {
    const k = GROUP_KEY[ch.group]
    if (!k || meta[k][ch.label]) continue
    meta[k][ch.label] = { icon: siteIcon(ch.iconUrl, k, ch.label), color: ch.color || null }
  }
  for (const t of c.tolerances || []) {
    if (meta.tolerance[t.label]) continue
    meta.tolerance[t.label] = { icon: siteIcon(t.iconUrl, 'tolerance', t.label), color: t.color || null }
  }
}

// ── Units ─────────────────────────────────────────────────────────────────────
const roster = []
const records = []
const units = []
let skipped = 0
for (const kind of ['invokers', 'titans']) {
  const dir = path.join(EXPORT, kind)
  const file = kind === 'invokers' ? 'invoker.json' : 'titan.json'
  for (const faction of fs.readdirSync(dir)) {
    for (const name of fs.readdirSync(path.join(dir, faction))) {
      const base = path.join(dir, faction, name)
      const p = path.join(base, file)
      if (!fs.existsSync(p)) continue
      const u = JSON.parse(fs.readFileSync(p, 'utf8'))
      if (u.hidden || u.comingSoon) { skipped++; continue }
      units.push({ kind, base, u })
    }
  }
}

const imgJobs = []
for (const { kind, base, u } of units) {
  const pubDir = `/invokers/units/${kind}/${u.slug}`
  const img = (f) => `${pubDir}/${f}`
  imgJobs.push([path.join(base, 'portrait.webp'), path.join(ROOT, 'public', img('portrait.webp')), null])
  imgJobs.push([path.join(base, 'full-art.webp'), path.join(ROOT, 'public', img('full.webp')), { width: 1000, height: 1000 }])

  const ratings = {}
  let role = null
  for (const r of u.officialTierRatings || []) {
    ratings[ratingListId(r.list)] = r.tier
    role ??= r.role
  }

  const skills = u.skills.map((s, i) => {
    const icon = s.icon && fs.existsSync(path.join(base, 'skills', s.icon)) ? img(`skills/${i}.webp`) : null
    if (icon) imgJobs.push([path.join(base, 'skills', s.icon), path.join(ROOT, 'public', icon), { width: 128, height: 128 }])
    return {
      name: decode(s.name),
      type: s.type,
      label: SKILL_LABEL(s.type),
      aoe: !!s.isAoe,
      icon,
      effects: (s.effects || []).map((e) => ({ label: decode(e.label), group: e.group, description: decode(e.description) })),
      manaGen: s.manaGen?.ult || s.manaGen?.titan ? { ult: s.manaGen.ult, titan: s.manaGen.titan } : null,
      levels: s.levels.map((l) => ({ level: l.level, crown: !!l.crown, cooldown: l.cooldown, cost: l.cost, text: decode(l.text || '').trim() })),
    }
  })

  const stats = {}
  for (const tier of ['base', 'max']) {
    stats[tier] = Object.fromEntries(Object.entries(u.stats?.[tier] || {}).map(([k, v]) => [decode(k), v]))
  }

  const record = {
    slug: u.slug,
    kind: u.kind,
    name: decode(u.name),
    faction: u.faction,
    rarity: u.rarity,
    class: u.class,
    element: u.element,
    soulSign: u.soulSign,
    gender: u.gender,
    role,
    portrait: img('portrait.webp'),
    fullArt: img('full.webp'),
    stats,
    skills,
    tolerances: (u.tolerances || []).map((t) => ({ label: t.label, byLevel: t.byLevel })),
    corruptions: u.corruptions || [],
    bio: decode(u.bio || ''),
    ratings,
    overall: overallScore(ratings),
  }

  roster.push({
    slug: record.slug,
    kind: record.kind,
    name: record.name,
    faction: record.faction,
    rarity: record.rarity,
    class: record.class,
    element: record.element,
    soulSign: record.soulSign,
    role,
    portrait: record.portrait,
    aoe: skills.filter((s) => s.aoe).length,
    effects: [...new Set(skills.flatMap((s) => s.effects.map((e) => e.label)))],
    max: { hp: stats.max.Health ?? stats.max['Bonus HP'] ?? null, atk: stats.max.Attack ?? stats.max['Bonus ATK'] ?? null, def: stats.max.Defense ?? stats.max['Bonus DEF'] ?? null },
    ratings,
    overall: record.overall, // same object as the record's, so the tier assigned below lands in both
  })
  records.push(record)
}
roster.sort((a, b) => a.name.localeCompare(b.name))

// ── Tier lists ────────────────────────────────────────────────────────────────
const known = new Set(roster.map((r) => `${r.kind}:${r.slug}`))
const rawLists = JSON.parse(fs.readFileSync(path.join(EXPORT, 'tier-lists', 'tier-lists.json'), 'utf8'))
const tierLists = rawLists.map((l) => {
  const kind = l.kind === 'titans' ? 'Titan' : 'Invoker'
  return {
    id: l.list,
    kind,
    boss: bossName(l.list),
    rows: l.rows.map((r) => ({
      tier: r.tier,
      groups: r.groups
        .map((g) => ({ role: g.role, members: g.members.filter((m) => known.has(`${kind}:${m}`)) }))
        .filter((g) => g.members.length),
    })),
  }
})
const order = (id) => (id.startsWith('omnissi-') ? 1 : 0)
tierLists.sort((a, b) => a.kind.localeCompare(b.kind) || order(a.id) - order(b.id) || a.boss.localeCompare(b.boss))

for (const kind of ['Invoker', 'Titan']) {
  assignOverallTiers(roster.filter((r) => r.kind === kind), tierLists.filter((l) => l.kind === kind))
}

// ── Write ─────────────────────────────────────────────────────────────────────
const inv = roster.filter((r) => r.kind === 'Invoker').length
console.log(`${inv} Invokers, ${roster.length - inv} Titans (${skipped} hidden/coming-soon skipped), ${tierLists.length} tier lists`)
if (!WRITE) {
  console.log('Dry run. Re-run with --write to write data and images.')
  process.exit(0)
}

// Drop unit files for anything no longer on the roster.
for (const kind of ['invokers', 'titans']) {
  const dir = path.join(DATA, 'units', kind)
  if (!fs.existsSync(dir)) continue
  const keep = new Set(roster.filter((r) => `${r.kind.toLowerCase()}s` === kind).map((r) => `${r.slug}.json`))
  for (const f of fs.readdirSync(dir)) if (!keep.has(f)) fs.rmSync(path.join(dir, f))
}

for (const record of records) {
  const out = path.join(DATA, 'units', `${record.kind.toLowerCase()}s`, `${record.slug}.json`)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, JSON.stringify(record, null, 1) + '\n')
}

fs.mkdirSync(DATA, { recursive: true })
fs.writeFileSync(path.join(DATA, 'roster.json'), JSON.stringify(roster, null, 1) + '\n')
fs.writeFileSync(path.join(DATA, 'tier-lists.json'), JSON.stringify(tierLists, null, 1) + '\n')
fs.writeFileSync(path.join(DATA, 'meta.json'), JSON.stringify(meta, null, 1) + '\n')

let n = 0
for (const [src, dest, resize] of [...imgJobs, ...iconJobs.map(([s, d]) => [s, d, null])]) {
  if (await writeImage(src, dest, resize)) n++
}
console.log(`Wrote roster, ${roster.length} unit files, tier lists, meta and ${n} images.`)
