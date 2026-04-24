import { getResolvedHeros, getSynergies } from '@/src/dcdl/lib/data'
import HeroGrid from '@/src/dcdl/components/HeroGrid'

export default function DCDarkLegionPage() {
  const heros = getResolvedHeros()
  const synergyDescImages = Object.fromEntries(
    getSynergies()
      .filter((s) => s.descriptionImage)
      .map((s) => [s.id, s.descriptionImage!])
  )

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
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <h2 style={{ margin: 0 }}>Character List</h2>
            <a href="/games/dc-dark-legion/tier-list" style={{ color: 'var(--gold)', fontSize: '0.85rem', fontFamily: 'Unbounded, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              View Tier List →
            </a>
          </div>
          <p style={{ marginBottom: '1.5rem', color: '#cccccc' }}>
            A complete list of playable characters. Click a portrait for in-depth info.
          </p>
          <div className="flex flex-col items-center justify-start gap-12 px-4 py-4 text-white">
            <HeroGrid heros={heros} synergyDescImages={synergyDescImages} />
          </div>
        </div>
      </section>

    </main>
  )
}
