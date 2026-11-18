// Update every Void Hunters hunter's kit on the site from the game's own numbers, and keep a
// redline of what changed in src/vh/data/kit-history.json (shown as "Kit History" on each hunter
// page: deleted words red + struck through, added words green).
//
// Source: kits.json built by E:\GameAssets\Exports\_pipeline\void-hunters\kits-from-balance.mjs
// from the balance table in a memory snapshot of the running game (see that folder's
// balance-extract.mjs). Only hunters already on the site are touched: hunters in the client that
// aren't on the site stay in the private NDA vault (Exports\void-hunters\_nda).
//
// Per skill: description, "Lv. N" upgrade lines, cooldown and tags come from the game. The site's
// convention is kept where the game can't say: the ★ count on a super-awaken line (which star
// unlocks it) and whether the description is shown with the super-awaken upgrade folded in (the
// description follows whichever game version the current text is closest to). Skill names keep
// the site's upper case. Boss-only Hunting Grounds traits (Sk_*_Trait_Miniboss) and Void traits
// the site doesn't list are left out. Stats, power, art, lore and tiers are never touched.
//
// History is append-only: an entry for this build is written once, from the text on the site
// before the update. Re-running after the update changes nothing (pass --rebuild-history only
// while the old text is still in hunters.json).
//
//   node scripts/sync-vh-kits.mjs                 # dry run
//   node scripts/sync-vh-kits.mjs --write         # write hunters.json + kit-history.json
//   VH_KITS=<path to kits.json>                   # default: the Hunting Grounds Playtest pull
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const KITS = process.env.VH_KITS || 'E:\\GameAssets\\Exports\\void-hunters\\_playtest\\alpha3 0.2089.12\\_memory\\kits\\kits.json'
const WRITE = process.argv.includes('--write')
const REBUILD = process.argv.includes('--rebuild-history')
const HUNTERS = path.join(ROOT, 'src', 'vh', 'data', 'hunters.json')
const HISTORY = path.join(ROOT, 'src', 'vh', 'data', 'kit-history.json')

// The build these kits come from (one history entry per build).
const BUILD = { id: 'hunting-grounds-playtest-2026-11', date: '2026-11-10', title: 'Hunting Grounds Playtest', from: 'Alpha' }

const L = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const norm = (s) => (s || '').replace(/\s+/g, ' ').trim()
const nums = (s) => (norm(s).match(/\d+(?:\.\d+)?%?/g) || []).join(',')

