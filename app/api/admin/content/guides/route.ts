import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase'
import { requireRole, type Viewer } from '@/src/lib/roles-server'
import { hasRole } from '@/src/lib/roles'
import { sanitizeGuideBody } from '@/src/dcdl/lib/guide-blocks'

// CRUD for guides, open to editors and admins. Writes go through the
// service-role key AFTER the role check below — the key is never exposed to the
// browser.
//
// Admin saves publish straight away. Editor saves land as `status: 'pending'`
// and are invisible to the public site until an admin approves them in the
// studio's review queue; an editor can only ever read or write their own rows.

async function guard(): Promise<{ viewer: Viewer } | { denied: NextResponse }> {
  const viewer = await requireRole('editor')
  return viewer ? { viewer } : { denied: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'guide'
}

// GET — the guide list for the editor. Admins see everything; editors see only
// what they submitted.
export async function GET() {
  const g = await guard()
  if ('denied' in g) return g.denied

  let query = supabaseAdmin.from('guides').select('*').order('pub_date', { ascending: false, nullsFirst: false })
  if (!hasRole(g.viewer.role, 'admin')) query = query.eq('author_user_id', g.viewer.userId!)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — create or update a guide (upsert on id).
export async function POST(req: NextRequest) {
  const g = await guard()
  if ('denied' in g) return g.denied
  const { viewer } = g
  const isAdmin = hasRole(viewer.role, 'admin')

  const b = await req.json()

  const title = String(b.title ?? '').trim()
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  const id = (b.id ? slugify(String(b.id)) : slugify(title))

  // Editing an existing guide: an editor may only touch their own, and may not
  // re-publish one that has already been approved.
  const { data: existing } = await supabaseAdmin
    .from('guides')
    .select('author_user_id, status')
    .eq('id', id)
    .maybeSingle()
  if (existing && !isAdmin && existing.author_user_id !== viewer.userId) {
    return NextResponse.json({ error: 'That guide belongs to someone else.' }, { status: 403 })
  }

  const row = {
    id,
    title,
    description: String(b.description ?? ''),
    // Re-sanitize rich paragraph HTML server-side before it is persisted.
    body: sanitizeGuideBody(String(b.body ?? '')),
    author: b.author ? String(b.author) : (isAdmin ? null : viewer.creatorName),
    pub_date: b.pubDate ? String(b.pubDate).slice(0, 10) : null,
    cover_image: b.coverImage ? String(b.coverImage) : null,
    tags: Array.isArray(b.tags) ? b.tags.map(String) : [],
    event_type: b.eventType ? String(b.eventType) : null,
    event_dates: b.eventDates ? String(b.eventDates) : null,
    recommended_for: b.recommendedFor ? String(b.recommendedFor) : null,
    key_rewards: Array.isArray(b.keyRewards) ? b.keyRewards.map(String) : [],
    // An admin editing someone's pending submission leaves it pending until
    // they explicitly approve it in the review queue.
    status: isAdmin ? (existing?.status ?? 'approved') : 'pending',
    author_user_id: existing?.author_user_id ?? (isAdmin ? null : viewer.userId),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabaseAdmin.from('guides').upsert(row, { onConflict: 'id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, id, status: row.status })
}

// DELETE ?id=slug
export async function DELETE(req: NextRequest) {
  const g = await guard()
  if ('denied' in g) return g.denied

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  if (!hasRole(g.viewer.role, 'admin')) {
    const { data: existing } = await supabaseAdmin.from('guides').select('author_user_id').eq('id', id).maybeSingle()
    if (!existing || existing.author_user_id !== g.viewer.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { error } = await supabaseAdmin.from('guides').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
