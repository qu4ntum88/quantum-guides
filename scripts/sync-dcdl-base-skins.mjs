// Build the DCDL Base Skins page data from the game client.
//
// Source: the game's own config tables, read straight from the PC install with the pipeline's
// cfg.mjs reader (E:\GameAssets\Exports\_pipeline\dcdl\cfg.mjs, patch dir wins over base):
//   CastleSkin     one row per base skin: Name, UnlockSkinAttr (bonus while owned),
//                  DecoratedSkinAttr (bonus while equipped), MultiAreaNum / DecoratedMultiAreaNum
//                  (extra Power credit, see below), Icon / Pic -> ArtResourceUI, Rank (order)
//   AttrGroupNew   AttrGroup id -> [{AttrId, AttrValue}], percent stats stored ×10,000
//   Attribute      AttrId -> display name + Percent mode (M10k = percent)
//   ArtResourceUI  art id -> sprite name; the PNG comes from the newest raw rip
//                  (<exports>\dcdl\_raw\<date>\game-ui\...\icon_item_skin_*.png / img_banner_*.png)
//
// NDA gate: a skin is written only when it is released, i.e.
//   - an official post (Supabase game_posts or patch_notes, game = dcdl) says it can be won /
//     earned / obtained ("Join the event and win the X Base skin"), or
//   - its name is in `confirmedInGame` in base-skins-notes.json (Tyler saw it in game).
// Anything else is left out entirely and only counted in the log ("held, not published"),
// never named. The run aborts (writes nothing) when Supabase can't be reached, so a network
// hiccup can't drop a skin from the page.
//
// What the sync owns: src/dcdl/data/base-skins.json and the art in public/dcdl/base-skins/.
// base-skins-notes.json is Tyler's (takes, extra "how to get" text, confirmedInGame) and is
// never written here. The page joins the two by skin id.
//
//   node scripts/sync-dcdl-base-skins.mjs          # dry run: report what would change
//   node scripts/sync-dcdl-base-skins.mjs --write  # write the JSON + art
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import crypto from 'crypto'
import { fileURLToPath, pathToFileURL } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const GAME = process.env.DCDL_GAME_DIR || 'E:\\FunPlus\\DC Dark Legion\\game'
const PIPELINE = process.env.DCDL_PIPELINE_DIR || 'E:\\GameAssets\\Exports\\_pipeline\\dcdl'
const EXPORT = process.env.DCDL_EXPORT || 'E:\\GameAssets\\Exports\\dcdl'
const WRITE = process.argv.includes('--write')
const DATA_FILE = path.join(ROOT, 'src/dcdl/data/base-skins.json')
const NOTES_FILE = path.join(ROOT, 'src/dcdl/data/base-skins-notes.json')
const ART_DIR = 'public/dcdl/base-skins'