// ---- word-level diff (LCS over words, numbers, punctuation and whitespace runs)
const tok = (s) => (s || '').match(/\s+|[A-Za-z]+(?:'[a-z]+)?|\d+(?:\.\d+)?%?|[^\sA-Za-z\d]/g) || []
function diff(a, b) {
  const A = tok(a), B = tok(b), n = A.length, m = B.length
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const ops = []
  const push = (t, s) => { const last = ops[ops.length - 1]; if (last && last[0] === t) last[1] += s; else ops.push([t, s]) }
  let i = 0, j = 0
  while (i < n && j < m) {
    if (A[i] === B[j]) { push('=', A[i]); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) push('-', A[i++])
    else push('+', B[j++])
  }
  while (i < n) push('-', A[i++])
  while (j < m) push('+', B[j++])
  return ops
}
const changed = (ops) => ops.filter(([t]) => t !== '=').reduce((n, [, s]) => n + s.trim().length, 0)

// ---- load
const { hunters: kits, source } = JSON.parse(fs.readFileSync(KITS, 'utf8'))
const site = JSON.parse(fs.readFileSync(HUNTERS, 'utf8'))
const history = fs.existsSync(HISTORY) ? JSON.parse(fs.readFileSync(HISTORY, 'utf8')) : {}
const hasEntry = (id) => (history[id] || []).some((e) => e.id === BUILD.id)

const isBossOnly = (id) => /_Trait_Miniboss$/i.test(id)
const isVoidTrait = (id) => /_Trait_Void$/i.test(id)
// The page groups skills as Basic / Special / Trait; the game also has "EnduringTrait" etc.
const typeOf = (ks) => (/basic/i.test(ks.type || ks.id) ? 'Basic' : /special/i.test(ks.type || ks.id) ? 'Special' : 'Trait')
const oneLine = (s) => norm(String(s).replace(/\n+/g, ' '))

const report = { hunters: 0, skillsChanged: 0, skillsAdded: 0, skillsRemoved: 0, renamed: 0, unchanged: 0, starLinesKept: [], notFound: [] }

for (const h of site) {
  const k = kits.find((x) => L(x.name) === L(h.name))
  if (!k) { report.notFound.push(h.name); continue }
  const old = h.skills || []
  const used = new Set()
  const entry = { ...BUILD, skills: [] }

  // match site skills to game skills by name; one leftover on each side = a rename
  const matchOf = new Map()
  for (const s of old) { const ks = k.skills.find((x) => L(x.name) === L(s.name)); if (ks) { matchOf.set(s, ks); used.add(ks.id) } }
  const leftOld = old.filter((s) => !matchOf.has(s))
  const leftNew = k.skills.filter((x) => !used.has(x.id) && !isBossOnly(x.id) && !isVoidTrait(x.id))
  if (leftOld.length === 1 && leftNew.length === 1) { matchOf.set(leftOld[0], leftNew[0]); used.add(leftNew[0].id); leftNew.length = 0 }

  const next = []
  for (const ks of k.skills) {
    if (isBossOnly(ks.id)) continue
    const s = old.find((o) => matchOf.get(o) === ks)
    if (!s && !leftNew.includes(ks)) continue // Void traits etc. the site never listed
    const max = ks.levels.at(-1) || {}
    // description: whichever game version the site's current text is closest to
    const versions = [{ v: max, awakened: false }, ...(ks.awaken?.text ? [{ v: ks.awaken, awakened: true }] : [])]
    let pick = versions[0]
    if (s) {
      let best = Infinity
      for (const c of versions) { const d = changed(diff(norm(s.description), norm(c.v.text))); if (d < best) { best = d; pick = c } }
    }
    const lvLines = ks.levels.filter((l) => l.level > 1 && l.upgrade).map((l) => `Lv. ${l.level}: ${l.upgrade}`)
    // ★ lines: keep the site's star count, refresh the text from the game
    const starLines = []
    for (const u of (s?.upgrades || []).filter((x) => /^★/.test(x))) {
      const stars = u.match(/^★+/)[0]
      const rest = norm(u.slice(stars.length))
      if (ks.awaken?.upgrade) starLines.push(`${stars} ${oneLine(ks.awaken.upgrade)}`)
      else { starLines.push(u); report.starLinesKept.push(`${h.name} / ${s.name}: ${rest.slice(0, 60)}`) }
    }
    if (!s && ks.awaken?.upgrade) starLines.push(`★ ${oneLine(ks.awaken.upgrade)}`)
    const type = typeOf(ks)
    const cooldown = type === 'Basic' ? null : (pick.v.cooldown || max.cooldown || null)
    const renamed = s && L(s.name) !== L(ks.name)
    const name = s && !renamed ? s.name : ks.name.toUpperCase()
    const nextSkill = {
      order: next.length + 1, name, level: 'Max', type, cooldown,
      tags: pick.v.tags?.length ? pick.v.tags : (s?.tags || []),
      description: pick.v.text || s?.description || '',
      upgrades: [...lvLines, ...starLines],
      image: s?.image ?? null,
    }
    next.push(nextSkill)

    // history
    if (!s) { entry.skills.push({ name: nextSkill.name, change: 'added', text: nextSkill.description }); report.skillsAdded++; continue }
    const dOps = diff(norm(s.description), norm(nextSkill.description))
    const oldLv = s.upgrades.join('\n'), newLv = nextSkill.upgrades.join('\n')
    const uOps = oldLv === newLv ? null : diff(oldLv, newLv)
    if (!changed(dOps) && !(uOps && changed(uOps)) && !renamed) { report.unchanged++; continue }
    entry.skills.push({
      name: nextSkill.name, ...(renamed ? { renamedFrom: s.name } : {}),
      change: renamed ? 'renamed' : 'changed',
      kind: nums(s.description) !== nums(nextSkill.description) || nums(oldLv) !== nums(newLv) ? 'numbers' : 'wording',
      ops: dOps, ...(uOps && changed(uOps) ? { upgradeOps: uOps } : {}),
    })
    if (renamed) report.renamed++; else report.skillsChanged++
  }
  for (const s of old) if (!matchOf.has(s)) { entry.skills.push({ name: s.name, change: 'removed', text: s.description }); report.skillsRemoved++ }

  h.skills = next
  if (entry.skills.length && (!hasEntry(h.id) || REBUILD)) {
    history[h.id] = [...(history[h.id] || []).filter((e) => e.id !== BUILD.id), entry].sort((a, b) => b.date.localeCompare(a.date))
  }
  report.hunters++
}

console.log(`Source: ${KITS} (${source})`)
console.log(`${report.hunters} hunters: ${report.skillsChanged} skills changed, ${report.renamed} renamed, ${report.skillsAdded} added, ${report.skillsRemoved} removed, ${report.unchanged} unchanged.`)
console.log(`History entries for "${BUILD.title}": ${Object.values(history).filter((es) => es.some((e) => e.id === BUILD.id)).length} hunters.`)
if (report.starLinesKept.length) console.log(`★ lines kept as they were (no super-awaken upgrade text in the game data):\n  ${report.starLinesKept.join('\n  ')}`)
if (report.notFound.length) console.log(`Not in the game data (left alone): ${report.notFound.join(', ')}`)
if (WRITE) {
  fs.writeFileSync(HUNTERS, JSON.stringify(site, null, 2) + '\n')
  fs.writeFileSync(HISTORY, JSON.stringify(history, null, 1) + '\n')
  console.log('Wrote hunters.json + kit-history.json')
} else console.log('Dry run: nothing written (pass --write).')
