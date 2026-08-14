import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase'
import { requireRole, type Viewer } from '@/src/lib/roles-server'
import { hasRole } from '@/src/lib/roles'

// CRUD for infographics (title + image + credit), open to editors and admins.
// Admin saves publish immediately; editor uploads land as 'pending' for review
// and an editor only ever sees or edits their own.

async function guard(): Promise<{ viewer: Viewer } | { denied: NextResponse }> {
  const viewer = await requireRole('editor')
  return viewer ? { viewer } : { denied: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'infographic'
}

export async function GET() {
  const g = await guard()
  if ('denied' in g) return g.denied

  let query = supabaseAdmin.from('infographics').select('*').order('sort', { ascending: true })
  if (!hasRole(g.viewer.role, 'admin')) query = query.eq('author_user_id', g.viewer.userId!)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const g = await guard()
  if ('denied' in g) return g.denied
  const { viewer } = g
  const isAdmin = hasRole(viewer.role, 'admin')

  const b = await req.json()
  const title = String(b.title ?? '').trim()
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  // Preserve an explicit id (editing an existing row); otherwise derive a
  // unique-ish one from the title so a new row does not collide.
  const id = b.id ? String(b.id) : `${slugify(title)}_${Date.now()}`

  const { data: existing } = await supabaseAdmin
    .from('infographics')
    .select('author_user_id, status')
    .eq('id', id)
    .maybeSingle()
  if (existing && !isAdmin && existing.author_user_id !== viewer.userId) {
    return NextResponse.json({ error: 'That infographic belongs to someone else.' }, { status: 403 })
  }

  const row = {
    id,
    title,
    description: String(b.description ?? ''),
    image: b.image ? String(b.image) : null,
    builtin: b.builtin ? String(b.builtin) : null,
    // Editors are always credited by their creator name.
    credit: isAdmin ? String(b.credit ?? '') : (viewer.creatorName ?? String(b.credit ?? '')),
    sort: Number.isFinite(b.sort) ? Number(b.sort) : 0,
    status: isAdmin ? (existing?.status ?? 'approved') : 'pending',
    author_user_id: existing?.author_user_id ?? (isAdmin ? null : viewer.userId),
    author_name: existing?.author_user_id || isAdmin ? undefined : viewer.creatorName,
  }
  // Drop undefined so an admin edit does not blank an existing author_name.
  const clean = Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined))

  const { error } = await supabaseAdmin.from('infographics').upsert(clean, { onConflict: 'id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, id, status: row.status })
}

export async function DELETE(req: NextRequest) {
  const g = await guard()
  if ('denied' in g) return g.denied

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  if (!hasRole(g.viewer.role, 'admin')) {
    const { data: existing } = await supabaseAdmin.from('infographics').select('author_user_id').eq('id', id).maybeSingle()
    if (!existing || existing.author_user_id !== g.viewer.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { error } = await supabaseAdmin.from('infographics').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
