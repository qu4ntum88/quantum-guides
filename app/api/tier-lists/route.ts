import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase'
import { requireRole } from '@/src/lib/roles-server'
import { hasRole } from '@/src/lib/roles'
import { getCatalog, TIERS, type EntityType } from '@/src/dcdl/lib/tier-db'

/**
 * Creator- and editor-facing CRUD for their own tier lists.
 *
 * Every request re-resolves the caller's role from Clerk, and every write is
 * scoped to rows they own — admins may additionally act on anyone's list, which
 * is how the moderation queue unpublishes something.
 */

const VALID_TIERS = new Set<string>(TIERS)
const MAX_LISTS_PER_USER = 20

function parseType(v: unknown): EntityType {
  return v === 'legacy' ? 'legacy' : 'champion'
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** "Tyvokka's Champion Tier List" → tyvokka-champion-tier-list, de-duplicated. */
async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || 'tier-list'
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`
    const { data } = await supabaseAdmin.from('tier_lists').select('id').eq('id', candidate).limit(1)
    if (!data || data.length === 0) return candidate
  }
  return `${root}-${Date.now()}`
}

// GET — ?catalog=champion|legacy for the draggable items, otherwise the
// caller's own lists (admins also get everyone else's, for moderation).
export async function GET(req: NextRequest) {
  const viewer = await requireRole('creator')
  if (!viewer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const catalog = req.nextUrl.searchParams.get('catalog')
  if (catalog) return NextResponse.json(await getCatalog(parseType(catalog)))

  const all = req.nextUrl.searchParams.get('all') === '1' && hasRole(viewer.role, 'admin')

  let query = supabaseAdmin.from('tier_lists').select('*').order('updated_at', { ascending: false })
  if (!all) query = query.eq('owner_user_id', viewer.userId!)
  const { data: lists, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (lists ?? []).map((l) => l.id as string)
  const entriesByList: Record<string, { entityId: string; tier: string }[]> = {}
  if (ids.length > 0) {
    const { data: entries } = await supabaseAdmin
      .from('tier_list_entries')
      .select('tier_list_id, entity_id, tier, position')
      .in('tier_list_id', ids)
      .order('position', { ascending: true })
    for (const e of entries ?? []) {
      const key = e.tier_list_id as string
      ;(entriesByList[key] ??= []).push({ entityId: e.entity_id as string, tier: e.tier as string })
    }
  }

  return NextResponse.json({
    creatorName: viewer.creatorName,
    role: viewer.role,
    lists: (lists ?? []).map((l) => ({ ...l, entries: entriesByList[l.id as string] ?? [] })),
  })
}

// POST — create or update one of the caller's lists.
export async function POST(req: NextRequest) {
  const viewer = await requireRole('creator')
  if (!viewer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const b = await req.json().catch(() => ({}))
  const title = String(b.title ?? '').trim()
  if (!title) return NextResponse.json({ error: 'A title is required.' }, { status: 400 })
  if (title.length > 90) return NextResponse.json({ error: 'Title must be 90 characters or fewer.' }, { status: 400 })

  const creatorName = String(b.creatorName ?? viewer.creatorName ?? '').trim()
  if (!creatorName) {
    return NextResponse.json({ error: 'Set your creator name before publishing.' }, { status: 400 })
  }

  const entityType = parseType(b.entityType)
  const rawEntries = Array.isArray(b.entries) ? b.entries : []

  // Only keep items that actually exist and carry a real tier — this is also
  // what stops a crafted request from injecting arbitrary ids.
  const known = new Set((await getCatalog(entityType)).map((c) => c.id))
  const entries = rawEntries.flatMap((e: { entityId?: unknown; tier?: unknown }, i: number) => {
    const entityId = String(e.entityId ?? '')
    const tier = String(e.tier ?? '')
    if (!entityId || !known.has(entityId) || !VALID_TIERS.has(tier)) return []
    return [{ entity_id: entityId, tier, position: i }]
  })
  if (entries.length === 0) {
    return NextResponse.json({ error: 'Rank at least one item before saving.' }, { status: 400 })
  }

  let id = b.id ? String(b.id) : ''
  if (id) {
    const { data: owned } = await supabaseAdmin.from('tier_lists').select('owner_user_id').eq('id', id).single()
    if (!owned) return NextResponse.json({ error: 'List not found' }, { status: 404 })
    if (owned.owner_user_id !== viewer.userId && !hasRole(viewer.role, 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else {
    const { count } = await supabaseAdmin
      .from('tier_lists')
      .select('id', { count: 'exact', head: true })
      .eq('owner_user_id', viewer.userId!)
    if ((count ?? 0) >= MAX_LISTS_PER_USER) {
      return NextResponse.json({ error: `You can have at most ${MAX_LISTS_PER_USER} tier lists.` }, { status: 409 })
    }
    id = await uniqueSlug(`${creatorName} ${title}`)
  }

  const { error: listErr } = await supabaseAdmin.from('tier_lists').upsert(
    {
      id,
      owner_user_id: viewer.userId!,
      creator_name: creatorName,
      title,
      entity_type: entityType,
      description: String(b.description ?? '').slice(0, 600),
      published: b.published !== false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })

  // Replace the entries wholesale — simplest way to handle removals.
  await supabaseAdmin.from('tier_list_entries').delete().eq('tier_list_id', id)
  const { error: entryErr } = await supabaseAdmin
    .from('tier_list_entries')
    .insert(entries.map((e: { entity_id: string; tier: string; position: number }) => ({ ...e, tier_list_id: id })))
  if (entryErr) return NextResponse.json({ error: entryErr.message }, { status: 500 })

  return NextResponse.json({ success: true, id })
}

// DELETE ?id= — owner or admin.
export async function DELETE(req: NextRequest) {
  const viewer = await requireRole('creator')
  if (!viewer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data: owned } = await supabaseAdmin.from('tier_lists').select('owner_user_id').eq('id', id).single()
  if (!owned) return NextResponse.json({ error: 'List not found' }, { status: 404 })
  if (owned.owner_user_id !== viewer.userId && !hasRole(viewer.role, 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabaseAdmin.from('tier_lists').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
