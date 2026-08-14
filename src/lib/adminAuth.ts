import { requireRole } from './roles-server'

/**
 * Server-only admin check for the on-site content editor.
 *
 * Now a thin wrapper over the role ladder in ./roles-server, so admin,
 * editor, and creator all resolve through one code path. A user is an admin if
 * EITHER their Clerk `publicMetadata.role` is "admin" (the primary mechanism —
 * set once in the Clerk dashboard), or their Clerk user id is listed in the
 * ADMIN_USER_IDS env var (comma-separated).
 *
 * This runs on the server (route handlers + the editor page). The service-role
 * Supabase key that can actually write is never exposed to the browser; every
 * write route calls this (or requireRole) first and returns 403 when it fails.
 */
export async function getIsAdmin(): Promise<boolean> {
  return (await requireRole('admin')) !== null
}
