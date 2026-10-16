import Link from 'next/link'
import { getResolvedLegacy } from '@/src/dcdl/lib/data'
import LegacyCommunityTierClient from '@/src/dcdl/components/LegacyCommunityTierClient'
import { pageMeta } from '@/src/lib/seo'

export const metadata = pageMeta({
  title: 'DC: Dark Legion Legacy Community Tier Votes',
  description: 'Community voted tier rankings for all DC: Dark Legion legacy pieces, powered by the Justice League of Discord. Sign in and cast your own vote.',
  path: '/games/dc-dark-legion/legacy/community-tier',
})

export default function LegacyCommunityTierPage() {
  const pieces = getResolvedLegacy().sort((a, b) => a.name.localeCompare(b.name))

  return (
    <main>
      <section style={{ padding: '3rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <img src="/images/site/JLD.png" alt="Justice League of Discord" style={{ height: '5rem', objectFit: 'contain', flexShrink: 0 }} />
            <h1 style={{ color: '#fff', margin: 0, fontSize: 'clamp(1rem, 3vw, 1.75rem)', fontFamily: 'Unbounded, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Justice League of Discord Community Voted Tier Ranking
            </h1>
          </div>
          <p style={{ color: '#cccccc', marginTop: '0.75rem' }}>
            Community votes for all DC: Dark Legion legacy pieces. Sign in to cast your vote.
          </p>
          <Link href="/games/dc-dark-legion/legacy-tier-list" style={{ color: 'var(--gold)', fontSize: '0.85rem', display: 'inline-block', marginTop: '0.5rem' }}>
            ← Back to Legacy Pieces
          </Link>
        </div>
      </section>

      <section style={{ padding: '2rem 0 4rem' }}>
        <div className="container" style={{ maxWidth: '52rem' }}>
          <LegacyCommunityTierClient pieces={pieces} />
        </div>
      </section>
    </main>
  )
}
