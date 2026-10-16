import Link from 'next/link'
import JsonLd from '@/app/components/JsonLd'
import { breadcrumbLd, GF_CRUMB, itemListLd, pageMeta } from '@/src/lib/seo'
import TierBrowser from '@/src/qgg/components/TierBrowser'
import WorldHero from '@/src/qgg/components/WorldHero'
import { QUANTUM_TIERS, rowsFromTiers } from '@/src/qgg/tiers'
import { ARCHETYPES, gfEntities, gfFilters, gfHeroPath, gfIcon, gfIcons, getGfTieredRoster } from '@/src/gf/lib/heroes'

// Tiers can be saved from the Studio editor (Supabase), so re-read them every minute.
export const revalidate = 60

const PATH = '/games/godforge/hero-tier-list'

export const metadata = pageMeta({
  title: 'Godforge Tier List: Every Hero Ranked by Archetype',
  description:
    "Quantum's Godforge tier list and full hero database: every hero ranked S to F within their archetype, filterable by rarity, affinity, allegiance and realm.",
  path: PATH,
})

export default async function GodforgeHeroTierListPage() {
  const heroes = await getGfTieredRoster()
  const entities = gfEntities(heroes)
  const rows = rowsFromTiers(
    heroes.map((h) => ({ id: h.id, group: h.archetype, tier: h.tier })),
    QUANTUM_TIERS,
    ARCHETYPES,
  )
  const columns = ARCHETYPES.map((a) => ({ key: a, label: a, icon: gfIcon.archetype(a) }))
  const ranked = QUANTUM_TIERS.flatMap((t) => heroes.filter((h) => h.tier === t))

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbLd([GF_CRUMB, ['Hero Tier List', PATH]]),
          itemListLd('Godforge Tier List', ranked.slice(0, 50).map((h) => ({ name: h.name, path: gfHeroPath(h.id) }))),
        ]}
      />
      <WorldHero
        world="godforge"
        overline="Godforge"
        title="Godforge Tier List"
        sub={`All ${heroes.length} heroes, ranked S to F within each archetype. Switch to Grid to browse the whole database, and open any hero for their kit, stats and lore.`}
      />
      <section className="container w-section w-wide">
        <TierBrowser
          entities={entities}
          rows={rows}
          tierOrder={QUANTUM_TIERS}
          columns={columns}
          filters={gfFilters(heroes)}
          icons={gfIcons(heroes)}
          storageKey="qgg:gf-heroes-view"
          boardTitle="Quantum's Godforge Tier List"
          searchPlaceholder="Search heroes…"
        />
      </section>
      <section className="container w-section w-prose">
        <h2>How this tier list works</h2>
        <p>
          Heroes are ranked within their archetype (Brawler, Defender, Disruptor, Invoker and Slayer), because a hero
          competes for a team slot with others who do the same job. This is an early list: every hero starts at the tier
          their rarity suggests, and the rankings are being reworked hero by hero. Filters dim heroes that don&apos;t match
          on the board, and remove them in the Grid view.
        </p>
        <p>
          Looking for a specific fight? See the <Link href="/games/godforge/dungeons">dungeon guides</Link>, or the{' '}
          <Link href="/games/godforge/status-effects">status effect reference</Link>.
        </p>
      </section>
    </main>
  )
}
