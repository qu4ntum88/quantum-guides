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
        </div>
      </section>
      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <div className="flex flex-col items-center justify-start gap-12 px-4 py-4 text-white">
            <LegacyGrid legacyPieces={legacyPieces} />
          </div>
        </div>
      </section>
    </main>
  )
}
