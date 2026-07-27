import { NextRequest, NextResponse } from 'next/server'
import { getIsAdmin } from '@/src/lib/adminAuth'
import { supabaseAdmin } from '@/src/lib/supabase'

// Admin-only CRUD for infographics (title + image + credit).

async function guard() {
  if (!(await getIsAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'infographic'
}

export async function GET() {
  const denied = await guard()
  if (denied) return denied
  const { data, error } = await supabaseAdmin.from('infographics').select('*').order('sort', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const denied = await guard()
  if (denied) return denied
  const b = await req.json()
  const title = String(b.title ?? '').trim()
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  // Preserve an explicit id (editing an existing row); otherwise derive a
  // unique-ish one from the title so a new row does not collide.
  const id = b.id ? String(b.id) : `${slugify(title)}_${Date.now()}`

  const row = {
    id,
    title,
    description: String(b.description ?? ''),
    image: b.image ? String(b.image) : null,
    builtin: b.builtin ? String(b.builtin) : null,
    credit: String(b.credit ?? ''),
    sort: Number.isFinite(b.sort) ? Number(b.sort) : 0,
  }
  const { error } = await supabaseAdmin.from('infographics').upsert(row, { onConflict: 'id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, id })
}

export async function DELETE(req: NextRequest) {
  const denied = await guard()
  if (denied) return denied
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await supabaseAdmin.from('infographics').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
