import Link from 'next/link'
import JsonLd from '@/app/components/JsonLd'
import { breadcrumbLd, itemListLd, pageMeta, VH_CRUMB } from '@/src/lib/seo'
import TierBrowser from '@/src/qgg/components/TierBrowser'
import WorldHero from '@/src/qgg/components/WorldHero'
import { QUANTUM_TIERS, rowsFromTiers } from '@/src/qgg/tiers'
import { getVhTieredRoster, VH_CLASSES, vhEntities, vhFilters, vhHunterPath } from '@/src/vh/lib/hunters'

// Tiers can be saved from the Studio editor (Supabase), so re-read them every minute.
export const revalidate = 60

const PATH = '/games/void-hunters/hunter-tier-list'

export const metadata = pageMeta({
  title: 'Void Hunters Tier List: Every Hunter Ranked by Class',
  description:
    "Quantum's Void Hunters tier list and hunter database: every hunter ranked S to F within their class, filterable by rarity, homeland and species, with a page for each hunter's skills and lore.",
  path: PATH,
})

export default async function VoidHuntersTierListPage() {
  const hunters = await getVhTieredRoster()
  const rows = rowsFromTiers(
    hunters.map((h) => ({ id: h.id, group: h.class?.[0] ?? null, tier: h.tier })),
    QUANTUM_TIERS,
    VH_CLASSES,
  )
  const ranked = QUANTUM_TIERS.flatMap((t) => hunters.filter((h) => h.tier === t))

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbLd([VH_CRUMB, ['Hunter Tier List', PATH]]),
          itemListLd('Void Hunters Tier List', ranked.map((h) => ({ name: h.name, path: vhHunterPath(h.id) }))),
        ]}
      />
      <WorldHero
        world="voidhunters"
        overline="Void Hunters"
        title="Void Hunters Tier List"
        sub={`All ${hunters.length} hunters, ranked S to F within each class. Switch to Grid to browse the database, and open any hunter for their skills, upgrades and lore.`}
      />
      <section className="container w-section w-wide">
        <TierBrowser
          entities={vhEntities(hunters)}
          rows={rows}
          tierOrder={QUANTUM_TIERS}
          columns={VH_CLASSES.map((c) => ({ key: c, label: c }))}
          filters={vhFilters(hunters)}
          icons={{}}
          storageKey="qgg:vh-hunters-view"
          boardTitle="Quantum's Void Hunters Tier List"
          searchPlaceholder="Search hunters or traits…"
        />
      </section>
      <section className="container w-section w-prose">
        <h2>How this tier list works</h2>
        <p>
          Hunters are ranked within their class (Attacker, Balanced, Support and Tank), because each class fills a
          different job in a squad. This is an early list: every hunter starts at the tier their rarity suggests, and the
          rankings are being reworked as the game takes shape. Filters dim hunters that don&apos;t match on the board, and
          remove them in the Grid view.
        </p>
        <p>
          New to the game? Start at the <Link href="/games/void-hunters/guides">Void Hunters hub</Link>, or look up any
          effect in the <Link href="/games/void-hunters/status-effects">status effect reference</Link>.
        </p>
      </section>
    </main>
  )
}
