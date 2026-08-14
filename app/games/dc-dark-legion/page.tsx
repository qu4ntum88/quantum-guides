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
          <p className="gh-overline">Champion Database</p>
          <h1 className="gh-hero-title">DC: Dark Legion</h1>
          <p className="gh-hero-sub">A complete list of playable champions. Click any portrait to open their individual page for kit analysis, builds, and tier rankings.</p>
          <div className="gh-hero-divider" />
        </div>
      </section>

      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <h2 style={{ margin: 0 }}>Character List</h2>
            <Link href="/games/dc-dark-legion/tier-list" style={{ color: 'var(--gold)', fontSize: '0.85rem', fontFamily: 'Unbounded, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              View Tier List →
            </Link>
          </div>
          <p style={{ marginBottom: '1.5rem', color: '#cccccc' }}>
            A complete list of playable characters. Click a champion portrait to open their individual champion landing page for a more in-depth analysis of their kit, recommended transmutes and legacy pieces, and Quantum&apos;s take on whether or not the champion is worth building for various game modes and playstyles.
          </p>
          <div className="flex flex-col items-center justify-start gap-12 px-4 py-4 text-white">
            <HeroGrid heros={heros} synergyDescImages={synergyDescImages} />
          </div>
        </div>
      </section>

    </main>
  )
}
