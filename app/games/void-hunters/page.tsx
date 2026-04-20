import fs from 'fs'
import path from 'path'
import HunterGrid from '@/src/vh/components/HunterGrid'
import type { Hunter } from '@/src/vh/components/HunterBox'

function getHunters(): Hunter[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/vh/data/hunters.json'), 'utf8'))
  } catch { return [] }
}

export default function VoidHuntersPage() {
  const hunters = getHunters()

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
          <h1 style={{ color: '#fff', marginBottom: '0.5rem' }}>Void Hunters</h1>
          <p style={{ color: '#cccccc' }}>
            Fantasy dungeon-crawling RPG — browse Hunters, status effects, and more.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <a href="/games/void-hunters/status-effects" className="btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}>
              Status Effects
            </a>
          </div>
        </div>
      </section>

      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <h2>Hunters</h2>
          <p style={{ marginBottom: '1.5rem', color: '#cccccc' }}>
            A complete list of playable Hunters. Filter by Class, Homeland, Species, and Tags.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <HunterGrid hunters={hunters} />
          </div>
        </div>
      </section>
    </main>
  )
}
