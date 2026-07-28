import type { Metadata } from 'next'
import AdminGate from '@/src/dcdl/components/admin/AdminGate'

export const metadata: Metadata = {
  title: 'Content Editor · Quantum Game Guides',
  robots: { index: false, follow: false },
}

// No server-side Clerk here — admin gating happens client-side in <AdminGate>
// (via useUser) and server-side in every /api/admin/content/* route. This
// avoids the server auth() path that was 404ing on the current Clerk instance.
export default function ContentAdminPage() {
  return (
    <main className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem', maxWidth: '900px' }}>
      <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>
        DC: Dark Legion
      </p>
      <h1 style={{ marginTop: '0.4rem' }}>Content Editor</h1>
      <p style={{ color: '#aaa', maxWidth: '620px', lineHeight: 1.6 }}>
        Create and edit guides, patch notes, and infographics from anywhere. Changes publish to the
        live site within about a minute.
      </p>
      <div style={{ marginTop: '2rem' }}>
        <AdminGate />
      </div>
    </main>
  )
}
