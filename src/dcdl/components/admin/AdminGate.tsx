'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import ContentEditor from './ContentEditor'

/**
 * Client-side admin gate for the content editor.
 *
 * Uses Clerk's client `useUser()` (the same mechanism community voting relies
 * on) instead of server-side auth() — the server path was returning a 404 on
 * the current Clerk instance. Security is still enforced server-side by every
 * /api/admin/content/* route (getIsAdmin), so this gate is only about which UI
 * to show; a non-admin who reaches it can't read or write anything.
 */
export default function AdminGate() {
  const { isLoaded, isSignedIn, user } = useUser()

  if (!isLoaded) {
    return <p style={{ color: '#888' }}>Loading…</p>
  }

  if (!isSignedIn) {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Please sign in</h3>
        <p style={{ color: '#aaa', margin: '0 0 1rem' }}>
          You need to be signed in as an editor to use this page.
        </p>
        <Link href="/sign-in?redirect_url=/admin/content" className="btn">Sign in</Link>
      </div>
    )
  }

  const role = (user?.publicMetadata as { role?: string } | undefined)?.role
  if (role !== 'admin') {
    return (
      <div className="card" style={{ borderColor: 'rgba(239,68,68,0.4)' }}>
        <h3 style={{ marginTop: 0 }}>Not authorized</h3>
        <p style={{ color: '#aaa', margin: 0 }}>
          You&rsquo;re signed in as <strong>{user?.primaryEmailAddress?.emailAddress ?? 'this account'}</strong>,
          but it isn&rsquo;t an editor. If this should be you, set this account&rsquo;s Clerk{' '}
          <code>publicMetadata.role</code> to <code>&quot;admin&quot;</code>.
        </p>
      </div>
    )
  }

  return <ContentEditor />
}
