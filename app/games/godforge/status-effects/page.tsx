import fs from 'fs'
import path from 'path'
import GfStatusEffectGrid from '@/src/gf/components/GfStatusEffectGrid'
import type { GfStatusEffect } from '@/src/gf/components/GfStatusEffectBox'

import { pageMeta } from '@/src/lib/seo'
import WorldHero from '@/src/qgg/components/WorldHero'

export const metadata = pageMeta({
  title: 'Godforge Status Effects: Every Buff, Debuff & Disable',
  description: 'Every Godforge status effect in one searchable grid: all buffs, debuffs and disables with what each one does.',
  path: '/games/godforge/status-effects',
})

function getStatusEffects(): GfStatusEffect[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/gf/data/status-effects.json'), 'utf8'))
  } catch { return [] }
}

export default function GodforgeStatusEffectsPage() {
  const effects = getStatusEffects()

  return (
    <main>
      <WorldHero
        world="godforge"
        overline="Godforge"
        title="Godforge Status Effects"
        sub="Every buff, debuff and disable in the game. Hover an icon for its description."
      />

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
