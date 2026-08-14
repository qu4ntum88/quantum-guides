import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/src/lib/supabase'
import { getViewer } from '@/src/lib/roles-server'

/**
 * Member-facing endpoint for applying to become a creator or an editor.
 *
 * Applications are stored in `role_applications`, which has no public-read RLS
 * policy — it holds the applicant's email, so it is only ever read back through
 * the admin route using the service-role key.
 */

const REQUESTABLE = new Set(['creator', 'editor'])

// GET — the signed-in member's own role + latest application, for the members page.
export async function GET() {
  const viewer = await getViewer()
  if (!viewer.userId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('role_applications')
    .select('id, requested_role, creator_name, status, review_note, created_at, reviewed_at')
    .eq('user_id', viewer.userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    role: viewer.role,
    creatorName: viewer.creatorName,
    application: data?.[0] ?? null,
  })
}

// POST — submit an application.
export async function POST(req: NextRequest) {
  const viewer = await getViewer()
  if (!viewer.userId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const b = await req.json().catch(() => ({}))
  const requestedRole = String(b.requestedRole ?? '')
  if (!REQUESTABLE.has(requestedRole)) {
    return NextResponse.json({ error: 'Pick either creator or editor.' }, { status: 400 })
  }

  const creatorName = String(b.creatorName ?? '').trim()
  if (!creatorName) return NextResponse.json({ error: 'A creator name is required.' }, { status: 400 })
  if (creatorName.length > 40) {
    return NextResponse.json({ error: 'Creator name must be 40 characters or fewer.' }, { status: 400 })
  }

  // Only one open application at a time (also enforced by a partial unique index).
  const { data: open } = await supabaseAdmin
    .from('role_applications')
    .select('id')
    .eq('user_id', viewer.userId)
    .eq('status', 'pending')
    .limit(1)
  if (open && open.length > 0) {
    return NextResponse.json({ error: 'You already have an application awaiting review.' }, { status: 409 })
  }

  // Snapshot the identity at apply time so the review queue still shows who
  // this was even if they later change their Clerk profile.
  const user = await currentUser()

  const { error } = await supabaseAdmin.from('role_applications').insert({
    user_id: viewer.userId,
    requested_role: requestedRole,
    creator_name: creatorName,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
    username: user?.username ?? [user?.firstName, user?.lastName].filter(Boolean).join(' ') ?? null,
    discord_name: String(b.discordName ?? '').trim().slice(0, 60) || null,
    links: String(b.links ?? '').trim().slice(0, 1000),
    pitch: String(b.pitch ?? '').trim().slice(0, 4000),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
