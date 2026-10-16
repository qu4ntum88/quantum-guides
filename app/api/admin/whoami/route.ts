import { NextResponse } from 'next/server'
import { getViewer, requireRole } from '@/src/lib/roles-server'

/**
 * What the Site Admin may show. `local` = running under `next dev`, where the
 * file-writing tabs work; `admin` = the signed-in user holds the admin role,
 * which the Supabase-backed tabs (tier lists, guides, patch notes,
 * infographics, review) need, locally and on the live site alike. `userId` is
 * echoed so a local dev sign-in can be added to ADMIN_USER_IDS.
 */
export async function GET() {
  const [viewer, admin] = await Promise.all([getViewer(), requireRole('admin')])
  return NextResponse.json({
    local: process.env.NODE_ENV !== 'production',
    admin: !!admin,
    signedIn: !!viewer.userId,
    userId: viewer.userId,
  })
}
