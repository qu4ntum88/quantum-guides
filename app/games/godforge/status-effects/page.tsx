import fs from 'fs'
import path from 'path'
import GfStatusEffectGrid from '@/src/gf/components/GfStatusEffectGrid'
import type { GfStatusEffect } from '@/src/gf/components/GfStatusEffectBox'

function getStatusEffects(): GfStatusEffect[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/gf/data/status-effects.json'), 'utf8'))
  } catch { return [] }
}

export default function GodforgeStatusEffectsPage() {
  const effects = getStatusEffects()

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
          <h1 style={{ color: '#fff', marginBottom: '0.5rem' }}>Godforge — Status Effects</h1>
          <p style={{ color: '#cccccc' }}>Browse all status effects. Hover an icon for its description.</p>
          <div style={{ marginTop: '1rem' }}>
            <a href="/games/godforge" className="btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}>
              ← Back to Godforge
            </a>
          </div>
        </div>
      </section>

      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <GfStatusEffectGrid effects={effects} />
          </div>
        </div>
      </section>
    </main>
  )
}
