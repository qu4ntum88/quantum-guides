import type { GuideGame } from '@/src/lib/guide-games'

/**
 * Read layer for `entity_history`: dated entries (release, rework, buff, nerf,
 * rerun) shown in the History section of champion and legacy pages. Entries are
 * drafted as `pending` and only `approved` rows are readable with the anon key
 * (RLS), so drafts never reach the public site. Pages revalidate every 60s, so an
 * approval shows up without a redeploy.
 */

export type HistoryKind = 'release' | 'rework' | 'buff' | 'nerf' | 'rerun' | 'change'
export type HistoryEntityType = 'champion' | 'legacy'

export type HistoryEntry = {
  id: string
  eventDate: string // YYYY-MM-DD
  kind: HistoryKind
  title: string
  body: string // TakeBody syntax
  take: string | null // Quantum's take, TakeBody syntax
  servers: string | null // e.g. "Earths 200–205 first", when a change rolled out per server group
  author: string
}

type Row = {
  id: string
  event_date: string
  kind: HistoryKind
  title: string
  body: string
  take: string | null
  servers: string | null
  author: string
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function getEntityHistory(game: GuideGame, entityType: HistoryEntityType, entityId: string): Promise<HistoryEntry[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []
  const q = new URLSearchParams({
    select: 'id,event_date,kind,title,body,take,servers,author',
    game: `eq.${game}`,
    entity_type: `eq.${entityType}`,
    entity_id: `eq.${entityId}`,
    status: 'eq.approved',
    order: 'event_date.desc,created_at.desc',
  })
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/entity_history?${q}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const rows = (await res.json()) as Row[]
    return rows.map((r) => ({
      id: r.id,
      eventDate: r.event_date,
      kind: r.kind,
      title: r.title,
      body: r.body,
      take: r.take,
      servers: r.servers,
      author: r.author,
    }))
  } catch {
    return []
  }
}
