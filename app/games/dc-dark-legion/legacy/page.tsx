import Link from 'next/link'
import { getResolvedLegacy } from '@/src/dcdl/lib/data'
import LegacyGrid from '@/src/dcdl/components/LegacyGrid'
import '../../godforge/game.css'

export default function LegacyPage() {
  const legacyPieces = getResolvedLegacy()

  return (
    <main>
      <section className="gh-hero" style={{ '--game-accent': '#4f8ef7' } as React.CSSProperties}>
        <div className="container">
          <p className="gh-overline">Legacy Database</p>
          <h1 className="gh-hero-title">DC: Dark Legion</h1>
          <p className="gh-hero-sub">A complete list of legacy pieces — browse, filter, and view community tier rankings.</p>
          <div className="gh-hero-divider" />
          <div style={{ marginTop: '1rem' }}>
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
          <div className="flex flex-col items-center justify-start gap-12 px-4 py-4 text-white">
            <LegacyGrid legacyPieces={legacyPieces} />
          </div>
        </div>
      </section>
    </main>
  )
}
