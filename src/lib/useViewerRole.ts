'use client'

import { useUser } from '@clerk/nextjs'
import { readRoleMeta, type Role } from './roles'

/**
 * Client-side view of the signed-in user's role, read straight off Clerk's
 * publicMetadata (the same mechanism <AdminGate> already used).
 *
 * This decides which UI to render only. Every API route re-resolves the role
 * server-side, so editing publicMetadata in devtools grants nothing.
 */
export function useViewerRole(): {
  isLoaded: boolean
  isSignedIn: boolean
  role: Role
  creatorName: string | null
  email: string | null
  username: string | null
} {
  const { isLoaded, isSignedIn, user } = useUser()
  const { role, creatorName } = readRoleMeta(user?.publicMetadata)
  return {
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    role: isSignedIn ? role : 'member',
    creatorName,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
    username: user?.username ?? null,
  }
}
