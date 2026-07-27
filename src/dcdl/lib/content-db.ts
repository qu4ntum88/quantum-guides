import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

/**
 * Server-side content read layer for guides, patch notes / game info, and
 * infographics.
 *
 * Reads published content from Supabase (so edits in the on-site editor go live
 * without a redeploy — pages revalidate every 60s) and FALLS BACK to the
 * existing on-disk files (MDX guides, game-info.json, infographics.json) when
 * the database is unreachable, unconfigured, or a table is still empty (i.e.
 * before the one-time migration has run). That fallback is what keeps the site
 * unchanged until the tables are provisioned and seeded.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function fetchTable<T>(table: string, order = 'sort.asc'): Promise<T[] | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=${order}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return (await res.json()) as T[]
  } catch {
    return null
  }
}

// ── Types ──────────────────────────────────────────────────────────────────

export type GuideMeta = {
  id: string
  title: string
  description: string
  author: string | null
  pubDate: string | null
  coverImage: string | null
  tags: string[]
}

export type GuideFull = GuideMeta & {
  body: string // raw markdown
  eventType: string | null
  eventDates: string | null
  recommendedFor: string | null
  keyRewards: string[]
}

export type GameInfo = {
  latestServer: string
  patchNotes: string
  gameCodes: string[]
}

export type Infographic = {
  id: string
  title: string
  description: string
  image: string | null
  builtin: string | null
  credit: string
}

// Row shapes as returned by Supabase (snake_case columns).
type GuideRow = {
  id: string
  title: string
  description: string | null
  body: string | null
  author: string | null
  pub_date: string | null
  cover_image: string | null
  tags: string[] | null
  event_type: string | null
  event_dates: string | null
  recommended_for: string | null
  key_rewards: string[] | null
}

type GameInfoRow = {
  latest_server: string | null
  patch_notes: string | null
  game_codes: string[] | null
}

type InfographicRow = {
  id: string
  title: string
  description: string | null
  image: string | null
  builtin: string | null
  credit: string | null
}

// ── Row → domain mappers ─────────────────────────────────────────────────────

function normDate(v: unknown): string | null {
  if (!v) return null
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v).slice(0, 10)
}

const rowToGuideFull = (r: GuideRow): GuideFull => ({
  id: r.id,
  title: r.title,
  description: r.description ?? '',
  author: r.author ?? null,
  pubDate: normDate(r.pub_date),
  coverImage: r.cover_image ?? null,
  tags: r.tags ?? [],
  body: r.body ?? '',
  eventType: r.event_type ?? null,
  eventDates: r.event_dates ?? null,
  recommendedFor: r.recommended_for ?? null,
  keyRewards: r.key_rewards ?? [],
})

// ── File fallbacks (mirror the pre-CMS behavior) ─────────────────────────────

const guidesDir = path.join(process.cwd(), 'src/dcdl/guides')

function readGuideFiles(): GuideFull[] {
  let files: string[] = []
  try {
    files = fs.readdirSync(guidesDir).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
  } catch {
    return []
  }
  return files.map((filename) => {
    const raw = fs.readFileSync(path.join(guidesDir, filename), 'utf8')
    const { data, content } = matter(raw)
    return {
      id: filename.replace(/\.(mdx|md)$/, ''),
      title: data.title ? String(data.title) : filename,
      description: data.description ? String(data.description) : '',
      author: data.author ? String(data.author) : null,
      pubDate: normDate(data.pubDate),
      coverImage: data.coverImage ? String(data.coverImage) : null,
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      body: content,
      eventType: data.event_type ? String(data.event_type) : null,
      eventDates: data.event_dates ? String(data.event_dates) : null,
      recommendedFor: data.recommended_for ? String(data.recommended_for) : null,
      keyRewards: Array.isArray(data.key_rewards) ? (data.key_rewards as string[]) : [],
    }
  })
}

function readGameInfoFile(): GameInfo {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/dcdl/data/game-info.json'), 'utf8'))
    return {
      latestServer: j.latestServer ?? '',
      patchNotes: j.patchNotes ?? '',
      gameCodes: Array.isArray(j.gameCodes) ? j.gameCodes : [],
    }
  } catch {
    return { latestServer: '', patchNotes: '', gameCodes: [] }
  }
}

function readInfographicsFile(): Infographic[] {
  try {
    const arr = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/dcdl/data/infographics.json'), 'utf8')) as InfographicRow[]
    return arr.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? '',
      image: r.image ?? null,
      builtin: r.builtin ?? null,
      credit: r.credit ?? '',
    }))
  } catch {
    return []
  }
}

// Newest-first by pubDate, nulls last (matches the old guides page sort).
function sortGuides<T extends { pubDate: string | null }>(guides: T[]): T[] {
  return guides.slice().sort((a, b) => {
    if (!a.pubDate && !b.pubDate) return 0
    if (!a.pubDate) return 1
    if (!b.pubDate) return -1
    return b.pubDate.localeCompare(a.pubDate)
  })
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getGuidesFull(): Promise<GuideFull[]> {
  const rows = await fetchTable<GuideRow>('guides', 'pub_date.desc')
  const guides = rows && rows.length > 0 ? rows.map(rowToGuideFull) : readGuideFiles()
  return sortGuides(guides)
}

export async function getGuidesList(): Promise<GuideMeta[]> {
  const guides = await getGuidesFull()
  return guides.map(({ body: _body, eventType: _e, eventDates: _d, recommendedFor: _r, keyRewards: _k, ...meta }) => meta)
}

export async function getGuide(id: string): Promise<GuideFull | null> {
  const guides = await getGuidesFull()
  return guides.find((g) => g.id === id) ?? null
}

export async function getGameInfo(): Promise<GameInfo> {
  const rows = await fetchTable<GameInfoRow>('game_info', 'id.asc')
  if (rows && rows.length > 0) {
    const r = rows[0]
    return {
      latestServer: r.latest_server ?? '',
      patchNotes: r.patch_notes ?? '',
      gameCodes: r.game_codes ?? [],
    }
  }
  return readGameInfoFile()
}

export async function getInfographics(): Promise<Infographic[]> {
  const rows = await fetchTable<InfographicRow>('infographics', 'sort.asc')
  if (rows && rows.length > 0) {
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? '',
      image: r.image ?? null,
      builtin: r.builtin ?? null,
      credit: r.credit ?? '',
    }))
  }
  return readInfographicsFile()
}
