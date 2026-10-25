/**
 * Discord → Supabase sync for official game announcements and patch notes.
 *
 * Quantum's Discord server follows each game's official announcement channels;
 * the read-only QuantumPatch bot reads those channels over Discord's REST API
 * (no gateway, nothing is ever posted). Every official post lands in the
 * `game_posts` archive (what Claude fact-checks release status against), and
 * the ones that are real patch notes are also promoted to `patch_notes`, which
 * the site shows (newest per game = "current", the rest = archive).
 *
 *   node scripts/sync-discord-patch-notes.mjs            # preview: reads Discord + Supabase, writes nothing
 *   node scripts/sync-discord-patch-notes.mjs --write    # apply
 *   node scripts/sync-discord-patch-notes.mjs --full     # re-read every channel's whole history (default: only new posts)
 *   node scripts/sync-discord-patch-notes.mjs --out f.json  # also dump the built posts to a file for review
 *
 * Older posts the bot can't reach (Quantum's server followed some channels late) go in
 * <exports>\<game>\_manual\patch-notes\ as "YYYY-MM-DD <title>.md|.txt", one post per file;
 * every run imports them the same way (see "Manual drop folders" below and the README.txt there).
 *
 * Incremental runs re-read from the latest stored post of each channel, so a
 * patch note split over several messages is rebuilt whole if a run landed
 * between its parts. Rows are keyed on the Discord id of the group's first
 * message, so re-runs update in place and never insert twice.
 *
 * Reads DISCORD_BOT_TOKEN, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * from .env.local (or the environment). The token is never printed.
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

const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const FULL = args.includes('--full')
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : null

const TOKEN = process.env.DISCORD_BOT_TOKEN
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!TOKEN) { console.error('Missing DISCORD_BOT_TOKEN (checked env + .env.local).'); process.exit(1) }
if (!SB_URL || !SB_KEY) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.'); process.exit(1) }
const supabase = createClient(SB_URL, SB_KEY)

// Channels in Quantum's server → site game ids (src/lib/guide-games.ts).
const CHANNELS = [
  { game: 'dcdl', id: '1247981244097237062' },
  { game: 'godforge', id: '1506120508159168583' },
  { game: 'invokers', id: '1541120472068915262' },
  { game: 'voidhunters', id: '1541120593498349638' },
]
const GAME_LABEL = { dcdl: 'DC: Dark Legion', godforge: 'Godforge', invokers: 'Invokers', voidhunters: 'Void Hunters' }
// Each game's folder under <exports> (drop folders: <folder>\_manual\patch-notes\, see below).
const MANUAL_DIRS = { dcdl: 'dcdl', godforge: 'godforge', invokers: 'invokers', voidhunters: 'void-hunters' }

// ── Discord REST ─────────────────────────────────────────────────────────────
const API = 'https://discord.com/api/v10'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const snowflakeAt = (ms) => ((BigInt(ms) - 1420070400000n) << 22n).toString() // Discord epoch

async function discord(pathname) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(API + pathname, { headers: { Authorization: `Bot ${TOKEN}`, 'User-Agent': 'QuantumPatch (quantumgameguides.com, 1.0)' } })
    if (res.status === 429) {
      const body = await res.json().catch(() => ({}))
      await sleep(Math.ceil((body.retry_after ?? 1) * 1000) + 250)
      continue
    }
    if (res.status >= 500) { await sleep(1000 * (attempt + 1)); continue }
    if (!res.ok) throw new Error(`Discord ${res.status} on ${pathname.split('?')[0]}: ${(await res.text()).slice(0, 200)}`)
    // Stay under the bucket limit rather than waiting for a 429.
    if (res.headers.get('x-ratelimit-remaining') === '0') {
      await sleep(Math.ceil(Number(res.headers.get('x-ratelimit-reset-after') ?? 1) * 1000))
    }
    return res.json()
  }
  throw new Error(`Discord kept rate-limiting ${pathname.split('?')[0]}`)
}

/** Every message after `after` (exclusive), oldest first; the whole history when `after` is null. */
async function fetchMessages(channelId, after) {
  const all = []
  if (after) {
    let cursor = after
    for (;;) {
      const page = await discord(`/channels/${channelId}/messages?limit=100&after=${cursor}`)
      if (page.length === 0) break
      page.sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1))
      all.push(...page)
      if (page.length < 100) break
      cursor = page[page.length - 1].id
    }
  } else {
    let before = ''
    for (;;) {
      const page = await discord(`/channels/${channelId}/messages?limit=100${before ? `&before=${before}` : ''}`)
      all.push(...page)
      if (page.length < 100) break
      before = page[page.length - 1].id
    }
    all.sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1))
  }
  return all
}

