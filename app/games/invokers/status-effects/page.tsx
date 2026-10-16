import JsonLd from '@/app/components/JsonLd'
import { breadcrumbLd, INV_CRUMB, pageMeta } from '@/src/lib/seo'
import { getEffects, getRoster } from '@/src/inv/lib/data'
import { getIcons, toTile } from '@/src/inv/lib/board'
import WorldHero from '@/src/qgg/components/WorldHero'
import EffectGlossary from '@/src/inv/components/EffectGlossary'

const PATH = '/games/invokers/status-effects'

export const metadata = pageMeta({
  title: 'Invokers: Titan Legacy Status Effects: Every Buff & Debuff',
  description:
    'Every buff and debuff in Invokers: Titan Legacy with what it does, and the Invokers and Titans whose skills apply it. Search by effect or by name.',
  path: PATH,
})

export default function InvokersStatusEffectsPage() {
  const effects = getEffects()
  const roster = getRoster()
  const icons = getIcons()
  const units = Object.fromEntries(
    roster.map((r) => [`${r.kind}:${r.slug}`, toTile(r, icons)]),
  )
  const buffs = effects.filter((e) => e.group === 'Buffs').length
  return (
    <main>
      <JsonLd data={breadcrumbLd([INV_CRUMB, ['Status Effects', PATH]])} />
      <WorldHero
        world="invokers"
        overline="Invokers: Titan Legacy"
        title="Status Effects"
        sub={`All ${effects.length} buffs and debuffs that appear in Invoker and Titan skills (${buffs} buffs, ${effects.length - buffs} debuffs). Pick an effect to see everyone who can apply it.`}
      />
      <section className="container w-section">
        <EffectGlossary effects={effects} units={units} />
      </section>
    </main>
  )
}
