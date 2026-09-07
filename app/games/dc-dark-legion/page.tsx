import Link from 'next/link'
import { getResolvedHeros, getSynergies } from '@/src/dcdl/lib/data'
import HeroGrid from '@/src/dcdl/components/HeroGrid'
import '../godforge/game.css'

export default function DCDarkLegionPage() {
  const heros = getResolvedHeros()
  const synergyDescImages = Object.fromEntries(
    getSynergies()
      .filter((s) => s.descriptionImage)
      .map((s) => [s.id, s.descriptionImage!])
  )

  return (
    <main style={{ '--game-accent': '#4f8ef7' } as React.CSSProperties}>
      <section className="gh-hero">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
            <h1 className="gh-hero-title" style={{ margin: 0 }}>DC: Dark Legion Champion Database</h1>
            <Link
              href="/games/dc-dark-legion/tier-list"
              className="btn"
              style={{ padding: '0.5rem 1.25rem', background: 'var(--purple)', borderColor: 'var(--purple)', fontFamily: 'Unbounded, sans-serif', textTransform: 'uppercase', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
            >
              View Tier List →
            </Link>
          </div>
          <p className="gh-hero-sub" style={{ maxWidth: '72ch' }}>
            A complete list of playable champions. Click any champion portrait to open its individual landing page for a more in-depth analysis of the champion kit, recommended transmutes and legacy pieces, and Quantum&apos;s take on whether or not the champion is worth building for various game modes and playstyles.
          </p>
          <div className="gh-hero-divider" />
        </div>
      </section>

      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <div className="flex flex-col items-center justify-start gap-12 px-4 py-4 text-white">
            <HeroGrid heros={heros} synergyDescImages={synergyDescImages} />
          </div>
        </div>
      </section>

    </main>
  )
}
