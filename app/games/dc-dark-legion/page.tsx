import { getDataLastUpdated, getSynergies } from '@/src/dcdl/lib/data'
import { getOfficialHeros, getOfficialTiersUpdatedAt } from '@/src/dcdl/lib/tier-db'
import HeroGrid from '@/src/dcdl/components/HeroGrid'
import '../godforge/game.css'

// Official tiers are read from Supabase, so pick up Studio edits within a minute.
export const revalidate = 60

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

  return (
    <main style={{ '--game-accent': '#4f8ef7' } as React.CSSProperties}>
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
