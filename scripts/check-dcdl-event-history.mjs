/**
 * Checks src/dcdl/data/event-history.json against the official-post archive and prints
 * the patterns derived from it.
 *
 *   node scripts/check-dcdl-event-history.mjs            # verify + pattern report
 *   node scripts/check-dcdl-event-history.mjs --quiet    # verify only
 *   node scripts/check-dcdl-event-history.mjs --write    # verify, then stamp each source with its post date (postedAt)
 *
 * Verification: every source quote must appear in the cited game_posts body (whitespace,
 * case and curly quotes normalised), every champion id must exist in heros.json, every
 * legacyId in legacy.json, every rerunOf must name an earlier event. Exits 1 on any failure.
 * Never writes to Supabase; --write only adds postedAt to the sources in the data file.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadEnvLocal() {
  const file = path.join(root, '.env.local')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnvLocal()

const QUIET = process.argv.includes('--quiet')
const WRITE = process.argv.includes('--write')
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SB_URL || !SB_KEY) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.'); process.exit(1) }
const supabase = createClient(SB_URL, SB_KEY)

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'))
const data = readJson('src/dcdl/data/event-history.json')
const asList = (x) => (Array.isArray(x) ? x : Object.values(x))
const heroIds = new Set(asList(readJson('src/dcdl/data/heros.json')).map((h) => h.id))
const legacyIds = new Set(asList(readJson('src/dcdl/data/legacy.json')).map((l) => l.id))

const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/\s+/g, ' ').toLowerCase().trim()

// Every { sources: [...] } anywhere in the file, with a label for error messages.
const cited = []
function walk(node, label) {
  if (Array.isArray(node)) { node.forEach((n, i) => walk(n, `${label}[${i}]`)); return }
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node.sources)) for (const s of node.sources) cited.push({ ...s, label: `${label} ${node.id || node.name || node.date || ''}`.trim() })
  for (const [k, v] of Object.entries(node)) if (k !== 'sources') walk(v, label ? `${label}.${k}` : k)
}
walk(data, '')

const ids = [...new Set(cited.map((c) => c.post))]
const bodies = new Map()
for (let i = 0; i < ids.length; i += 100) {
  const { data: rows, error } = await supabase.from('game_posts').select('id, body, posted_at').eq('game', 'dcdl').in('id', ids.slice(i, i + 100))
  if (error) { console.error(error.message); process.exit(1) }
  for (const r of rows) bodies.set(r.id, { body: norm(r.body), postedAt: r.posted_at.slice(0, 10) })
}

const errors = []
for (const c of cited) {
  const post = bodies.get(c.post)
  if (!post) errors.push(`${c.label}: post ${c.post} not in game_posts`)
  else if (!c.quote) errors.push(`${c.label}: source ${c.post} has no quote`)
  else if (!post.body.includes(norm(c.quote))) errors.push(`${c.label}: quote not found in ${c.post}: "${c.quote}"`)
}
for (const ch of data.champions) {
  if (!heroIds.has(ch.id)) errors.push(`champion id not in heros.json: ${ch.id}`)
  for (const f of ch.facts) if (f.legacyId && !legacyIds.has(f.legacyId)) errors.push(`${ch.id}: legacyId not in legacy.json: ${f.legacyId}`)
}
const eventById = new Map(data.events.map((e) => [e.id, e]))
for (const e of data.events) {
  for (const id of [...(e.featured || []), ...(e.newChampions || [])]) if (!heroIds.has(id)) errors.push(`event ${e.id}: champion id not in heros.json: ${id}`)
  if (e.rerunOf && !(eventById.get(e.rerunOf)?.start < e.start)) errors.push(`event ${e.id}: rerunOf ${e.rerunOf} is missing or not earlier`)
}

console.log(`Checked ${cited.length} citations across ${ids.length} posts, ${data.champions.length} champions, ${data.events.length} events.`)
if (errors.length) { console.log(`\n${errors.length} problem(s):`); for (const e of errors) console.log('  - ' + e); process.exit(1) }
console.log('All citations verified.')
if (WRITE) {
  const file = path.join(root, 'src/dcdl/data/event-history.json')
  const stamp = (node) => {
    if (Array.isArray(node)) return node.forEach(stamp)
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node.sources)) for (const s of node.sources) s.postedAt = bodies.get(s.post).postedAt
    Object.values(node).forEach(stamp)
  }
  stamp(data)
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
  console.log('Stamped postedAt on every source.')
}
if (QUIET) process.exit(0)

// ---------- Pattern report (observations derived from the facts above) ----------
const day = (d) => new Date(d + (d.length === 7 ? '-01' : '') + 'T00:00:00Z').getTime()
const gap = (a, b) => Math.round((day(b) - day(a)) / 86400000)
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const line = (s = '') => console.log(s)

line('\n== Event reruns (gap from previous run) ==')
for (const e of data.events.filter((x) => x.rerunOf)) {
  const chain = data.events.filter((x) => x.id === e.rerunOf || x.rerunOf === e.rerunOf).sort((a, b) => a.start.localeCompare(b.start))
  const prev = chain[chain.indexOf(e) - 1]
  line(`  ${e.name}: ${prev.start} -> ${e.start}  (${gap(prev.start, e.start)} days)`)
}

line('\n== Themed event per month ==')
const themed = data.events.filter((e) => e.kind === 'themed' && e.start.length === 10)
for (const e of themed) {
  const r = e.rewards || {}
  line(`  ${e.start}  ${e.name.padEnd(34)} ${(e.mechanic || '').padEnd(15)} ${r.baseSkin ? 'base skin: ' + r.baseSkin : r.room ? 'room style' : ''}${e.rerunOf ? '  [rerun]' : ''}${e.newChampions ? '  new: ' + e.newChampions.join(', ') : ''}`)
}
const fromJune25 = themed.filter((e) => e.start >= '2025-06-01')
const months = new Set(fromJune25.map((e) => e.start.slice(0, 7)))
line(`  Since June 2025: ${fromJune25.length} themed events in ${months.size} distinct months; start day-of-month ${Math.min(...fromJune25.map((e) => +e.start.slice(8)))}-${Math.max(...fromJune25.map((e) => +e.start.slice(8)))}.`)

line('\n== Champion reveal cadence (reveal / event-debut posts) ==')
const firsts = data.champions.map((c) => ({ c, f: c.facts.find((f) => ['revealed', 'event-debut'].includes(f.type)) })).filter((x) => x.f).sort((a, b) => a.f.date.localeCompare(b.f.date))
let prev = null
const gaps = []
for (const { c, f } of firsts) { const g = prev ? gap(prev, f.date) : null; if (g != null) gaps.push(g); line(`  ${f.date}  ${c.name}${f.type === 'event-debut' ? ' (event)' : ''}${g != null ? `  +${g}d` : ''}`); prev = f.date }
line(`  Median gap between new champions: ${median(gaps)} days (n=${gaps.length}).`)

line('\n== Reveal -> legacy piece named in patch notes ==')
for (const c of data.champions) {
  const r = c.facts.find((f) => f.type === 'revealed'); const l = c.facts.find((f) => f.type === 'legacy')
  if (r && l) line(`  ${c.name}: ${gap(r.date, l.date)} days`)
}

line('\n== Event-debut champion -> regular pool (Bleed / Mother Boxes) ==')
for (const c of data.champions) {
  const d = c.facts.find((f) => f.type === 'event-debut'); const s = c.facts.find((f) => f.type === 'standard')
  if (d && s) line(`  ${c.name}: ${gap(d.date, s.date)} days`)
}

line('\n== Champion reruns found in official posts ==')
const reruns = data.champions.flatMap((c) => c.facts.filter((x) => ['rerun', 'permanent-pool'].includes(x.type)).map((f) => ({ c, f })))
for (const { c, f } of reruns.sort((a, b) => a.f.date.localeCompare(b.f.date))) {
  const first = [...c.facts].sort((a, b) => a.date.localeCompare(b.date))[0]
  const since = first !== f ? `  [${gap(first.date, f.date)} days after the earliest dated fact, ${first.date}]` : '  [earliest dated fact for this champion]'
  line(`  ${f.date}  ${c.name}: ${f.type}${f.servers ? ` (${f.servers})` : ''}${since}`)
}
