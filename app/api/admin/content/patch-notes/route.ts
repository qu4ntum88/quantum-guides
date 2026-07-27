import { NextRequest, NextResponse } from 'next/server'
import { getIsAdmin } from '@/src/lib/adminAuth'
import { supabaseAdmin } from '@/src/lib/supabase'

// Admin-only CRUD for patch-note entries. Each publish is a new dated row;
// older rows stay as the archive. The newest is the "current" one on the site.

async function guard() {
  if (!(await getIsAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}

export async function GET() {
  const denied = await guard()
  if (denied) return denied
  const { data, error } = await supabaseAdmin
    .from('patch_notes')
    .select('*')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const denied = await guard()
  if (denied) return denied
  const b = await req.json()
  const body = String(b.body ?? '').trim()
  if (!body) return NextResponse.json({ error: 'Patch notes body is required' }, { status: 400 })

  const row: Record<string, unknown> = {
    title: String(b.title ?? '').trim() || 'Patch Notes',
    body,
    published_at: b.publishedAt ? String(b.publishedAt).slice(0, 10) : null,
  }
  // Include id only when editing an existing entry so inserts get a fresh uuid.
  if (b.id) row.id = String(b.id)

  const { error } = await supabaseAdmin.from('patch_notes').upsert(row, { onConflict: 'id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const denied = await guard()
  if (denied) return denied
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await supabaseAdmin.from('patch_notes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
