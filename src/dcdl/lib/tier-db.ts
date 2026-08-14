import { getResolvedHeros, getLegacy, type HeroResolved, type Legacy } from './data'

/**
 * Read layer for tier data.
 *
 * Two things live here:
 *
 *  1. The OFFICIAL tier list (Quantum's). `heros.json` / `legacy.json` remain
 *     the seed and the fallback, but once the `official_tiers` table has rows —
 *     i.e. once the list has been saved from the on-site editor — that table
 *     wins. Same Supabase-first / file-fallback pattern as content-db.ts, so
 *     the site keeps working untouched if the database is unreachable.
 *
 *     Because the file is only a fallback after that first on-site save, run
 *     `node scripts/pull-tiers.mjs` before committing to fold live tiers back
 *     into the JSON and keep the repo in step.
 *
 *  2. Creator and editor tier lists, which are database-only.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export type EntityType = 'champion' | 'legacy'

export const TIERS = ['S+', 'S', 'A+', 'A', 'B', 'C', 'D'] as const

async function rest<T>(pathAndQuery: string): Promise<T[] | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return (await res.json()) as T[]
  } catch {
    return null
  }
}

// ── Official tiers ───────────────────────────────────────────────────────────

type OfficialRow = { entity_type: string; entity_id: string; tier: string | null; previous_tier: string | null; position: number | null }

export type TierOverride = { tier: string; previousTier?: string; position: number }

/** null = no overrides saved yet (or DB unreachable) → use the JSON as-is. */
export async function getOfficialTiers(type: EntityType): Promise<Map<string, TierOverride> | null> {
  const rows = await rest<OfficialRow>(
    `official_tiers?select=entity_id,tier,previous_tier,position&entity_type=eq.${type}&order=position.asc`
  )
  if (!rows || rows.length === 0) return null
  return new Map(
    rows.map((r, i) => [
      r.entity_id,
      { tier: r.tier ?? '', previousTier: r.previous_tier ?? undefined, position: r.position ?? i },
    ])
  )
}

/**
 * Applies saved overrides to a resolved list, and reorders it to match — the
 * within-tier rank on the public site follows array order, exactly as the
 * file-based flow does.
 */
function merge<T extends { id: string; tier?: string; previousTier?: string }>(
  items: T[],
  overrides: Map<string, TierOverride> | null
): T[] {
  if (!overrides) return items
  const merged = items.map((item) => {
    const o = overrides.get(item.id)
    if (!o) return item
    return { ...item, tier: o.tier, previousTier: o.previousTier }
  })
  return merged.sort(
    (a, b) =>
      (overrides.get(a.id)?.position ?? Number.MAX_SAFE_INTEGER) -
      (overrides.get(b.id)?.position ?? Number.MAX_SAFE_INTEGER)
  )
}

/** Champions with the official tier list applied. */
export async function getOfficialHeros(): Promise<HeroResolved[]> {
  return merge(getResolvedHeros(), await getOfficialTiers('champion'))
}

/** Legacy pieces with the official tier list applied. */
export async function getOfficialLegacy(): Promise<Legacy[]> {
  return merge(getLegacy(), await getOfficialTiers('legacy'))
}

/** Have tiers ever been saved from the site? Drives the "Updated" stamp. */
export async function getOfficialTiersUpdatedAt(): Promise<string | null> {
  const rows = await rest<{ updated_at: string }>('official_tiers?select=updated_at&order=updated_at.desc&limit=1')
  return rows?.[0]?.updated_at ?? null
}

// ── Editor catalog ───────────────────────────────────────────────────────────

/** One draggable item in the tier editor. */
export type CatalogItem = { id: string; name: string; img: string | null; group: string }

/**
 * Everything rankable of a given type, with the official tier applied so the
 * editor opens on the current state. `group` is the role/class used to bucket
 * items into the three columns on the public tables.
 */
export async function getCatalog(type: EntityType): Promise<(CatalogItem & { tier: string })[]> {
  if (type === 'legacy') {
    const pieces = await getOfficialLegacy()
    return pieces.map((l) => ({
      id: l.id,
      name: l.name,
      img: l.image ?? null,
      group: l.role ?? '',
      tier: l.tier ?? '',
    }))
  }
  const heroes = await getOfficialHeros()
  return heroes.map((h) => ({
    id: h.id,
    name: h.name,
    img: h.imageHeadshot ?? null,
    group: h.class ?? '',
    tier: h.tier ?? '',
  }))
}

// ── Creator / editor tier lists ──────────────────────────────────────────────

export type TierListMeta = {
  id: string
  ownerUserId: string
  creatorName: string
  title: string
  entityType: EntityType
  description: string
  published: boolean
  updatedAt: string | null
}

export type TierListEntry = { entityId: string; tier: string; position: number }

export type TierListFull = TierListMeta & { entries: TierListEntry[] }

type ListRow = {
  id: string
  owner_user_id: string
  creator_name: string
  title: string
  entity_type: string
  description: string | null
  published: boolean
  updated_at: string | null
}

type EntryRow = { tier_list_id?: string; entity_id: string; tier: string; position: number | null }

function toMeta(r: ListRow): TierListMeta {
  return {
    id: r.id,
    ownerUserId: r.owner_user_id,
    creatorName: r.creator_name,
    title: r.title,
    entityType: r.entity_type === 'legacy' ? 'legacy' : 'champion',
    description: r.description ?? '',
    published: r.published,
    updatedAt: r.updated_at,
  }
}

/** Every published community tier list, newest edit first. */
export async function getPublishedTierLists(): Promise<TierListMeta[]> {
  const rows = await rest<ListRow>('tier_lists?select=*&published=eq.true&order=updated_at.desc')
  return (rows ?? []).map(toMeta)
}

/** One published list plus its entries, or null if it does not exist. */
export async function getTierList(id: string): Promise<TierListFull | null> {
  const safeId = encodeURIComponent(id)
  const rows = await rest<ListRow>(`tier_lists?select=*&id=eq.${safeId}&published=eq.true&limit=1`)
  const row = rows?.[0]
  if (!row) return null
  const entries = await rest<EntryRow>(
    `tier_list_entries?select=entity_id,tier,position&tier_list_id=eq.${safeId}&order=position.asc`
  )
  return {
    ...toMeta(row),
    entries: (entries ?? []).map((e, i) => ({ entityId: e.entity_id, tier: e.tier, position: e.position ?? i })),
  }
}

/**
 * Turns a stored list into the same shape the public tier tables render:
 * champions/legacy pieces carrying the list's tier, ordered by position.
 * Items the list never ranked are dropped.
 */
export function applyTierList<T extends { id: string; tier?: string; previousTier?: string }>(
  items: T[],
  entries: TierListEntry[]
): T[] {
  const byId = new Map(items.map((i) => [i.id, i]))
  return entries
    .slice()
    .sort((a, b) => a.position - b.position)
    .flatMap((e) => {
      const item = byId.get(e.entityId)
      if (!item || !e.tier) return []
      // previousTier drives the movement arrow on the official list; a creator
      // list has no history of its own, so clear it.
      return [{ ...item, tier: e.tier, previousTier: undefined }]
    })
}
