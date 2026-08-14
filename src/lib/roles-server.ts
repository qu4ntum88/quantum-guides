import { auth, currentUser } from '@clerk/nextjs/server'
import { hasRole, readRoleMeta, type Role } from './roles'

/**
 * Server-side role resolution and gates. Never trust a role sent from the
 * browser — every write route resolves the role here, from Clerk, before it
 * touches Supabase.
 *
 * `ADMIN_USER_IDS` remains a no-dashboard fallback, for admin only.
 */

const allowlist = (process.env.ADMIN_USER_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

export type Viewer = {
  userId: string | null
  role: Role
  /** Public byline for creators/editors, set when their application is approved. */
  creatorName: string | null
}

export async function getViewer(): Promise<Viewer> {
  const { userId } = await auth()
  if (!userId) return { userId: null, role: 'member', creatorName: null }

  const user = await currentUser()
  const { role, creatorName } = readRoleMeta(user?.publicMetadata)
  return {
    userId,
    role: allowlist.includes(userId) ? 'admin' : role,
    creatorName,
  }
}

/**
 * Returns the viewer when they hold at least `minimum`, otherwise null —
 * callers turn that into a 403.
 */
export async function requireRole(minimum: Role): Promise<Viewer | null> {
  const viewer = await getViewer()
  if (!viewer.userId) return null
  return hasRole(viewer.role, minimum) ? viewer : null
}
