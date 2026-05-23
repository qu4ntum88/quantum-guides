import { getResolvedLegacy } from '@/src/dcdl/lib/data'
import LegacyGrid from '@/src/dcdl/components/LegacyGrid'

export default function LegacyPage() {
  const legacyPieces = getResolvedLegacy()

  return (
    <main>
      <section
        style={{
          backgroundImage: "url('/images/site/Quantum Purple Background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '3rem 0',
        }}
      >
        <div className="container">
          <h1>DC: Dark Legion — Legacy Pieces</h1>
          <p style={{ color: '#cccccc' }}>A complete list of legacy items in DC: Dark Legion.</p>
          <a
            href="/games/dc-dark-legion/legacy/community-tier"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', color: 'var(--gold)', fontSize: '0.85rem' }}
          >
            <img src="/images/site/JLD.png" alt="" style={{ height: '1.5rem', objectFit: 'contain' }} />
            Community Voted Tier Rankings →
          </a>
        </div>
      </section>
      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.5rem' }}>
            Clicking a legacy piece opens the{' '}
            <a href="/games/dc-dark-legion/legacy/community-tier" style={{ color: 'var(--gold)' }}>
              Justice League of Discord community voted tier ranking page
            </a>{' '}for that item.
          </p>
          <div className="flex flex-col items-center justify-start gap-12 px-4 py-4 text-white">
            <LegacyGrid legacyPieces={legacyPieces} />
          </div>
        </div>
      </section>
    </main>
  )
}
