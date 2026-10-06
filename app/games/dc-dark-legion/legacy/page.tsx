import Link from 'next/link'
import { getDataLastUpdated } from '@/src/dcdl/lib/data'
import { getOfficialLegacyResolved, getOfficialTiersUpdatedAt } from '@/src/dcdl/lib/tier-db'
import LegacyGrid from '@/src/dcdl/components/LegacyGrid'
import '../../godforge/game.css'

// Official tiers are read from Supabase, so pick up Studio edits within a minute.
export const revalidate = 60

export default async function LegacyPage() {
  const [legacyPieces, savedAt] = await Promise.all([getOfficialLegacyResolved(), getOfficialTiersUpdatedAt()])
  const lastUpdated = savedAt
    ? new Date(savedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : getDataLastUpdated('legacy.json')

  return (
    <main>
      <section className="gh-hero" style={{ '--game-accent': '#4f8ef7' } as React.CSSProperties}>
        <div className="container">
          <p className="gh-overline">Legacy Pieces</p>
          <h1 className="gh-hero-title">DC: Dark Legion</h1>
          <p className="gh-hero-sub">
            Every legacy piece, ranked by Quantum &amp; Tyvokka, plus F2P and New Player brackets. Filter to highlight,
            or switch to Grid to sort.
          </p>
          <div className="gh-hero-divider" />
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {lastUpdated && (
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', fontFamily: 'monospace' }}>Updated: {lastUpdated}</span>
            )}
            <Link href="/games/dc-dark-legion/legacy/community-tier" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold)', fontSize: '0.82rem', textDecoration: 'none', opacity: 0.9 }}>
              <img src="/images/site/JLD.png" alt="" style={{ height: '1.5rem', objectFit: 'contain' }} />
              Community Voted Tier Rankings →
            </Link>
          </div>
        </div>
      </section>
      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.5rem' }}>
            Clicking a legacy piece opens the{' '}
            <Link href="/games/dc-dark-legion/legacy/community-tier" style={{ color: 'var(--gold)' }}>
              Justice League of Discord community voted tier ranking page
            </Link>{' '}for that item.
          </p>
          <div className="flex flex-col items-center justify-start gap-12 py-4 text-white md:px-4">
            <LegacyGrid
              legacyPieces={legacyPieces}
              dateLine={lastUpdated ? `Updated ${lastUpdated}` : undefined}
            />
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#888', fontStyle: 'italic' }}>
            <strong style={{ color: '#aaa', fontStyle: 'normal' }}>Note:</strong> This Legacy Piece tier list is a collaboration with Tyvokka.
          </p>
        </div>
      </section>
    </main>
  )
}
