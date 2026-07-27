import { auth, currentUser } from '@clerk/nextjs/server'

/**
 * Server-only admin check for the on-site content editor.
 *
 * A user is an admin if EITHER:
 *   - their Clerk `publicMetadata.role` is "admin" (the primary mechanism —
 *     set once in the Clerk dashboard), OR
 *   - their Clerk user id is listed in the ADMIN_USER_IDS env var
 *     (comma-separated), a simple no-dashboard fallback.
 *
 * This runs on the server (route handlers + the editor page). The service-role
 * Supabase key that can actually write is never exposed to the browser; every
 * write route calls this first and returns 403 when it is false.
 */

const allowlist = (process.env.ADMIN_USER_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

export async function getIsAdmin(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  if (allowlist.includes(userId)) return true
  const user = await currentUser()
  const role = (user?.publicMetadata as { role?: string } | undefined)?.role
  return role === 'admin'
}
