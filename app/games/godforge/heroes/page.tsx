import fs from 'fs'
import path from 'path'
import GfHeroGrid from '@/src/gf/components/GfHeroGrid'
import type { GfHero } from '@/src/gf/components/GfHeroBox'
import '../game.css'

function getHeroes(): GfHero[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/gf/data/heroes.json'), 'utf8'))
  } catch { return [] }
}

export default function GodforgeHeroesPage() {
  const heroes = getHeroes()

  return (
    <main style={{ '--game-accent': '#a855f7' } as React.CSSProperties}>
      <section className="gh-hero">
        <div className="container">
          <p className="gh-overline">Hero Database</p>
          <h1 className="gh-hero-title">Godforge Heroes</h1>
          <p className="gh-hero-sub">Browse all {heroes.length} heroes — filter by affinity, allegiance, archetype, and faction.</p>
          <div className="gh-hero-divider" />
          <div className="gh-hero-back">
            <a href="/games/godforge" className="btn" style={{ fontSize: '0.78rem', padding: '0.45rem 1rem' }}>← Back to Hub</a>
          </div>
        </div>
      </section>

      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <GfHeroGrid heroes={heroes} />
        </div>
      </section>
    </main>
  )
}
