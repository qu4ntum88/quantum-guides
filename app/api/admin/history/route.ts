import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/src/lib/supabase'
import { requireRole } from '@/src/lib/roles-server'
import heros from '@/src/dcdl/data/heros.json'
import legacy from '@/src/dcdl/data/legacy.json'

/**
 * History entries for champion and legacy pages (`entity_history`).
 *
 * Entries are drafted as `pending` (by Claude, from the game_posts archive) and
 * Tyler approves them here. Approved rows are public through RLS and show on the
 * page within 60s. Admin only: this is editorial content published under his name.
 */

const KINDS = ['release', 'rework', 'buff', 'nerf', 'rerun', 'change']
const TYPES = ['champion', 'legacy']

// The champion / legacy pages are prerendered and only refresh on a visit after their 60s
// window, and that visit still gets the old copy. Rebuild the affected pages right away instead,
// so an approval shows the next time Tyler loads the page.
async function refreshPages(ids: string[]) {
  if (!ids.length) return
  const { data } = await supabaseAdmin.from('entity_history').select('entity_type, entity_id').in('id', ids)
  for (const r of data ?? []) refreshPage(r.entity_type, r.entity_id)
}
function refreshPage(entityType: string, entityId: string) {
  revalidatePath(entityType === 'legacy' ? `/games/dc-dark-legion/legacy/${entityId}` : `/games/dc-dark-legion/heros/${entityId}`)
}

async function guard() {
  return (await requireRole('admin')) ? null : NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

const names: Record<string, string> = Object.fromEntries([
  ...(heros as { id: string; name: string }[]).map((h) => [`champion:${h.id}`, h.name]),
  ...(legacy as { id: string; name: string }[]).map((l) => [`legacy:${l.id}`, l.name]),
])

// GET ?game=dcdl — every entry (pending and approved) plus the posts each was drafted from.
export async function GET(req: NextRequest) {
  const denied = await guard()
  if (denied) return denied
  const game = req.nextUrl.searchParams.get('game') ?? 'dcdl'

  const { data, error } = await supabaseAdmin
    .from('entity_history')
    .select('*')
    .eq('game', game)
    .order('event_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const postIds = [...new Set((data ?? []).flatMap((r) => r.source_post_ids ?? []))]
  let posts: Record<string, { id: string; title: string; posted_at: string; kind: string }> = {}
  if (postIds.length) {
    const { data: p, error: pe } = await supabaseAdmin.from('game_posts').select('id, title, posted_at, kind').in('id', postIds)
    if (pe) return NextResponse.json({ error: pe.message }, { status: 500 })
    posts = Object.fromEntries((p ?? []).map((x) => [x.id, x]))
  }

  return NextResponse.json({
    entries: (data ?? []).map((r) => ({ ...r, entity_name: names[`${r.entity_type}:${r.entity_id}`] ?? r.entity_id })),
    posts,
    entities: Object.entries(names).map(([k, name]) => ({ key: k, name })),
  })
}

type Fields = { title?: string; body?: string; take?: string | null; servers?: string | null; event_date?: string; kind?: string }

function clean(b: Record<string, unknown>): Fields {
  const out: Fields = {}
  if (typeof b.title === 'string') out.title = b.title.trim()
  if (typeof b.body === 'string') out.body = b.body
  if (b.take !== undefined) out.take = typeof b.take === 'string' && b.take.trim() ? b.take : null
  if (b.servers !== undefined) out.servers = typeof b.servers === 'string' && b.servers.trim() ? b.servers.trim() : null
  if (typeof b.event_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.event_date)) out.event_date = b.event_date
  if (typeof b.kind === 'string' && KINDS.includes(b.kind)) out.kind = b.kind
  return out
}

// POST — add an entry by hand. { game, entity_type, entity_id, event_date, kind, title, body?, take?, servers? }
export async function POST(req: NextRequest) {
  const denied = await guard()
  if (denied) return denied
  const b = await req.json().catch(() => ({}))
  const row = { ...clean(b), game: String(b.game ?? 'dcdl'), entity_type: String(b.entity_type ?? ''), entity_id: String(b.entity_id ?? '') }
  if (!TYPES.includes(row.entity_type) || !names[`${row.entity_type}:${row.entity_id}`] || !row.event_date || !row.kind || !row.title) {
    return NextResponse.json({ error: 'Pick a champion or legacy piece and fill in the date, type and title.' }, { status: 400 })
  }
  const { data, error } = await supabaseAdmin.from('entity_history').insert(row).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  refreshPage(row.entity_type, row.entity_id) // a new entry is a draft, but keep the page in step anyway
  return NextResponse.json({ success: true, id: data.id })
}

// PATCH — { id, ...fields } to edit one entry, or { ids: [...], status: 'approved' | 'pending' } to (un)publish.
export async function PATCH(req: NextRequest) {
  const denied = await guard()
  if (denied) return denied
  const b = await req.json().catch(() => ({}))

  if (Array.isArray(b.ids)) {
    const status = b.status === 'approved' ? 'approved' : 'pending'
    const ids = b.ids.map(String).filter(Boolean)
    if (!ids.length) return NextResponse.json({ error: 'No entries given' }, { status: 400 })
    const { error } = await supabaseAdmin.from('entity_history').update({ status, updated_at: new Date().toISOString() }).in('id', ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await refreshPages(ids)
    return NextResponse.json({ success: true })
  }

  const id = String(b.id ?? '')
  const fields = clean(b)
  if (!id || !Object.keys(fields).length) return NextResponse.json({ error: 'Nothing to save' }, { status: 400 })
  const { error } = await supabaseAdmin.from('entity_history').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await refreshPages([id]) // editing an approved entry changes the live page
  return NextResponse.json({ success: true })
}

// DELETE ?id=
export async function DELETE(req: NextRequest) {
  const denied = await guard()
  if (denied) return denied
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { data: row } = await supabaseAdmin.from('entity_history').select('entity_type, entity_id').eq('id', id).maybeSingle()
  const { error } = await supabaseAdmin.from('entity_history').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (row) refreshPage(row.entity_type, row.entity_id)
  return NextResponse.json({ success: true })
}