// ── Cleaning Discord markdown to the plain text the site shows ───────────────
const fmtTs = (unix, style) => {
  const d = new Date(Number(unix) * 1000)
  const date = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
  if (style === 't' || style === 'T') return `${time} UTC`
  if (style === 'd' || style === 'D') return date
  if (style === 'R') return date
  return `${date}, ${time} UTC`
}

// Channel names from crossposts' mention_channels (the bot can't see the source servers).
const channelNames = new Map()

function clean(text) {
  let s = String(text ?? '')
  s = s.replace(/[\u200b\u200e\u200f\u2060\ufeff]/g, '')
  // The "changes from your feedback" marker is an animated custom emoji; keep its meaning.
  s = s.replace(/<a?:neonsparkles?:\d+>/gi, '✨')
  s = s.replace(/<a?:[A-Za-z0-9_~]+:\d+>/g, '') // other custom emoji
  s = s.replace(/<t:(\d+)(?::([tTdDfFR]))?>/g, (_, u, st) => fmtTs(u, st))
  s = s.replace(/<@&\d+>/g, '').replace(/<@!?\d+>/g, '')
  // @everyone and the source servers' ping roles (crossposts carry them as plain text)
  s = s.replace(/ ?@(everyone|here|Community News|Game Announcements|Game Rollout)\b/g, '')
  s = s.replace(/<#(\d+)>/g, (_, id) => `#${channelNames.get(id) ?? 'channel'}`)
  s = s.replace(/<(https?:\/\/[^>\s]+)>/g, '$1') // <url> (embed-suppressed links)
  s = s.replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, t, u) => (t.trim() === u ? u : `${t} (${u})`))
  s = s.replace(/```[a-z]*\n?/gi, '').replace(/`/g, '')
  s = s.replace(/\|\|/g, '') // spoilers
  s = s.replace(/\*\*|__|~~/g, '')
  s = s.replace(/\\([*_|~`>#\-[\]()])/g, '$1') // markdown escapes ("\|")
  const lines = s.split('\n').map((line) => {
    let l = line.replace(/^\s*(#{1,3}|-#)\s+/, '') // headings, subtext
    l = l.replace(/^\s*>{1,3}\s?/, '') // quotes
    l = l.replace(/^(\s*)[*•]\s+/, '$1- ') // "* item" bullets → "- item"
    l = l.replace(/(^|[\s(])\*(?=\S)|(?<=\S)\*(?=[\s).,:;!?]|$)/g, '$1') // leftover *italic*
    l = l.replace(/[ \t]{2,}/g, ' ').trim()
    return l
  })
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/** Text of one message: its content plus any embed (Godforge posts carry their text in embeds). */
function messageText(m) {
  const parts = [m.content ?? '']
  for (const e of m.embeds ?? []) {
    const isVideo = e.type === 'video' || /youtu\.?be/.test(e.url ?? '')
    if (isVideo) { // a link preview: the title + link is enough
      if (e.title && e.url && !(m.content ?? '').includes(e.url)) parts.push(`${e.title} (${e.url})`)
      else if (e.title && !(m.content ?? '').includes(e.title)) parts.push(e.title)
      continue
    }
    if (e.type === 'link') continue // a site's link preview, not post text
    const t = [e.title, e.description, ...(e.fields ?? []).map((f) => `${f.name}\n${f.value}`)].filter(Boolean).join('\n')
    if (t && !(m.content ?? '').includes(t.slice(0, 40))) parts.push(t)
  }
  return parts.filter((p) => p.trim()).join('\n\n')
}

// ── Grouping and classifying ─────────────────────────────────────────────────
const feedOf = (m) => (m.author?.username?.match(/#(.+)$/)?.[1] ?? '').replace(/^[^a-z0-9]+/i, '').replace(/[│・|]/g, '').trim() || 'official'
const isDeleted = (m) => (m.content ?? '').trim() === '[Original Message Deleted]'
const PATCH_HEADER_RE = /^\W*(DC: Dark Legion (is updating|has updated|is updated|has a (minor|small) patch|is not updating)|.{0,30}update preview)/i
const PATCH_HEADER = { test: (raw) => PATCH_HEADER_RE.test(clean(raw)) }
const isVideoMsg = (m) => (m.embeds ?? []).some((e) => e.type === 'video' || /youtu\.?be/.test(e.url ?? '')) || /just uploaded/i.test(m.content ?? '')
const startsFresh = (m) => /^\s*@(everyone|here)/.test(m.content ?? '') || isVideoMsg(m) || PATCH_HEADER.test(m.content ?? '')
const MERGE_GAP_MS = 10 * 60 * 1000

/** Official posts only (crossposts from followed channels arrive as webhook messages), split posts merged. */
function groupMessages(messages) {
  const groups = []
  const open = new Map() // feed → its latest group (feeds interleave: a #game-news post can land mid-notes)
  for (const m of messages) {
    if (m.type !== 0 || !m.webhook_id || isDeleted(m)) continue // system messages, member chat, deleted originals
    const feed = feedOf(m)
    const last = open.get(feed)
    const at = new Date(m.timestamp).getTime()
    const close = last && at - last.lastAt <= MERGE_GAP_MS
    if (close && !startsFresh(m)) last.messages.push(m)
    else if (close && PATCH_HEADER.test(m.content ?? '') && !last.messages.some((x) => PATCH_HEADER.test(x.content ?? ''))) {
      last.messages.unshift(m) // the header was posted after part of the notes (Mar 21 2025): put it first
    } else {
      const g = { feed, messages: [m], lastAt: at }
      groups.push(g)
      open.set(feed, g)
      continue
    }
    last.lastAt = at
  }
  return groups
}

function classify(game, feed, first, text) {
  const head = text.slice(0, 200)
  if (game === 'dcdl') {
    if (feed === 'update-notes') return /^\W*heads up/i.test(head) ? 'announcement' : 'patch_notes'
    // Before the #update-notes feed was followed (2025-02-14) the full notes came through #game-news.
    if (feed === 'game-news' && /^\W*(DC: Dark Legion has updated|.{0,30}update preview)/i.test(clean(first.content))) return 'patch_notes'
  } else if (game === 'voidhunters' && feed === 'dev-updates') {
    // Same rule as the drop folder, where every "Dev Update" file became a patch note.
    return 'patch_notes'
  } else if (/\b(hotfix|patch notes|update news)\b/i.test(head) && !/^\W*(server )?maintenance/i.test(head)) return 'patch_notes'
  if (/gift-codes/.test(feed) || /\b(gift )?code:/i.test(head)) return 'codes'
  if (/maintenance/i.test(head)) return 'maintenance'
  if (feed === 'latest-videos' || isVideoMsg(first)) return 'video'
  if (feed === 'community-news') return 'community'
  return 'announcement'
}

const utcDate = (iso) => iso.slice(0, 10)
const monthDay = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })

function titleFor(game, kind, body, postedAt) {
  if (kind === 'patch_notes' && game === 'dcdl') return `${monthDay(postedAt)} Patch Notes`
  const lines = body.replace(/^Fateless just uploaded /, '').split('\n').map((l) => l.replace(/^[\s\W]+(?=\w)/u, '').trim())
  // Skip a bare greeting ("Hey!") for the first line that says something.
  const line = lines.find((l) => l.length > 12) ?? lines.find((l) => l.length > 2) ?? ''
  const t = line.length > 110 ? `${line.slice(0, 107).replace(/\s+\S*$/, '')}…` : line
  return t || (kind === 'patch_notes' ? 'Patch Notes' : `${GAME_LABEL[game]} post`)
}

// Following only forwards messages the devs publish. When they publish a section header but not the
// message(s) under it, it arrives as a lone heading (Feb 11 2026). Flag those so the missing text can
// be pasted into the game's fill-in folder.
const gapWarnings = []
const isBareHeading = (m) => /^\s*#{1,3}\s/.test(m.content ?? '') && clean(m.content).split('\n').filter((l) => l.trim()).length === 1

function buildPost(game, channelId, group) {
  const { feed, messages } = group
  for (const m of messages) {
    if (isBareHeading(m)) gapWarnings.push(`${GAME_LABEL[game]} ${utcDate(m.timestamp)}: "${clean(m.content)}" arrived with nothing under it. Paste the missing text into ${MANUAL_DIRS[game]}\\_manual\\patch-notes\\fill-in\\${utcDate(m.timestamp)}.txt`)
  }
  const text = messages.map(messageText).filter(Boolean).join('\n\n')
  const body = clean(text)
  const ids = messages.map((m) => m.id)
  const lead = [...ids].sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : 1))[0]
  const postedAt = messages.map((m) => m.timestamp).sort()[0]
  const kind = classify(game, feed, messages[0], body)
  const edited = messages.map((m) => m.edited_timestamp).filter(Boolean).sort().pop() ?? null
  return {
    id: lead,
    message_ids: ids,
    game,
    channel_id: channelId,
    source: feed,
    kind,
    title: titleFor(game, kind, body, postedAt),
    body,
    attachments: messages.reduce((n, m) => n + (m.attachments?.length ?? 0), 0),
    posted_at: postedAt,
    edited_at: edited,
  }
}

// ── Supabase ─────────────────────────────────────────────────────────────────
async function selectAll(table, columns, filter) {
  const rows = []
  for (let from = 0; ; from += 1000) {
    let q = supabase.from(table).select(columns).range(from, from + 999)
    if (filter) q = filter(q)
    const { data, error } = await q
    if (error) return { error }
    rows.push(...data)
    if (data.length < 1000) break
  }
  return { data: rows }
}

const { data: existingPosts, error: postsErr } = await selectAll('game_posts', 'id, game, channel_id, message_ids, posted_at, title, body, kind, source, attachments, edited_at, images')
const archiveReady = !postsErr
if (postsErr && WRITE) {
  console.error(`The game_posts table is missing (${postsErr.message}). Apply the migration first (see the script header).`)
  process.exit(1)
}
const { data: existingNotes, error: notesErr } = await selectAll('patch_notes', 'id, game, title, body, published_at, discord_message_id')
let notesLinked = !notesErr
let notes = existingNotes
if (notesErr) { // preview before the migration: no discord_message_id column yet
  if (WRITE) { console.error(`patch_notes.discord_message_id is missing (${notesErr.message}). Apply the migration first.`); process.exit(1) }
  const r = await selectAll('patch_notes', 'id, game, title, body, published_at')
  if (r.error) { console.error(r.error.message); process.exit(1) }
  notes = r.data.map((n) => ({ ...n, discord_message_id: null }))
}

const postsById = new Map((existingPosts ?? []).map((p) => [p.id, p]))
const notesByDiscord = new Map(notes.filter((n) => n.discord_message_id).map((n) => [n.discord_message_id, n]))
// Hand-pasted rows (no Discord id): adopted by game + date so the synced copy replaces, not duplicates, them.
const handNotes = notes.filter((n) => !n.discord_message_id)

console.log(`${WRITE ? 'APPLY' : 'PREVIEW (writes nothing)'} · ${FULL || !archiveReady ? 'full history' : 'new posts only'}\n`)
if (!archiveReady) console.log('(game_posts / patch_notes.discord_message_id not created yet — previewing against an empty archive)\n')

const built = []
for (const ch of CHANNELS) {
  let after = null
  if (!FULL && archiveReady) {
    // Re-read the hour before the latest stored post, so a post split over several messages
    // (and interleaved with other feeds) is rebuilt whole if a run landed between its parts.
    const latest = (existingPosts ?? []).filter((p) => p.channel_id === ch.id).sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? 1 : -1))[0]
    if (latest) after = snowflakeAt(new Date(latest.posted_at).getTime() - 60 * 60 * 1000)
  }
  const messages = await fetchMessages(ch.id, after)
  for (const m of messages) for (const c of m.mention_channels ?? []) channelNames.set(c.id, c.name.replace(/^[^a-z0-9]+[│｜|]/i, ''))
  const posts = groupMessages(messages).map((g) => buildPost(ch.game, ch.id, g)).filter((p) => p.body)
  built.push({ ...ch, fetched: messages.length, posts })
}

// ── Manual drop folders: older posts the bot can't reach ─────────────────────
// Quantum's server only started following some channels recently, so he pastes older official
// posts into <exports>\<game>\_manual\patch-notes\ as "YYYY-MM-DD <title>.md|.txt" (see the
// README.txt there). Each file is one post: the date comes from the name, the game from the
// folder, and its id is "manual:<game>:<file name>", so re-runs update in place. Deleting or
// renaming a file removes its old row.
const EXPORTS = process.env.GAME_EXPORTS_DIR || 'E:\\GameAssets\\Exports'
const MANUAL_NAME = /^(\d{4}-\d{2}-\d{2})\s+(.+)\.(md|txt)$/i
const manualWarnings = []
const manualSeen = new Set()
const manualGames = new Set() // games whose folder exists (only those get stale manual rows removed)
const fills = new Map() // "game YYYY-MM-DD" → hand-pasted text to add to that date's synced patch notes
const fillPosts = [] // the same text, archived in game_posts
for (const [game, dir] of Object.entries(MANUAL_DIRS)) {
  const folder = path.join(EXPORTS, dir, '_manual', 'patch-notes')
  if (!fs.existsSync(folder)) continue
  manualGames.add(game)
  const posts = []
  const files = fs.readdirSync(folder).filter((f) => /\.(md|txt)$/i.test(f) && f.toLowerCase() !== 'readme.txt')
  for (const file of files) {
    const m = file.match(MANUAL_NAME)
    if (!m || Number.isNaN(Date.parse(`${m[1]}T00:00:00Z`))) { manualWarnings.push(`${dir}: "${file}" — name must start with a date like 2025-03-21 then a space`); continue }
    // Text pasted from the Discord app shows custom emoji as :Name: — drop those like <:Name:id>.
    const raw = fs.readFileSync(path.join(folder, file), 'utf8')
      .replace(/:neonsparkles?:/gi, '✨').replace(/(^|[\s(]):[A-Za-z][A-Za-z0-9_~]{1,31}:(?=[\s).,!?]|$)/gm, '$1')
    const body = clean(raw)
    if (!body) { manualWarnings.push(`${dir}: "${file}" is empty`); continue }
    const title = m[2].trim()
    const id = `manual:${game}:${file}`
    manualSeen.add(id)
    const head = `${title}\n${body.slice(0, 200)}`
    const kind = PATCH_HEADER_RE.test(body) || /\b(patch|hotfix|update)\b/i.test(title) || /\b(hotfix|patch notes|update news)\b/i.test(head)
      ? 'patch_notes' : classify(game, 'manual', { content: raw, embeds: [] }, body)
    posts.push({
      id, message_ids: [], game, channel_id: 'manual', source: 'manual', kind, title, body,
      attachments: 0, posted_at: `${m[1]}T12:00:00.000Z`, edited_at: null, images: [],
    })
  }
  posts.sort((a, b) => a.posted_at.localeCompare(b.posted_at))
  built.push({ game, id: 'manual', manual: true, folder, fetched: files.length, posts })

  // fill-in\YYYY-MM-DD*.txt: sections the devs posted in the official channel but never published,
  // so following never forwarded them (Feb 11 2026: the Teen Titans and Bat Family kit changes came
  // through as bare headers). The text is added to the end of that date's synced patch notes and
  // archived as its own row; it never becomes a separate patch note.
  const fillDir = path.join(folder, 'fill-in')
  if (fs.existsSync(fillDir)) {
    for (const file of fs.readdirSync(fillDir).filter((f) => /\.(md|txt)$/i.test(f) && f.toLowerCase() !== 'readme.txt')) {
      const date = file.match(/^(\d{4}-\d{2}-\d{2})/)?.[1]
      if (!date) { manualWarnings.push(`${dir}\\fill-in: "${file}" — name must start with the patch date, e.g. 2026-02-11.txt`); continue }
      const raw = fs.readFileSync(path.join(fillDir, file), 'utf8')
        .replace(/:neonsparkles?:/gi, '✨').replace(/(^|[\s(]):[A-Za-z][A-Za-z0-9_~]{1,31}:(?=[\s).,!?]|$)/gm, '$1')
      const body = clean(raw)
      if (!body) { manualWarnings.push(`${dir}\\fill-in: "${file}" is empty`); continue }
      const id = `manual:${game}:fill-in/${file}`
      manualSeen.add(id)
      const key = `${game} ${date}`
      fills.set(key, [fills.get(key), body].filter(Boolean).join('\n\n'))
      fillPosts.push({
        id, message_ids: [], game, channel_id: 'manual', source: 'fill-in', kind: 'patch_notes',
        title: `${monthDay(`${date}T12:00:00Z`)} Patch Notes (sections filled in by hand)`, body,
        attachments: 0, posted_at: `${date}T12:00:00.000Z`, edited_at: null, images: [],
      })
    }
  }
}
// _manual\images\: images that went with a post (Discord's attachment links expire, so Quantum
// saves the ones worth keeping). The date in the file name ("roadmap 2026-06-12.png") ties it to
// the post from that date; it is uploaded to the content-images bucket on --write and listed on
// the post's `images`. A date with several posts needs the post's title in the name too.
const IMAGE_TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' }
const imageUploads = []
const storedImageUpdates = [] // stored posts this run didn't rebuild, that gain an image
for (const [game, dir] of Object.entries(MANUAL_DIRS)) {
  const folder = path.join(EXPORTS, dir, '_manual', 'images')
  if (!fs.existsSync(folder)) continue
  // This run's posts first, then stored posts it didn't rebuild (a new-posts-only run skips old ones).
  // Fill-in rows are excluded: an image belongs to the real post of that date.
  const fresh = built.filter((x) => x.game === game).flatMap((x) => x.posts)
  const freshIds = new Set(fresh.map((p) => p.id))
  const candidates = fresh.concat((existingPosts ?? []).filter((p) => p.game === game && p.source !== 'fill-in' && !freshIds.has(p.id)).map((p) => ({ ...p, stored: true })))
  for (const file of fs.readdirSync(folder)) {
    const ext = file.split('.').pop().toLowerCase()
    if (!IMAGE_TYPES[ext]) continue
    const date = file.match(/(\d{4}-\d{2}-\d{2})/)?.[1]
    const sameDay = date ? candidates.filter((p) => utcDate(new Date(p.posted_at).toISOString()) === date) : []
    const named = sameDay.filter((p) => file.toLowerCase().includes(p.title.toLowerCase().slice(0, 20)))
    const target = sameDay.length === 1 ? sameDay[0] : named.length === 1 ? named[0] : null
    if (!target) {
      manualWarnings.push(`${dir}\\_manual\\images: "${file}" — ${!date ? 'no date in the name' : sameDay.length ? `${sameDay.length} posts that day; add part of the post's title to the name` : 'no post on that date'}`)
      continue
    }
    const key = `game-posts/${game}/${file.replace(/[^A-Za-z0-9._-]+/g, '-')}`
    const url = `${SB_URL}/storage/v1/object/public/content-images/${key}`
    target.images = [...new Set([...(target.images ?? []), url])].sort()
    if (target.stored && !storedImageUpdates.includes(target)) storedImageUpdates.push(target)
    imageUploads.push({ file: path.join(folder, file), key, type: IMAGE_TYPES[ext] })
  }
}

// Rows from files that were deleted or renamed since the last run.
const manualRemoved = (existingPosts ?? []).filter((p) => p.channel_id === 'manual' && manualGames.has(p.game) && !manualSeen.has(p.id)).map((p) => p.id)

if (OUT) fs.writeFileSync(OUT, JSON.stringify(built.flatMap((c) => c.posts), null, 1))

// ── Diff ─────────────────────────────────────────────────────────────────────
const ms = (t) => (t ? new Date(t).getTime() : null)
const same = (a, b) => a.title === b.title && a.body === b.body && a.kind === b.kind && a.source === b.source
  && ms(a.edited_at) === ms(b.edited_at) && JSON.stringify(a.message_ids) === JSON.stringify(b.message_ids)
  && (a.images === undefined || JSON.stringify(a.images) === JSON.stringify(b.images ?? []))
// Bot-synced patch notes get that date's fill-in text added at the end (never pasted posts).
const withFill = (game, date, body, source) => {
  const fill = source === 'manual' ? null : fills.get(`${game} ${date}`)
  return fill ? `${body}\n\n${fill}` : body
}
const postWrites = []
const noteInserts = []
const noteUpdates = []
const adopted = []
const botNoteDates = new Set([
  ...built.filter((c) => !c.manual).flatMap((c) => c.posts.filter((p) => p.kind === 'patch_notes').map((p) => `${p.game} ${utcDate(p.posted_at)}`)),
  ...notes.filter((n) => n.discord_message_id && !n.discord_message_id.startsWith('manual:')).map((n) => `${n.game} ${n.published_at}`),
])
for (const c of built) {
  for (const p of c.posts) {
    const old = postsById.get(p.id)
    if (!old) postWrites.push({ p, op: 'new' })
    else if (!same(p, old)) postWrites.push({ p, op: 'changed' })

    if (p.kind !== 'patch_notes' || p.source === 'fill-in') continue
    // A pasted copy of a post the bot already has: keep it in the archive, but don't list it twice on the site.
    if (p.source === 'manual' && !notesByDiscord.has(p.id) && botNoteDates.has(`${p.game} ${utcDate(p.posted_at)}`)) {
      manualWarnings.push(`${p.game}: "${p.title}" (${utcDate(p.posted_at)}) — the bot already has patch notes for that date, so it stays archive-only`)
      continue
    }
    const row = { game: p.game, title: p.title, body: withFill(p.game, utcDate(p.posted_at), p.body, p.source), published_at: utcDate(p.posted_at), discord_message_id: p.id }
    const linked = notesByDiscord.get(p.id)
    if (linked) {
      if (linked.body !== row.body || linked.title !== row.title || linked.published_at !== row.published_at) noteUpdates.push({ id: linked.id, row })
      continue
    }
    const hi = handNotes.findIndex((n) => n.game === p.game && n.published_at === row.published_at)
    if (hi >= 0) {
      const [hand] = handNotes.splice(hi, 1)
      adopted.push({ hand, row })
      noteUpdates.push({ id: hand.id, row })
    } else noteInserts.push(row)
  }
}

// Fill-in files: archive them, and bring already-stored bot patch notes in line (a run that only
// reads new posts never rebuilds the old note a file belongs to; deleting a file takes its text out).
for (const p of fillPosts) {
  const old = postsById.get(p.id)
  if (!old) postWrites.push({ p, op: 'new' })
  else if (!same(p, old)) postWrites.push({ p, op: 'changed' })
}
for (const t of storedImageUpdates) {
  const { stored, ...p } = t
  if (JSON.stringify(postsById.get(p.id)?.images ?? []) !== JSON.stringify(p.images)) postWrites.push({ p, op: 'changed' })
}
const touched = new Set(noteUpdates.map((u) => u.id))
for (const n of notes) {
  if (!n.discord_message_id || n.discord_message_id.startsWith('manual:') || touched.has(n.id)) continue
  const post = postsById.get(n.discord_message_id)
  if (!post || post.kind !== 'patch_notes') continue
  const body = withFill(n.game, n.published_at, post.body, post.source)
  if (body !== n.body) {
    noteUpdates.push({ id: n.id, row: { game: n.game, title: n.title, body, published_at: n.published_at, discord_message_id: n.discord_message_id } })
    if (fills.has(`${n.game} ${n.published_at}`)) manualWarnings.push(`${n.game} ${n.published_at}: fill-in text added to "${n.title}"`)
  }
}
for (const key of fills.keys()) {
  const [game, date] = key.split(' ')
  if (!notes.some((n) => n.game === game && n.published_at === date && n.discord_message_id && !n.discord_message_id.startsWith('manual:'))
    && !noteInserts.some((r) => r.game === game && r.published_at === date)) {
    manualWarnings.push(`${game} ${date}: fill-in file has no synced patch notes on that date to add to (archived only)`)
  }
}

// A stored post whose message is now part of a bigger post (a run landed between the parts of a
// split post): drop it and its patch_notes copy, since the rebuilt post carries its text.
const leads = new Set(built.flatMap((c) => c.posts.map((p) => p.id)))
const absorbed = built.flatMap((c) => c.posts.flatMap((p) => p.message_ids)).filter((id) => !leads.has(id) && postsById.has(id))

// ── Report ───────────────────────────────────────────────────────────────────
const range = (ps) => (ps.length ? `${utcDate(ps[0].posted_at)} → ${utcDate(ps[ps.length - 1].posted_at)}` : '—')
for (const c of built) {
  const kinds = {}
  for (const p of c.posts) kinds[p.kind] = (kinds[p.kind] ?? 0) + 1
  const pn = c.posts.filter((p) => p.kind === 'patch_notes')
  console.log(c.manual
    ? `■ ${GAME_LABEL[c.game]} drop folder — ${c.fetched} files → ${c.posts.length} posts (${range(c.posts)})`
    : `■ ${GAME_LABEL[c.game]} — ${c.fetched} messages read → ${c.posts.length} official posts (${range(c.posts)})`)
  console.log(`  by kind: ${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(' · ') || 'none'}`)
  console.log(`  patch notes: ${pn.length} (${range(pn)})`)
  const sample = pn.length > 6 ? [...pn.slice(0, 3), ...pn.slice(-3)] : pn
  for (const p of sample) console.log(`    ${utcDate(p.posted_at)}  ${p.title}  [${p.source === 'manual' ? 'file' : `${p.message_ids.length} msg`}, ${p.body.length} chars]`)
  const other = c.posts.filter((p) => p.kind !== 'patch_notes').slice(-4)
  if (other.length) console.log(`  latest other posts:`)
  for (const p of other) console.log(`    ${utcDate(p.posted_at)}  [${p.kind}] ${p.title}`)
  console.log('')
}
if (imageUploads.length) console.log(`images: ${imageUploads.length} attached (${imageUploads.map((u) => u.key.split('/').pop()).join(', ')})`)
console.log(`game_posts archive: ${postWrites.filter((w) => w.op === 'new').length} new, ${postWrites.filter((w) => w.op === 'changed').length} changed`)
console.log(`patch_notes: ${noteInserts.length} new, ${noteUpdates.length - adopted.length} changed, ${adopted.length} hand-pasted rows adopted`)
if (absorbed.length) console.log(`merged into a bigger post since the last run (removed): ${absorbed.join(', ')}`)
if (manualRemoved.length) console.log(`drop-folder files deleted or renamed (their rows are removed): ${manualRemoved.map((id) => id.split(':').slice(2).join(':')).join(', ')}`)
for (const w of manualWarnings) console.log(`  ! ${w}`)
for (const w of gapWarnings) console.log(`  ! POSSIBLY MISSING TEXT: ${w}`)
for (const a of adopted) console.log(`  adopt ${a.hand.game} ${a.hand.published_at} "${a.hand.title}" → "${a.row.title}" (body ${a.hand.body.length} → ${a.row.body.length} chars)`)
if (handNotes.length) console.log(`  hand-pasted rows with no Discord match (left as they are): ${handNotes.map((n) => `${n.game} ${n.published_at}`).join(', ')}`)

if (!WRITE) {
  console.log('\nPreview only. Run with --write to apply.')
  process.exit(0)
}

// ── Apply ────────────────────────────────────────────────────────────────────
for (const u of imageUploads) {
  const { error } = await supabase.storage.from('content-images').upload(u.key, fs.readFileSync(u.file), { contentType: u.type, upsert: true, cacheControl: '86400' })
  if (error) { console.error(`image upload failed (${u.key}): ${error.message}`); process.exit(1) }
}
const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n))
for (const part of chunk(postWrites.map((w) => w.p), 200)) {
  const { error } = await supabase.from('game_posts').upsert(part, { onConflict: 'id' })
  if (error) { console.error(`game_posts upsert failed: ${error.message}`); process.exit(1) }
}
for (const part of chunk(noteInserts, 200)) {
  const { error } = await supabase.from('patch_notes').insert(part)
  if (error) { console.error(`patch_notes insert failed: ${error.message}`); process.exit(1) }
}
for (const u of noteUpdates) {
  const { error } = await supabase.from('patch_notes').update(u.row).eq('id', u.id)
  if (error) { console.error(`patch_notes update failed: ${error.message}`); process.exit(1) }
}
const stale = [...absorbed, ...manualRemoved]
if (stale.length) {
  const a = await supabase.from('patch_notes').delete().in('discord_message_id', stale)
  const b = await supabase.from('game_posts').delete().in('id', stale)
  if (a.error || b.error) { console.error(`cleanup failed: ${(a.error ?? b.error).message}`); process.exit(1) }
}
console.log('\nApplied. The site picks the new patch notes up within ~1 minute.')
