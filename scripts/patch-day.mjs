/**
 * Patch-day helper: which official posts (game_posts) haven't been turned into drafts yet.
 * Used by the patch-day skill (.claude/skills/patch-day/SKILL.md); see docs/EDITORIAL.md.
 *
 *   node scripts/patch-day.mjs                    # list new posts per game with a suggested action (read-only)
 *   node scripts/patch-day.mjs --json out.json    # …and dump them with full bodies for drafting (read-only)
 *   node scripts/patch-day.mjs show <post_id>     # print one post in full (read-only)
 *   node scripts/patch-day.mjs mark <post_id…> --outcome drafted|skipped [--guides a,b] [--history uuid,uuid] [--note "…"]
 *   node scripts/patch-day.mjs draft drafts.json [--write]   # validate drafts (NDA names, block format, ids); --write saves them as pending
 *   node scripts/patch-day.mjs upload <image> guides/<game>/<guide-id>/<name>.webp   # guide art → content-images (webp)
 *   node scripts/patch-day.mjs baseline --before YYYY-MM-DD   # one-time: mark every older unlogged post as handled
 *
 * "Handled" lives in the private `patch_day_log` table (one row per post). A post that
 * was logged but has grown since (a patch note finished arriving, a fill-in appended) is
 * listed again as CHANGED, so the new part can be drafted too.
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
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

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SB_URL || !SB_KEY) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.'); process.exit(1) }
const supabase = createClient(SB_URL, SB_KEY)

const args = process.argv.slice(2)
const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null)
const list = (name) => (flag(name) ? flag(name).split(',').map((s) => s.trim()).filter(Boolean) : [])
const today = new Date().toISOString().slice(0, 10)

const GAMES = ['dcdl', 'godforge', 'invokers', 'voidhunters']
const GAME_LABEL = { dcdl: 'DC: Dark Legion', godforge: 'Godforge', invokers: 'Invokers', voidhunters: 'Void Hunters' }
// A post this much longer than when it was logged has new text worth a look.
const GROWTH = 40

async function fetchAll(table, columns) {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + 999)
    if (error) { console.error(`${table}: ${error.message}`); process.exit(1) }
    rows.push(...data)
    if (data.length < 1000) break
  }
  return rows
}

/** A hint only: the session reads every post and makes the call (docs/EDITORIAL.md). */
function suggest(p) {
  const t = `${p.title}\n${p.body.slice(0, 400)}`
  const RELEASE = /\b(enters|is here|is now (live|available)|now live|has (started|begun|arrived)|is live|available now|arrives)\b/i
  const TEASER = /\b(coming|next week|soon|get ready|teaser|reveal|roadmap|still out there|think you'?re ready)\b/i
  if (p.kind === 'codes') return ['codes', `gift code: update Site Admin → ${GAME_LABEL[p.game]} → Game Info codes`]
  // Official channels sometimes post a launch with a video link ("Godforge Duels is LIVE").
  if (p.kind === 'video' && p.source !== 'latest-videos' && RELEASE.test(t)) return ['maybe', 'release posted with a video link: fact-check it is live']
  if (p.kind === 'video') return ['skip', 'video link']
  if (p.kind === 'maintenance') return ['skip', 'maintenance notice']
  if (p.kind === 'patch_notes') {
    if (p.game === 'dcdl') return ['draft', 'patch notes: History entries + reaction post']
    if (p.game === 'voidhunters') return ['draft', /hunt report/i.test(t) ? 'Hunt Report' : 'dev update / announcement']
    return ['draft', 'update notes']
  }
  if (p.kind === 'community') {
    return /feedback report|community update|feedback update/i.test(t) ? ['maybe', 'dev feedback report (upcoming changes: check what is live)'] : ['skip', 'community post']
  }
  // announcements: a teaser title wins over release words further down the body
  if (TEASER.test(p.title)) return ['skip', 'teaser / roadmap: not a release']
  if (RELEASE.test(t)) return ['maybe', 'possible release / event start: fact-check it is live']
  if (TEASER.test(t)) return ['skip', 'teaser / roadmap: not a release']
  return ['maybe', 'announcement']
}

const fmtAge = (iso) => {
  const d = Math.floor((Date.now() - Date.parse(iso)) / 86400000)
  return d === 0 ? 'today' : d === 1 ? '1 day ago' : `${d} days ago`
}

const cmd = args[0] && !args[0].startsWith('--') ? args[0] : 'list'

if (cmd === 'show') {
  const id = args[1]
  const { data, error } = await supabase.from('game_posts').select('*').eq('id', id).maybeSingle()
  if (error || !data) { console.error(error?.message ?? `no game_posts row ${id}`); process.exit(1) }
  console.log(`${GAME_LABEL[data.game]} · ${data.kind} · ${data.source} · ${data.posted_at}\n${data.title}\n`)
  console.log(data.body)
  if (data.images?.length) console.log(`\nimages:\n${data.images.join('\n')}`)
  const { data: log } = await supabase.from('patch_day_log').select('*').eq('post_id', id).maybeSingle()
  if (log) console.log(`\nlogged ${log.processed_at.slice(0, 10)}: ${log.outcome}${log.note ? ` (${log.note})` : ''}`)
  process.exit(0)
}

if (cmd === 'upload') {
  // Guide art → content-images/guides/<game>/<guide-id>/<name>.webp (the 2026-10-17 drafts' layout).
  const [file, key] = args.slice(1)
  if (!file || !key || !/^guides\/(dcdl|godforge|invokers|voidhunters)\/[a-z0-9-]+\/[a-z0-9-]+\.webp$/.test(key)) {
    console.error('usage: upload <local image> guides/<game>/<guide-id>/<name>.webp'); process.exit(1)
  }
  if (/[\\/]_nda[\\/]|\[NDA\]/i.test(path.resolve(file))) { console.error('Refused: that file is in the NDA vault.'); process.exit(1) }
  const sharp = (await import('sharp')).default
  const buf = await sharp(fs.readFileSync(file)).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
  const { error } = await supabase.storage.from('content-images').upload(key, buf, { contentType: 'image/webp', upsert: true, cacheControl: '86400' })
  if (error) { console.error(error.message); process.exit(1) }
  console.log(`${SB_URL}/storage/v1/object/public/content-images/${key}`)
  process.exit(0)
}

const posts = await fetchAll('game_posts', 'id, game, kind, source, title, body, images, posted_at')
const byId = new Map(posts.map((p) => [p.id, p]))

if (cmd === 'draft') {
  await draft(args[1], args.includes('--write'))
  process.exit(0)
}

if (cmd === 'mark') {
  const ids = args.slice(1).filter((a, i, all) => !a.startsWith('--') && !(i > 0 && all[i - 1].startsWith('--')))
  const outcome = flag('--outcome')
  if (!['drafted', 'skipped'].includes(outcome)) { console.error('--outcome must be drafted or skipped'); process.exit(1) }
  if (!ids.length) { console.error('Give at least one post id.'); process.exit(1) }
  const missing = ids.filter((id) => !byId.has(id))
  if (missing.length) { console.error(`Not in game_posts: ${missing.join(', ')}`); process.exit(1) }
  const { data: existing } = await supabase.from('patch_day_log').select('post_id, guide_ids, history_ids').in('post_id', ids)
  const prev = new Map((existing ?? []).map((r) => [r.post_id, r]))
  const rows = ids.map((id) => {
    const p = byId.get(id)
    const old = prev.get(id)
    return {
      post_id: id,
      game: p.game,
      posted_at: p.posted_at,
      outcome,
      body_len: p.body.length,
      // A CHANGED post logged twice keeps the drafts from both runs.
      guide_ids: [...new Set([...(old?.guide_ids ?? []), ...list('--guides')])],
      history_ids: [...new Set([...(old?.history_ids ?? []), ...list('--history')])],
      note: flag('--note'),
      run_id: today,
      processed_at: new Date().toISOString(),
    }
  })
  const { error } = await supabase.from('patch_day_log').upsert(rows, { onConflict: 'post_id' })
  if (error) { console.error(error.message); process.exit(1) }
  console.log(`logged ${rows.length} post(s) as ${outcome}`)
  process.exit(0)
}

const log = await fetchAll('patch_day_log', 'post_id, outcome, body_len, processed_at')
const logged = new Map(log.map((r) => [r.post_id, r]))

if (cmd === 'baseline') {
  const before = flag('--before')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(before ?? '')) { console.error('baseline needs --before YYYY-MM-DD'); process.exit(1) }
  const rows = posts
    .filter((p) => !logged.has(p.id) && p.posted_at < before)
    .map((p) => ({ post_id: p.id, game: p.game, posted_at: p.posted_at, outcome: 'baseline', body_len: p.body.length, run_id: 'baseline', note: `older than ${before} when the patch-day workflow started` }))
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from('patch_day_log').upsert(rows.slice(i, i + 500), { onConflict: 'post_id' })
    if (error) { console.error(error.message); process.exit(1) }
  }
  console.log(`baseline: logged ${rows.length} post(s) older than ${before}`)
  process.exit(0)
}

