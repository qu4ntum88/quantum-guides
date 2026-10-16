import type { Metadata } from 'next'
import SiteAdmin from '@/src/admin/SiteAdmin'

export const metadata: Metadata = {
  title: 'Site Admin · Quantum Game Guides',
}

// The whole panel is client-side: it asks /api/admin/whoami what it may show,
// and every route behind its tabs re-checks access on the server.
export default function SiteAdminPage() {
  return (
    <main>
      <div className="container" style={{ maxWidth: '1100px', paddingTop: '2rem', paddingBottom: '4rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Site Admin</h1>
        <SiteAdmin />
      </div>
    </main>
  )
}
