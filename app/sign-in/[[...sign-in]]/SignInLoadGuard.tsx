'use client'

import { useEffect, useState } from 'react'
import { useClerk } from '@clerk/nextjs'

// Clerk's sign-in UI is rendered entirely by clerk-js, fetched at runtime from
// clerk.quantumgameguides.com. If that fetch is blocked — an ad/tracker blocker, a
// network-level DNS blocker (which is why this can hit someone's PC *and* phone at
// once), strict tracking protection, a corporate proxy — <SignIn /> renders nothing
// and the page is simply blank. Historically the navbar had the same failure in a
// worse form: clicking Sign In called openSignIn() on an unloaded Clerk and silently
// did nothing at all.
//
// This guard turns that dead end into a diagnosis: if Clerk hasn't loaded after a
// generous grace period, say so and give the visitor something to act on.
const GRACE_MS = 8000

export default function SignInLoadGuard({ children }: { children: React.ReactNode }) {
  const { loaded } = useClerk()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (loaded) return
    const t = setTimeout(() => setTimedOut(true), GRACE_MS)
    return () => clearTimeout(t)
  }, [loaded])

  if (loaded) return <>{children}</>
  if (!timedOut) return <p style={{ color: 'var(--gold)', fontFamily: 'Inter, sans-serif' }}>Loading sign-in…</p>

  return (
    <div
      style={{
        maxWidth: '34rem',
        fontFamily: 'Inter, sans-serif',
        color: '#e8e8f0',
        background: 'rgba(20,10,40,0.65)',
        border: '1px solid var(--gold)',
        borderRadius: '0.75rem',
        padding: '1.75rem',
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1.1rem', color: 'var(--gold)', marginTop: 0 }}>
        Sign-in couldn&apos;t load
      </h1>
      <p>
        Our sign-in service (<code>clerk.quantumgameguides.com</code>) didn&apos;t load in your
        browser. Your account is fine — this is a connection problem, not an account problem.
      </p>
      <p style={{ marginBottom: '0.5rem' }}>Most common causes, in order:</p>
      <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
        <li>An ad blocker or privacy extension — pause it for this site and reload.</li>
        <li>
          A network-wide blocker (Pi-hole, AdGuard, NextDNS, some routers). This one affects
          every device on your Wi-Fi, so try mobile data as a quick test.
        </li>
        <li>Strict tracking protection — Brave Shields, Firefox Strict mode, Safari.</li>
      </ol>
      <p style={{ marginTop: '1rem' }}>
        To confirm it&apos;s the blocker, open{' '}
        <a
          href="https://clerk.quantumgameguides.com/v1/environment"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--gold)' }}
        >
          this link
        </a>
        . If it fails to load, something is blocking it. If it shows text, send us a screenshot
        of your browser console and we&apos;ll dig in.
      </p>
    </div>
  )
}
