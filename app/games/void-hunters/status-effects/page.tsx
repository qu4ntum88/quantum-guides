import { pageMeta } from '@/src/lib/seo'
import fs from 'fs'
import path from 'path'
import StatusEffectGrid from '@/src/vh/components/StatusEffectGrid'
import type { EffectOwner, StatusEffect } from '@/src/vh/components/StatusEffectBox'
import WorldHero from '@/src/qgg/components/WorldHero'
import { getStatusEffects } from '@/src/vh/lib/status-effects'
import '../void-hunters.css'

export const metadata = pageMeta({
  title: 'Void Hunters Status Effects: Every Buff & Debuff',
  description:
    'Full reference for every Void Hunters status effect: buffs, debuffs and disables with what each one does and how it stacks.',
  path: '/games/void-hunters/status-effects',
})

/** Name, portrait and page of every hunter shown on an effect card. */
function getOwners(effects: StatusEffect[]): Record<string, EffectOwner> {
  const wanted = new Set(effects.flatMap((e) => e.hunters ?? []))
  try {
    const hunters: { id: string; name: string; portrait: string | null }[] =
      JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/vh/data/hunters.json'), 'utf8'))
    return Object.fromEntries(hunters.filter((h) => wanted.has(h.id)).map((h) => [
      h.id, { name: h.name, portrait: h.portrait, href: `/games/void-hunters/hunters/${h.id}` },
    ]))
  } catch { return {} }
}

// Effects Quantum takes offline in Site Admin drop out within a minute (the admin route also
// refreshes this page right away).
export const revalidate = 60

export default async function StatusEffectsPage() {
  const effects = await getStatusEffects()
  const owners = getOwners(effects)

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
          <StatusEffectGrid effects={effects} owners={owners} />
        </div>
      </section>
    </main>
  )
}
