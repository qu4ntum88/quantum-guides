import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'
import StatusEffectGrid from '@/src/vh/components/StatusEffectGrid'
import type { StatusEffect } from '@/src/vh/components/StatusEffectBox'

export const metadata: Metadata = { robots: 'noindex, nofollow' }

function getStatusEffects(): StatusEffect[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/vh/data/status-effects.json'), 'utf8'))
  } catch { return [] }
}

export default function StatusEffectsPage() {
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
          <h1 style={{ color: '#fff', marginBottom: '0.5rem' }}>Void Hunters — Status Effects</h1>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a href="/games/void-hunters" className="btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}>
              Hunter Database
            </a>
            <a href="/games/void-hunters/guides" className="btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}>
              ← Back to Hub
            </a>
          </div>
        </div>
      </section>

      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <StatusEffectGrid effects={effects} />
          </div>
        </div>
      </section>
    </main>
  )
}
