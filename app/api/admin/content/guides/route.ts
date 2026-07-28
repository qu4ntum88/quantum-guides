import { NextRequest, NextResponse } from 'next/server'
import { getIsAdmin } from '@/src/lib/adminAuth'
import { supabaseAdmin } from '@/src/lib/supabase'
import { sanitizeGuideBody } from '@/src/dcdl/lib/guide-blocks'

// Admin-only CRUD for guides. Writes go through the service-role key AFTER the
// Clerk admin check below — the key is never exposed to the browser.

async function guard() {
  if (!(await getIsAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'guide'
}

// GET — full guide list for the editor.
export async function GET() {
  const denied = await guard()
  if (denied) return denied
  const { data, error } = await supabaseAdmin.from('guides').select('*').order('pub_date', { ascending: false, nullsFirst: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — create or update a guide (upsert on id).
export async function POST(req: NextRequest) {
  const denied = await guard()
  if (denied) return denied
  const b = await req.json()

  const title = String(b.title ?? '').trim()
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  const id = (b.id ? slugify(String(b.id)) : slugify(title))

  const row = {
    id,
    title,
    description: String(b.description ?? ''),
    // Re-sanitize rich paragraph HTML server-side before it is persisted.
    body: sanitizeGuideBody(String(b.body ?? '')),
    author: b.author ? String(b.author) : null,
    pub_date: b.pubDate ? String(b.pubDate).slice(0, 10) : null,
    cover_image: b.coverImage ? String(b.coverImage) : null,
    tags: Array.isArray(b.tags) ? b.tags.map(String) : [],
    event_type: b.eventType ? String(b.eventType) : null,
    event_dates: b.eventDates ? String(b.eventDates) : null,
    recommended_for: b.recommendedFor ? String(b.recommendedFor) : null,
    key_rewards: Array.isArray(b.keyRewards) ? b.keyRewards.map(String) : [],
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabaseAdmin.from('guides').upsert(row, { onConflict: 'id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, id })
}

// DELETE ?id=slug
export async function DELETE(req: NextRequest) {
  const denied = await guard()
  if (denied) return denied
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await supabaseAdmin.from('guides').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