function loadEnvLocal() {
  const file = path.join(ROOT, '.env.local')
  if (!fs.existsSync(file)) return
  for (const l of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnvLocal()
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SB_URL || !SB_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (checked env + .env.local); the release check needs them.')
  process.exit(1)
}

const { readCfg } = await import(pathToFileURL(path.join(PIPELINE, 'cfg.mjs')).href)
const PATCH = path.join(GAME, 'KGPatchV2', 'patch_windows', 'res_base')
const BASE = path.join(GAME, 'DC_Data', 'StreamingAssets', 'res_base')
const src = (rel) => (fs.existsSync(path.join(PATCH, rel)) ? path.join(PATCH, rel) : path.join(BASE, rel))
const byId = (name) => new Map(readCfg(src(`luaCfg/bin/${name}.bin`), { structs: true }).rows.map((r) => [r._key, r]))
const en = JSON.parse(zlib.gunzipSync(fs.readFileSync(src('lang/key_en.bin'))).toString('utf8'))

// AttrId -> the label the site uses (the game's are abbreviated or odd, e.g. "Spiritual DMG
// Taken Down"). An id missing here falls back to the game's name and is flagged in the log.
const STAT = {
  HpTechRatio: 'HP',
  AtkTechRatio: 'ATK',
  DefTechRatio: 'Physical DEF',
  FortTechRatio: 'Spiritual DEF',
  PhyDamageRatio: 'Physical DMG',
  SprDamageResRatio: 'Spiritual DMG Reduction',
  CritHero: 'Crit Rate',
  SprWaveHero: 'Spiritual AMP',
  UitimateDamageRatioBattle: 'Ultimate DMG',
}

const line = (s = '') => console.log(s)
const slug = (s) => s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// ---------- read the game ----------
const skins = [...byId('CastleSkin').values()].sort((a, b) => a.Rank - b.Rank)
const groups = byId('AttrGroupNew')
const attrs = new Map([...byId('Attribute').values()].map((a) => [a.Attribute0, a]))
const art = byId('ArtResourceUI')
const unlabelled = new Set()

function bonuses(groupId) {
  if (!groupId) return []
  const g = groups.get(groupId)
  if (!g) throw new Error(`AttrGroupNew ${groupId} not found`)
  return g.Attribute.map(({ AttrId, AttrValue }) => {
    const a = attrs.get(AttrId)
    const pct = !a || a.Percent === 'M10k'
    if (!STAT[AttrId]) unlabelled.add(AttrId)
    const stat = STAT[AttrId] || (en[a?.Name] || AttrId).replace(/\s*\(%\)\s*$/, '')
    return { key: AttrId, stat, value: pct ? AttrValue / 100 : AttrValue, pct }
  })
}

// ---------- official posts ----------
async function sb(table, select) {
  const out = []
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${SB_URL}/rest/v1/${table}?select=${select}&game=eq.dcdl&order=id`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Range: `${from}-${from + 999}` },
    })
    if (!res.ok) throw new Error(`Supabase ${table}: ${res.status} ${await res.text()}`)
    const rows = await res.json()
    out.push(...rows)
    if (rows.length < 1000) return out
  }
}
let posts
try {
  const [gp, pn] = await Promise.all([
    sb('game_posts', 'id,title,body,posted_at'),
    sb('patch_notes', 'id,title,body,published_at,discord_message_id'),
  ])
  // A patch note synced from Discord is the same text as its game_posts row; keep one copy.
  const archived = new Set(gp.map((p) => p.id))
  posts = [
    ...gp.map((p) => ({ id: p.id, title: p.title, body: p.body || '', date: p.posted_at?.slice(0, 10) })),
    ...pn.filter((p) => !archived.has(p.discord_message_id))
      .map((p) => ({ id: `patch_notes:${p.id}`, title: p.title, body: p.body || '', date: p.published_at })),
  ].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
} catch (e) {
  console.error(`Could not read the official posts, so nothing was written: ${e.message}`)
  process.exit(1)
}

// Release wording: the post says you can get it. A plain mention (a teaser, the name of an
// event stage, "Fortress of Solitude" the place) doesn't count.
const RELEASE_VERB = '(?:win|get|earn|obtain|claim|unlock|redeem|exchange for)'
function releasePost(name) {
  const re = new RegExp(`\\b${RELEASE_VERB}\\b[^.\\n]{0,60}?\\b${escRe(name)} Base skin`, 'i')
  for (const p of posts) {
    const m = re.exec(p.body)
    if (!m) continue
    // The themed event the skin comes from: the last "New Themed Event: X (Available on ...)"
    // heading above the mention in the same post.
    const before = p.body.slice(0, m.index)
    const heads = [...before.matchAll(/New Them\w* Event:\s*([^\n(]+)(?:\(Available (?:on|starting) ([^.)\n]+?)[.)])?[^\n]*$/gim)]
    const h = heads[heads.length - 1]
    return {
      event: h ? h[1].replace(/[^\w)'’:!&\s-]+$/u, '').trim() : null,
      available: h?.[2]?.trim() || null,
      postTitle: p.title,
      postedAt: p.date,
      postId: p.id,
    }
  }
  return null
}

// ---------- notes (Tyler's, read only) ----------
const notes = fs.existsSync(NOTES_FILE) ? JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8')) : {}
const confirmed = new Set((notes.confirmedInGame || []).map((n) => n.toLowerCase()))

// ---------- art ----------
const rawRoot = path.join(EXPORT, '_raw')
const uiRoot = fs.existsSync(rawRoot)
  ? fs.readdirSync(rawRoot).sort().reverse().map((d) => path.join(rawRoot, d, 'game-ui')).find((p) => fs.existsSync(p))
  : null
const images = new Map()
;(function index(dir) {
  if (!dir) return
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) index(p)
    else if (e.name.endsWith('.png')) images.set(e.name.slice(0, -4).toLowerCase(), p)
  }
})(uiRoot)
const hash = (f) => crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex')
const artCopies = [] // [dest, from]
const missingArt = []
function artFile(artId, id, kind) {
  const name = art.get(artId)?.Name
  const from = name && images.get(name.toLowerCase())
  const rel = `${ART_DIR}/${id}-${kind}.png`
  const dest = path.join(ROOT, rel)
  if (!from) {
    // Keep what an earlier run copied rather than dropping the picture.
    if (fs.existsSync(dest)) return `/${rel.replace(/^public\//, '')}`
    missingArt.push(`${id} ${kind}`)
    return null
  }
  if (!fs.existsSync(dest) || hash(dest) !== hash(from)) artCopies.push([dest, from])
  return `/${rel.replace(/^public\//, '')}`
}

// ---------- build ----------
let held = 0
const out = []
for (const s of skins) {
  const owned = bonuses(s.UnlockSkinAttr)
  const equipped = bonuses(s.DecoratedSkinAttr)
  // The starting skin every base has: no bonuses, nothing to list.
  if (!owned.length && !equipped.length) continue
  const name = (en[s.Name] || '').replace(/\s*\(Permanent\)\s*$/i, '').trim()
  if (!name) throw new Error(`CastleSkin ${s._key} has no English name`)
  const release = releasePost(name)
  if (!release && !confirmed.has(name.toLowerCase())) { held++; continue }
  const id = slug(name)
  out.push({
    id,
    name,
    order: s.Rank,
    quality: s.Quality,
    owned,
    equipped,
    // Extra Power credit (%) the game adds for stats with no Power weight of their own
    // (MultiAreaNum, ExtraPowerType "Multi"; HeroPowerUtil). Not shown on the page yet.
    ownedPowerPct: s.MultiAreaNum ? s.MultiAreaNum / 100 : 0,
    equippedPowerPct: s.DecoratedMultiAreaNum ? s.DecoratedMultiAreaNum / 100 : 0,
    icon: artFile(s.Icon, id, 'icon'),
    banner: artFile(s.Pic, id, 'banner'),
    release: release || { confirmedInGame: true },
  })
}
const data = { skins: out }

// ---------- report ----------
const prev = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) : { skins: [] }
const fmt = (b) => b.map((x) => `+${x.value}${x.pct ? '%' : ''} ${x.stat}`).join(', ') || '—'
line(`Base skins: ${out.length} released${held ? `, ${held} held, not published` : ''}.`)
for (const s of out) {
  const was = prev.skins.find((p) => p.id === s.id)
  const tag = !was ? 'NEW ' : JSON.stringify(was) === JSON.stringify(s) ? '     ' : 'CHG '
  const how = s.release.event ? `${s.release.event} (post ${s.release.postedAt})` : s.release.confirmedInGame ? 'confirmed in game' : s.release.postTitle
  line(`  ${tag}${s.name}: owned ${fmt(s.owned)} · equipped ${fmt(s.equipped)} · ${how}`)
}
for (const p of prev.skins) if (!out.some((s) => s.id === p.id)) line(`  GONE ${p.name} (no longer passes the release check)`)
if (unlabelled.size) line(`Stats with no site label (using the game's name; add them to STAT): ${[...unlabelled].join(', ')}`)
if (!uiRoot) line(`No game-ui art under ${rawRoot} (run the DCDL extraction); art kept from the last run.`)
if (missingArt.length) line(`Missing art: ${missingArt.join(', ')}`)

const json = JSON.stringify(data, null, 2) + '\n'
const changed = !fs.existsSync(DATA_FILE) || fs.readFileSync(DATA_FILE, 'utf8') !== json
if (!changed && !artCopies.length) { line('No changes.'); process.exit(0) }
if (!WRITE) {
  line(`Would write ${path.relative(ROOT, DATA_FILE)}${changed ? '' : ' (unchanged)'}${artCopies.length ? ` and ${artCopies.length} image(s) in ${ART_DIR}` : ''}. Re-run with --write.`)
  process.exit(0)
}
if (changed) fs.writeFileSync(DATA_FILE, json)
if (artCopies.length) fs.mkdirSync(path.join(ROOT, ART_DIR), { recursive: true })
for (const [dest, from] of artCopies) fs.copyFileSync(from, dest)
line(`Wrote ${changed ? path.relative(ROOT, DATA_FILE) : 'no data changes'}${artCopies.length ? ` and ${artCopies.length} image(s) in ${ART_DIR}` : ''}. Commit afterwards.`)
