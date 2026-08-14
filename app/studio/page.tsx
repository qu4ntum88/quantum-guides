import type { Metadata } from 'next'
import StudioClient from '@/src/dcdl/components/studio/StudioClient'

export const metadata: Metadata = {
  title: 'Creator Studio · Quantum Game Guides',
  robots: { index: false, follow: false },
}

// Gating happens client-side in <StudioClient> (via useUser) and server-side in
// every API route behind it. This mirrors /admin/content, which avoids the
// server auth() path that was 404ing on the current Clerk instance.
export default function StudioPage() {
  return (
    <main className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem', maxWidth: '1100px' }}>
      <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>
        Quantum Game Guides
      </p>
      <h1 style={{ marginTop: '0.4rem' }}>Creator Studio</h1>
      <p style={{ color: '#aaa', maxWidth: '640px', lineHeight: 1.6 }}>
        Build tier lists, write guides, and upload infographics from any device. Published changes reach the live site
        within about a minute.
      </p>
      <div style={{ marginTop: '2rem' }}>
        <StudioClient />
      </div>
    </main>
  )
}
