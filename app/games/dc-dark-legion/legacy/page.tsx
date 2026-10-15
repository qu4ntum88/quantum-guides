import Link from 'next/link'
import { getDataLastUpdated } from '@/src/dcdl/lib/data'
import { getOfficialLegacyResolved, getOfficialTiersUpdatedAt, TIERS } from '@/src/dcdl/lib/tier-db'
import LegacyGrid from '@/src/dcdl/components/LegacyGrid'
import JsonLd from '@/app/components/JsonLd'
import { pageMeta, monthYear, breadcrumbLd, itemListLd, DCDL_CRUMB } from '@/src/lib/seo'
import '../../godforge/game.css'

// Official tiers are read from Supabase, so pick up Studio edits within a minute.
export const revalidate = 60

const PATH = '/games/dc-dark-legion/legacy'

export async function generateMetadata() {
  const savedAt = await getOfficialTiersUpdatedAt()
  const month = monthYear(savedAt ?? getDataLastUpdated('legacy.json'))
  return pageMeta({
    title: `DC: Dark Legion Legacy Tier List${month ? ` (${month})` : ''}: Every Piece Ranked`,
    description:
      `Every DC: Dark Legion legacy piece ranked S+ to D by Quantum and Tyvokka${month ? `, updated ${month}` : ''}, ` +
      'with F2P and new-player picks. See Gear Effects at every star, skill upgrades and which champions use each piece.',
    path: PATH,
  })
}

export default async function LegacyPage() {
  const [legacyPieces, savedAt] = await Promise.all([getOfficialLegacyResolved(), getOfficialTiersUpdatedAt()])
  const lastUpdated = savedAt
    ? new Date(savedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : getDataLastUpdated('legacy.json')
  const rankOf = (t?: string) => { const i = (TIERS as readonly string[]).indexOf(t ?? ''); return i === -1 ? TIERS.length : i }
  const ranked = [...legacyPieces].sort((a, b) => rankOf(a.tier) - rankOf(b.tier))

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbLd([DCDL_CRUMB, ['Legacy Tier List', PATH]]),
          itemListLd('DC: Dark Legion Legacy Tier List', ranked.map((l) => ({ name: l.name, path: `${PATH}/${l.id}` }))),
        ]}
      />
      <section className="gh-hero" style={{ '--game-accent': '#4f8ef7' } as React.CSSProperties}>
        <div className="container">
          <p className="gh-overline">Legacy Pieces</p>
          <h1 className="gh-hero-title">DC: Dark Legion Legacy Tier List</h1>
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
            Click a legacy piece for its Gear Effects at every star, both skills and how they upgrade, and who can equip it.
            Community votes live on the{' '}
            <Link href="/games/dc-dark-legion/legacy/community-tier" style={{ color: 'var(--gold)' }}>
              Justice League of Discord community voted tier ranking page
            </Link>.
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
