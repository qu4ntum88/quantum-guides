import { getResolvedHeros } from '@/src/dcdl/lib/data'
import HeroGrid from '@/src/dcdl/components/HeroGrid'

export default function DCDarkLegionPage() {
  const heros = getResolvedHeros()

  return (
    <main>
      <section
        className="game-hero"
        style={{
          backgroundImage: "url('/images/site/Quantum Purple Background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '3rem 0',
        }}
      >
        <div className="container">
          <h1 style={{ color: '#fff', marginBottom: '0.5rem' }}>DC: Dark Legion</h1>
          <p style={{ color: '#cccccc' }}>
            Strategy game set in the DC Universe with idle and base-building elements
          </p>
        </div>
      </section>

      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <h2>Character List</h2>
          <p style={{ marginBottom: '1.5rem', color: '#cccccc' }}>
            A complete list of playable characters. Click a portrait for in-depth info.
          </p>
          <div className="flex flex-col items-center justify-start gap-12 px-4 py-4 text-white">
            <HeroGrid heros={heros} />
          </div>
        </div>
      </section>

      <section style={{ padding: '1rem 0 2rem' }}>
        <div className="container">
          <h2>Explore More</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <a href="/games/dc-dark-legion/legacy" className="btn">Legacy Pieces</a>
            <a href="/games/dc-dark-legion/mementos" className="btn">Mementos</a>
            <a href="/games/dc-dark-legion/guides" className="btn">Guides</a>
          </div>
        </div>
      </section>
    </main>
  )
}
