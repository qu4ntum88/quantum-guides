import { pageMeta } from '@/src/lib/seo'
import fs from 'fs'
import path from 'path'
import StatusEffectGrid from '@/src/vh/components/StatusEffectGrid'
import type { StatusEffect } from '@/src/vh/components/StatusEffectBox'
import WorldHero from '@/src/qgg/components/WorldHero'

export const metadata = pageMeta({
  title: 'Void Hunters Status Effects: Every Buff & Debuff',
  description:
    'Full reference for every Void Hunters status effect: buffs, debuffs and disables with what each one does and how it stacks.',
  path: '/games/void-hunters/status-effects',
})

function getStatusEffects(): StatusEffect[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/vh/data/status-effects.json'), 'utf8'))
  } catch { return [] }
}

export default function StatusEffectsPage() {
  const effects = getStatusEffects()

  return (
    <main>
      <WorldHero
        world="voidhunters"
        overline="Void Hunters"
        title="Void Hunters Status Effects"
        sub="Every buff, debuff and disable, with what each one does and how it stacks."
      >
        <p style={{ marginTop: '1rem' }}>
          <a href="/games/void-hunters/hunter-tier-list" className="btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}>Hunter Tier List</a>
        </p>
      </WorldHero>

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
