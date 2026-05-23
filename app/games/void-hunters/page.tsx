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
          <h1 style={{ color: '#fff', marginBottom: '0.5rem' }}>Void Hunters — Hunter Database</h1>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a href="/games/void-hunters/guides" className="btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}>
              ← Back to Hub
            </a>
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
