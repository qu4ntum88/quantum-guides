import fs from 'fs'
import path from 'path'
import HunterGrid from '@/src/vh/components/HunterGrid'
import type { Hunter } from '@/src/vh/components/HunterBox'
import '../godforge/game.css'

function getHunters(): Hunter[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/vh/data/hunters.json'), 'utf8'))
  } catch { return [] }
}

export default function VoidHuntersPage() {
  const hunters = getHunters()

  return (
    <main style={{ '--game-accent': '#06b6d4' } as React.CSSProperties}>
      <section className="gh-hero">
        <div className="container">
          <p className="gh-overline">Hunter Database</p>
          <h1 className="gh-hero-title">Void Hunters</h1>
          <p className="gh-hero-sub">Browse all hunters in a sortable grid, or click any hunter for a dedicated page covering their kit, upgrades, and lore.</p>
          <div className="gh-hero-divider" />
          <div className="gh-hero-back">
            <a href="/games/void-hunters/guides" className="btn" style={{ fontSize: '0.78rem', padding: '0.45rem 1rem' }}>← Hub</a>
          </div>
        </div>
      </section>

      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <h2>Hunters</h2>
          <p style={{ marginBottom: '1.5rem', color: '#cccccc' }}>
            Quantum has compiled data on these hunters. You can sort through all the hunters in this grid, or you can click on your favorite hunter and go to a dedicated page to learn more about how their kit works, upgrade information, and their story so far.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <HunterGrid hunters={hunters} />
          </div>
        </div>
      </section>
    </main>
  )
}