if (cmd !== 'list') { console.error(`Unknown command "${cmd}".`); process.exit(1) }

// ── list (read-only) ─────────────────────────────────────────────────────────
const pending = posts
  .map((p) => {
    const l = logged.get(p.id)
    if (!l) return { ...p, state: 'NEW' }
    if (p.body.length > l.body_len + GROWTH) return { ...p, state: 'CHANGED', grew: p.body.length - l.body_len, was: l.outcome }
    return null
  })
  .filter(Boolean)
  .sort((a, b) => a.posted_at.localeCompare(b.posted_at))

console.log(`Patch day ${today}: ${posts.length} posts in the archive, ${log.length} already handled.\n`)
console.log('Latest post per game (if one looks stale, run the Discord sync first):')
for (const g of GAMES) {
  const latest = posts.filter((p) => p.game === g).sort((a, b) => b.posted_at.localeCompare(a.posted_at))[0]
  console.log(`  ${GAME_LABEL[g].padEnd(16)} ${latest ? `${latest.posted_at.slice(0, 10)} (${fmtAge(latest.posted_at)}) ${latest.kind}: ${latest.title.slice(0, 60)}` : 'none'}`)
}

// DCDL client vs. the last extraction: game patches rewrite the English strings file.
const DCDL_LANG = 'E:\\FunPlus\\DC Dark Legion\\game\\KGPatchV2\\patch_windows\\res_base\\lang\\key_en.bin'
const DCDL_STATE = 'E:\\GameAssets\\Exports\\dcdl\\_state.json'
if (fs.existsSync(DCDL_LANG) && fs.existsSync(DCDL_STATE)) {
  const patched = fs.statSync(DCDL_LANG).mtime
  const extracted = fs.statSync(DCDL_STATE).mtime
  const d = (t) => t.toISOString().slice(0, 10)
  console.log(patched > extracted
    ? `\n! DCDL client patched ${d(patched)}, after the last extraction (${d(extracted)}). Ask Tyler to run Site Admin → Site → Game Data: Extract from game files, Scan unreleased content [NDA], Refresh site kits (preview, then apply), Check Supreme Commander.`
    : `\nDCDL client last patched ${d(patched)}; extraction is newer (${d(extracted)}).`)
}

