/**
 * Site role ladder — isomorphic. Safe to import from client components.
 * The server-only resolution (Clerk lookup, gates) lives in ./roles-server.
 *
 *   admin   — Tyler. Everything, including approving applications and editing
 *             the official tier lists.
 *   editor  — trusted content creators. Guides + infographics (submitted for
 *             review) and their own tier lists.
 *   creator — approved content creators. Their own tier lists only.
 *   member  — any signed-in user. Community tier voting, and applying for the
 *             roles above.
 *
 * The role lives in Clerk `publicMetadata.role`, the same mechanism the content
 * editor already used for admins, so nothing about the existing admin path
 * changes.
 */

export const ROLES = ['member', 'creator', 'editor', 'admin'] as const
export type Role = (typeof ROLES)[number]

// Higher number = more access. Used by hasRole() so checks read as "at least".
const RANK: Record<Role, number> = { member: 0, creator: 1, editor: 2, admin: 3 }

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

/** Does `role` grant at least the access of `minimum`? */
export function hasRole(role: Role, minimum: Role): boolean {
  return RANK[role] >= RANK[minimum]
}

/** What each role may reach in the studio, in one place so UI and API agree. */
export const CAN = {
  tierLists: (role: Role) => hasRole(role, 'creator'),
  guides: (role: Role) => hasRole(role, 'editor'),
  infographics: (role: Role) => hasRole(role, 'editor'),
  moderate: (role: Role) => hasRole(role, 'admin'),
  officialTiers: (role: Role) => hasRole(role, 'admin'),
} as const

export const ROLE_LABEL: Record<Role, string> = {
  member: 'Site Member',
  creator: 'Creator',
  editor: 'Editor',
  admin: 'Admin',
}

/** Reads a role + public byline out of Clerk publicMetadata (either side). */
export function readRoleMeta(metadata: unknown): { role: Role; creatorName: string | null } {
  const meta = (metadata ?? {}) as { role?: unknown; creatorName?: unknown }
  return {
    role: isRole(meta.role) ? meta.role : 'member',
    creatorName:
      typeof meta.creatorName === 'string' && meta.creatorName.trim() ? meta.creatorName.trim() : null,
  }
}
