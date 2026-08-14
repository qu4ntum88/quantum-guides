import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase'
import { requireRole } from '@/src/lib/roles-server'

/**
 * Admin review queue for editor submissions.
 *
 * Guides and infographics written by editors are saved with `status: 'pending'`
 * and are hidden from the public site (both by RLS on the anon key and by an
 * explicit filter in content-db). Approving flips the status, which is all it
 * takes for the page to pick them up on its next 60s revalidation.
 */

async function guard() {
  return (await requireRole('admin')) ? null : NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// GET — everything awaiting review, both kinds.
export async function GET() {
  const denied = await guard()
  if (denied) return denied

  const [guides, infographics] = await Promise.all([
    supabaseAdmin
      .from('guides')
      .select('id, title, description, body, author, author_user_id, cover_image, pub_date, updated_at')
      .eq('status', 'pending')
      .order('updated_at', { ascending: false }),
    supabaseAdmin
      .from('infographics')
      .select('id, title, description, image, credit, author_name, author_user_id')
      .eq('status', 'pending')
      .order('id', { ascending: false }),
  ])

  if (guides.error) return NextResponse.json({ error: guides.error.message }, { status: 500 })
  if (infographics.error) return NextResponse.json({ error: infographics.error.message }, { status: 500 })

  return NextResponse.json({ guides: guides.data ?? [], infographics: infographics.data ?? [] })
}

// PATCH { kind: 'guide' | 'infographic', id, action: 'approve' | 'reject' }
export async function PATCH(req: NextRequest) {
  const denied = await guard()
  if (denied) return denied

  const b = await req.json().catch(() => ({}))
  const table = b.kind === 'infographic' ? 'infographics' : b.kind === 'guide' ? 'guides' : null
  const id = String(b.id ?? '')
  const action = String(b.action ?? '')
  if (!table || !id || (action !== 'approve' && action !== 'reject')) {
    return NextResponse.json({ error: 'Missing kind, id, or action' }, { status: 400 })
  }

  // Rejecting keeps the row so the author can revise and resubmit rather than
  // losing their work.
  const { error } = await supabaseAdmin
    .from(table)
    .update({ status: action === 'approve' ? 'approved' : 'rejected' })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