if (!pending.length) {
  console.log('\nNothing new since the last patch-day run.')
  process.exit(0)
}

const counts = {}
for (const g of GAMES) {
  const rows = pending.filter((p) => p.game === g)
  if (!rows.length) continue
  console.log(`\n${GAME_LABEL[g]} (${rows.length})`)
  for (const p of rows) {
    const [action, why] = suggest(p)
    counts[action] = (counts[action] ?? 0) + 1
    const extra = [p.state === 'CHANGED' ? `CHANGED +${p.grew} chars since logged as ${p.was}` : null, p.images?.length ? `${p.images.length} image(s)` : null].filter(Boolean)
    console.log(`  [${action.padEnd(5)}] ${p.posted_at.slice(0, 10)} ${p.kind.padEnd(11)} ${p.title.slice(0, 70)}`)
    console.log(`          id ${p.id} · ${why}${extra.length ? ` · ${extra.join(' · ')}` : ''}`)
  }
}
console.log(`\n${pending.length} post(s) to handle: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}.`)
console.log('Suggestions are hints; read each post (show <id>) before deciding. Nothing was written.')

const OUT = flag('--json')
if (OUT) {
  fs.writeFileSync(OUT, JSON.stringify(pending.map((p) => ({ ...p, suggestion: suggest(p) })), null, 2))
  console.log(`Full posts written to ${OUT}`)
}

// ── draft: validate a drafts file, then (with --write) insert it as pending rows ──
/*
 * File shape (JSON):
 * { "guides":  [{ "id", "title", "description", "game", "tags": [], "cover_image", "posts": [post ids], "blocks": [ … ] }],
 *   "history": [{ "entity_type": "champion"|"legacy", "entity_id", "event_date", "kind", "title", "body",
 *                 "servers"?, "source_post_ids": [post ids], "take"?, "take_source"? }] }
 * Everything is written as status 'pending', author 'Quantum'; nothing here can publish.
 */
