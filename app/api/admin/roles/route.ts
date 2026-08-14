import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/src/lib/supabase'
import { requireRole } from '@/src/lib/roles-server'
import { isRole, readRoleMeta, type Role } from '@/src/lib/roles'

/**
 * Admin review queue for creator/editor applications, plus the roster of
 * everyone who already holds a role.
 *
 * Approving writes the role into Clerk `publicMetadata` — that is what every
 * server-side gate reads, so the grant takes effect on the applicant's next
 * request. Emails and usernames are re-read live from Clerk here (the row also
 * carries a snapshot from apply time) and never leave this admin-gated route.
 */

async function guard() {
  return (await requireRole('admin')) ? null : NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

type AppRow = {
  id: string
  user_id: string
  requested_role: string
  creator_name: string
  email: string | null
  username: string | null
  discord_name: string | null
  links: string | null
  pitch: string | null
  status: string
  review_note: string | null
  created_at: string
  reviewed_at: string | null
}

// GET — every application, newest first, enriched with the applicant's current
// Clerk identity and role.
export async function GET() {
  const denied = await guard()
  if (denied) return denied

  const { data, error } = await supabaseAdmin
    .from('role_applications')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as AppRow[]
  const client = await clerkClient()

  const applications = await Promise.all(
    rows.map(async (r) => {
      let liveEmail: string | null = null
      let liveUsername: string | null = null
      let currentRole: Role = 'member'
      try {
        const u = await client.users.getUser(r.user_id)
        liveEmail = u.primaryEmailAddress?.emailAddress ?? u.emailAddresses[0]?.emailAddress ?? null
        liveUsername = u.username ?? [u.firstName, u.lastName].filter(Boolean).join(' ') ?? null
        currentRole = readRoleMeta(u.publicMetadata).role
      } catch {
        // Deleted Clerk account — fall back to the snapshot taken at apply time.
      }
      return {
        ...r,
        email: liveEmail ?? r.email,
        username: liveUsername ?? r.username,
        currentRole,
      }
    })
  )

  // Everyone who currently holds a role, so the tab doubles as a roster.
  const staff: { userId: string; email: string | null; username: string | null; role: Role; creatorName: string | null }[] = []
  try {
    const list = await client.users.getUserList({ limit: 500 })
    for (const u of list.data) {
      const { role, creatorName } = readRoleMeta(u.publicMetadata)
      if (role === 'member') continue
      staff.push({
        userId: u.id,
        email: u.primaryEmailAddress?.emailAddress ?? u.emailAddresses[0]?.emailAddress ?? null,
        username: u.username ?? [u.firstName, u.lastName].filter(Boolean).join(' ') ?? null,
        role,
        creatorName,
      })
    }
  } catch {
    // Non-fatal: the review queue still works without the roster.
  }

  return NextResponse.json({ applications, staff })
}

/**
 * PATCH — act on an application, or change someone's role directly.
 *
 *   { id, action: 'approve' | 'reject', note?, grantRole? }
 *   { userId, setRole: Role, creatorName? }
 */
export async function PATCH(req: NextRequest) {
  const denied = await guard()
  if (denied) return denied

  const b = await req.json().catch(() => ({}))
  const client = await clerkClient()

  // Direct role change (promote/demote/revoke from the roster).
  if (b.userId && b.setRole !== undefined) {
    if (!isRole(b.setRole)) return NextResponse.json({ error: 'Unknown role' }, { status: 400 })
    await setRole(client, String(b.userId), b.setRole, b.creatorName ? String(b.creatorName) : undefined)
    return NextResponse.json({ success: true })
  }

  const id = String(b.id ?? '')
  const action = String(b.action ?? '')
  if (!id || (action !== 'approve' && action !== 'reject')) {
    return NextResponse.json({ error: 'Missing application id or action' }, { status: 400 })
  }

  const { data: app, error: readErr } = await supabaseAdmin
    .from('role_applications')
    .select('*')
    .eq('id', id)
    .single()
  if (readErr || !app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  if (action === 'approve') {
    // Admin may approve at a lower role than requested (e.g. editor → creator).
    const granted: Role = isRole(b.grantRole) ? b.grantRole : (app.requested_role as Role)
    if (granted === 'member' || granted === 'admin') {
      return NextResponse.json({ error: 'Approve as creator or editor.' }, { status: 400 })
    }
    await setRole(client, app.user_id as string, granted, app.creator_name as string)
  }

  const { error } = await supabaseAdmin
    .from('role_applications')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      review_note: String(b.note ?? '').slice(0, 1000),
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// Merge the role into publicMetadata without clobbering anything else stored there.
async function setRole(
  client: Awaited<ReturnType<typeof clerkClient>>,
  userId: string,
  role: Role,
  creatorName?: string
) {
  const user = await client.users.getUser(userId)
  const existing = (user.publicMetadata ?? {}) as Record<string, unknown>
  const publicMetadata: Record<string, unknown> = { ...existing, role }
  if (creatorName) publicMetadata.creatorName = creatorName
  if (role === 'member') delete publicMetadata.role
  await client.users.updateUserMetadata(userId, { publicMetadata })
}
