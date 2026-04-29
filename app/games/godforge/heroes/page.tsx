import fs from 'fs'
import path from 'path'
import GfHeroGrid from '@/src/gf/components/GfHeroGrid'
import type { GfHero } from '@/src/gf/components/GfHeroBox'

function getHeroes(): GfHero[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/gf/data/heroes.json'), 'utf8'))
  } catch { return [] }
}

export default function GodforgeHeroesPage() {
  const heroes = getHeroes()

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
          <h1 style={{ color: '#fff', marginBottom: '0.5rem' }}>Godforge — Heroes</h1>
          <p style={{ color: '#cccccc' }}>
            Browse all {heroes.length} Godforge heroes. Filter by affinity, allegiance, archetype, and faction.
          </p>
          <div style={{ marginTop: '1rem' }}>
            <a href="/games/godforge" className="btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}>
              ← Back to Godforge
            </a>
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