async function draft(file, write) {
  if (!file || !fs.existsSync(file)) { console.error('usage: draft <drafts.json> [--write]'); process.exit(1) }
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'))
  const errors = []
  const warn = []

  // NDA guard: names of everything the vault holds back (held = not announced, not live).
  const ndaIndex = 'E:\\GameAssets\\Exports\\dcdl\\_nda\\index [NDA].json'
  let ndaNames = []
  if (fs.existsSync(ndaIndex)) {
    const items = JSON.parse(fs.readFileSync(ndaIndex, 'utf8')).items ?? []
    ndaNames = items.filter((i) => i.status === 'held').flatMap((i) => [i.name, ...(i.officialNames ?? [])]).filter((n) => typeof n === 'string' && n.trim().length >= 4)
  } else warn.push('NDA vault index not found on this machine: the NDA name check was skipped. Check drafts by hand.')
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const ndaHit = (label, text) => {
    const low = String(text).toLowerCase()
    // Never print the matched name: this output may end up in a chat.
    if (ndaNames.some((n) => new RegExp(`\\b${escRe(n.toLowerCase())}\\b`).test(low))) errors.push(`${label}: names something held in the DCDL NDA vault. Remove it.`)
  }

  const heros = JSON.parse(fs.readFileSync(path.join(root, 'src/dcdl/data/heros.json'), 'utf8'))
  const legacy = JSON.parse(fs.readFileSync(path.join(root, 'src/dcdl/data/legacy.json'), 'utf8'))
  const ids = { champion: new Set(heros.map((h) => h.id)), legacy: new Set(legacy.map((l) => l.id)) }

  const ALLOWED_TAGS = new Set(['strong', 'em', 'b', 'i', 'u', 'span', 'a', 'br'])
  const ALLOWED_CLASS = /^qgg-(sm|lg|c-(gold|red|green|blue|purple|muted)|f-(serif|display|mono))$/
  const TYPES = new Set(['heading', 'subheading', 'paragraph', 'list', 'image'])

  const guides = spec.guides ?? []
  const history = spec.history ?? []
  const guideIds = guides.map((g) => g.id)
  const { data: existingGuides } = guideIds.length ? await supabase.from('guides').select('id, status').in('id', guideIds) : { data: [] }
  for (const e of existingGuides ?? []) errors.push(`guide "${e.id}" already exists (${e.status}). Pick a new id; drafts never overwrite.`)

  const guideRows = guides.map((g) => {
    const L = `guide "${g.id}"`
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(g.id ?? '')) errors.push(`${L}: id must be a lowercase-hyphen slug`)
    if (!GAME_LABEL[g.game]) errors.push(`${L}: game must be one of ${Object.keys(GAME_LABEL).join(', ')}`)
    if (!g.title || !g.description) errors.push(`${L}: needs a title and a description`)
    if (!(g.posts ?? []).length) errors.push(`${L}: list the game_posts ids it was drafted from in "posts"`)
    for (const p of g.posts ?? []) if (!byId.has(p)) errors.push(`${L}: post ${p} is not in game_posts`)
    const blocks = g.blocks ?? []
    if (!blocks.length) errors.push(`${L}: no blocks`)
    blocks.forEach((b, i) => {
      const at = `${L} block ${i + 1}`
      if (!TYPES.has(b.type)) return errors.push(`${at}: unknown type "${b.type}"`)
      const texts = b.type === 'list' ? b.items ?? [] : b.type === 'image' ? [b.caption ?? ''] : [b.text ?? '']
      if (b.type === 'image' && !/^(https:\/\/wfiuwxuogkwirkpgfnlj\.supabase\.co\/|\/)/.test(b.url ?? '')) errors.push(`${at}: image url must be a site path or a content-images URL`)
      for (const t of texts) {
        ndaHit(at, t)
        if (t.includes('\u2014')) warn.push(`${at}: has an em dash; Tyler's style uses colons, commas or full stops`)
        if (b.type === 'paragraph' && b.rich) {
          for (const m of t.matchAll(/<\/?([a-z0-9]+)([^>]*)>/gi)) {
            if (!ALLOWED_TAGS.has(m[1].toLowerCase())) errors.push(`${at}: <${m[1]}> is not allowed (strong/em/u/span/a/br only)`)
            for (const c of (m[2].match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/).filter(Boolean)) if (!ALLOWED_CLASS.test(c)) errors.push(`${at}: class "${c}" is outside the qgg-* vocabulary`)
            if (/style=/i.test(m[2])) errors.push(`${at}: inline style is stripped by the sanitizer; use qgg-* classes`)
          }
        } else if (/<[a-z]/i.test(t)) errors.push(`${at}: HTML in a non-rich block (set "rich": true on paragraphs, keep lists plain)`)
      }
    })
    ndaHit(`${L} title/description`, `${g.title} ${g.description} ${(g.tags ?? []).join(' ')}`)
    if (!blocks.some((b) => (b.text ?? '').includes("[QUANTUM'S TAKE]"))) errors.push(`${L}: needs a "[QUANTUM'S TAKE]" placeholder paragraph for Tyler`)
    return {
      id: g.id, game: g.game, title: g.title, description: g.description, tags: g.tags ?? [], cover_image: g.cover_image ?? null,
      body: JSON.stringify({ format: 'qgg-blocks', version: 1, blocks }),
      author: 'Quantum', status: 'pending', pub_date: today, sort: 0,
    }
  })

  const { data: existingHist } = history.length
    ? await supabase.from('entity_history').select('entity_type, entity_id, event_date, kind').in('entity_id', history.map((h) => h.entity_id))
    : { data: [] }
  const histRows = []
  for (const h of history) {
    const L = `history ${h.entity_type}/${h.entity_id} ${h.event_date}`
    if (!ids[h.entity_type]) { errors.push(`${L}: entity_type must be champion or legacy`); continue }
    if (!ids[h.entity_type].has(h.entity_id)) errors.push(`${L}: no ${h.entity_type} with that id in the site data`)
    if (!['release', 'rework', 'buff', 'nerf', 'rerun', 'change'].includes(h.kind)) errors.push(`${L}: kind "${h.kind}" not allowed`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(h.event_date ?? '')) errors.push(`${L}: event_date must be YYYY-MM-DD (the in-game date, not today)`)
    if (!(h.source_post_ids ?? []).length) errors.push(`${L}: needs source_post_ids (facts only from game_posts)`)
    for (const p of h.source_post_ids ?? []) if (!byId.has(p)) errors.push(`${L}: source post ${p} is not in game_posts`)
    if (h.take && !h.take_source) errors.push(`${L}: a take may only be prefilled from Tyler's own text; say where it came from in take_source, or leave it empty`)
    ndaHit(L, `${h.title} ${h.body} ${h.take ?? ''}`)
    if ((existingHist ?? []).some((e) => e.entity_type === h.entity_type && e.entity_id === h.entity_id && e.event_date === h.event_date && e.kind === h.kind)) {
      warn.push(`${L}: an entry with this date and kind already exists, skipped`)
      continue
    }
    histRows.push({ game: 'dcdl', entity_type: h.entity_type, entity_id: h.entity_id, event_date: h.event_date, kind: h.kind, title: h.title, body: h.body ?? '', servers: h.servers ?? null, take: h.take ?? null, source_post_ids: h.source_post_ids, status: 'pending', author: 'Quantum' })
  }

  console.log(`Drafts in ${path.basename(file)}: ${guideRows.length} guide(s), ${histRows.length} History entr${histRows.length === 1 ? 'y' : 'ies'}.`)
  for (const g of guideRows) console.log(`  guide   ${g.game.padEnd(11)} ${g.id}: ${g.title}`)
  for (const h of histRows) console.log(`  history ${h.event_date} ${h.kind.padEnd(7)} ${h.entity_type}/${h.entity_id}: ${h.title}`)
  for (const w of warn) console.log(`  ~ ${w}`)
  for (const e of errors) console.log(`  ! ${e}`)
  if (errors.length) { console.log(`\n${errors.length} problem(s): nothing written.`); process.exit(1) }
  if (!write) { console.log('\nValid. Preview only: run with --write to save these as pending drafts.'); return }

  if (guideRows.length) {
    const { error } = await supabase.from('guides').insert(guideRows)
    if (error) { console.error(`guides insert failed: ${error.message}`); process.exit(1) }
  }
  let histIds = []
  if (histRows.length) {
    const { data, error } = await supabase.from('entity_history').insert(histRows).select('id, source_post_ids')
    if (error) { console.error(`entity_history insert failed: ${error.message}`); process.exit(1) }
    histIds = data
  }
  console.log('\nSaved as pending. Log the source posts with:')
  const sources = new Set([...guides.flatMap((g) => g.posts ?? []), ...histIds.flatMap((h) => h.source_post_ids)])
  for (const p of sources) {
    const gs = guides.filter((g) => (g.posts ?? []).includes(p)).map((g) => g.id)
    const hs = histIds.filter((h) => h.source_post_ids.includes(p)).map((h) => h.id)
    console.log(`  node scripts/patch-day.mjs mark "${p}" --outcome drafted${gs.length ? ` --guides ${gs.join(',')}` : ''}${hs.length ? ` --history ${hs.join(',')}` : ''}`)
  }
}
