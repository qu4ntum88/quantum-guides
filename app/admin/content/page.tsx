import type { Metadata } from 'next'
import { getIsAdmin } from '@/src/lib/adminAuth'
import ContentEditor from '@/src/dcdl/components/admin/ContentEditor'

export const metadata: Metadata = {
  title: 'Content Editor · Quantum Game Guides',
  robots: { index: false, follow: false },
}

// Force per-request evaluation so the admin check always runs fresh.
export const dynamic = 'force-dynamic'

export default async function ContentAdminPage() {
  const isAdmin = await getIsAdmin()

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
        {isAdmin ? (
          <ContentEditor />
        ) : (
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.4)' }}>
            <h3 style={{ marginTop: 0 }}>Not authorized</h3>
            <p style={{ color: '#aaa', margin: 0 }}>
              You&rsquo;re signed in, but this account isn&rsquo;t an editor. If this should be you,
              set your Clerk <code>publicMetadata.role</code> to <code>&quot;admin&quot;</code>.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
