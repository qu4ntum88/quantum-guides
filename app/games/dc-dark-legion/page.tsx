import { getDataLastUpdated, getSynergies } from '@/src/dcdl/lib/data'
import { getOfficialHeros, getOfficialTiersUpdatedAt, TIERS } from '@/src/dcdl/lib/tier-db'
import HeroGrid from '@/src/dcdl/components/HeroGrid'
import JsonLd from '@/app/components/JsonLd'
import { pageMeta, monthYear, breadcrumbLd, itemListLd, DCDL_CRUMB } from '@/src/lib/seo'
import '../godforge/game.css'

// Official tiers are read from Supabase, so pick up Studio edits within a minute.
export const revalidate = 60

const PATH = '/games/dc-dark-legion'

// The month in the title tracks the last tier change, so searchers can see the
// list is current. `?view=` variants all canonicalise to the bare URL.
export async function generateMetadata() {
  const [heros, savedAt] = await Promise.all([getOfficialHeros(), getOfficialTiersUpdatedAt()])
  const month = monthYear(savedAt ?? getDataLastUpdated('heros.json'))
  const top = heros.filter((h) => h.tier === 'S+').map((h) => h.name.replace(/\s*\(.*\)$/, ''))
  return pageMeta({
    title: `DC: Dark Legion Tier List${month ? ` (${month})` : ''}: All Champions Ranked`,
    description:
      `Every DC: Dark Legion champion ranked S+ to D by Quantum${month ? `, updated ${month}` : ''}.` +
      (top.length ? ` Top tier right now: ${top.slice(0, 4).join(', ')}.` : '') +
      ' Filter by class and faction, then open any champion for skills, stats and recommended legacy pieces.',
    path: PATH,
  })
}

export default async function DCDarkLegionPage() {
  // Same source as the old tier list page: Supabase official tiers once saved
  // from the Studio, heros.json until then.
  const [heros, savedAt] = await Promise.all([getOfficialHeros(), getOfficialTiersUpdatedAt()])
  const lastUpdated = savedAt
    ? new Date(savedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : getDataLastUpdated('heros.json')
  const synergyDescImages = Object.fromEntries(
    getSynergies()
      .filter((s) => s.descriptionImage)
      .map((s) => [s.id, s.descriptionImage!])
  )

  const ranked = [...heros].sort((a, b) => rankOf(a.tier) - rankOf(b.tier))

  return (
    <main style={{ '--game-accent': '#4f8ef7' } as React.CSSProperties}>
      <JsonLd
        data={[
          breadcrumbLd([DCDL_CRUMB, ['Champion Tier List', PATH]]),
          itemListLd('DC: Dark Legion Champion Tier List', ranked.map((h) => ({ name: h.name, path: `/games/dc-dark-legion/heros/${h.id}` }))),
        ]}
      />
      <section className="gh-hero">
        <div className="container">
          <h1 className="gh-hero-title" style={{ marginBottom: '0.85rem' }}>DC: Dark Legion Champion Tier List &amp; Database</h1>
          <p className="gh-hero-sub" style={{ maxWidth: '72ch' }}>
            Every playable champion, ranked by Quantum. Filter to highlight, switch to Grid to sort, and click any
            champion for their full breakdown.
          </p>
          <div className="gh-hero-divider" />
          {lastUpdated && (
            <span style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', fontFamily: 'monospace' }}>
              Updated: {lastUpdated}
            </span>
          )}
        </div>
      </section>

      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <div className="flex flex-col items-center justify-start gap-12 py-4 text-white md:px-4">
            <HeroGrid
              heros={heros}
              synergyDescImages={synergyDescImages}
              dateLine={lastUpdated ? `Updated ${lastUpdated}` : undefined}
            />
          </div>
        </div>
      </section>

    </main>
  )
}

// Unranked champions sort after D.
function rankOf(tier?: string) {
  const i = (TIERS as readonly string[]).indexOf(tier ?? '')
  return i === -1 ? TIERS.length : i
}
