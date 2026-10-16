import Link from 'next/link'
import JsonLd from '@/app/components/JsonLd'
import { breadcrumbLd, INV_CRUMB, pageMeta } from '@/src/lib/seo'
import QTile from '@/src/qgg/components/QTile'
import WorldHero from '@/src/qgg/components/WorldHero'
import { getIcons, toTile } from '@/src/inv/lib/board'
import { getEffects, getInvokers, getTierLists, getTitans } from '@/src/inv/lib/data'
import { tierListPath } from '@/src/inv/lib/constants'
import { WorldGameNews, WorldGuideCards } from '@/src/qgg/components/WorldGuidePage'

const PATH = '/games/invokers/guides'

// Written guides come from the CMS (game = 'invokers'); refresh like the guide pages.
export const revalidate = 60

export const metadata = pageMeta({
  title: 'Invokers: Titan Legacy Guides & Tools',
  description:
    'Invokers: Titan Legacy tier lists for every boss, a full Invoker and Titan database with skills at every level, stats and tolerances, and a status effect glossary.',
  path: PATH,
})

export default async function InvokersHubPage() {
  const invokers = getInvokers()
  const titans = getTitans()
  const icons = getIcons()
  const bosses = getTierLists('Invoker')
  const effects = getEffects()
  const top = [...invokers].sort((a, b) => (b.overall?.score ?? 0) - (a.overall?.score ?? 0)).slice(0, 12)
  const topTitans = [...titans].sort((a, b) => (b.overall?.score ?? 0) - (a.overall?.score ?? 0)).slice(0, 6)
  const factions = [...new Set(invokers.map((u) => u.faction))].sort().map((f) => ({
    name: f,
    invokers: invokers.filter((u) => u.faction === f).length,
    titans: titans.filter((u) => u.faction === f).length,
  }))

  const resources = [
    { href: tierListPath('Invoker'), label: 'Invoker Tier List', text: `All ${invokers.length} Invokers ranked by role, overall and for each of the ${bosses.length} bosses. Switch to Grid to filter the full database by element, class, faction, rarity and soul sign.` },
    { href: tierListPath('Titan'), label: 'Titan Tier List', text: `All ${titans.length} Titans ranked, with every Titan's bound bonuses, skills and Invokation on its own page.` },
    { href: '/games/invokers/status-effects', label: 'Status Effects', text: `All ${effects.length} buffs and debuffs from Invoker and Titan skills, and who applies each one.` },
  ]

  return (
    <main>
      <JsonLd data={breadcrumbLd([INV_CRUMB])} />
      <WorldHero
        world="invokers"
        overline="Game Hub"
        title="Invokers: Titan Legacy Guides"
        art="/invokers/units/titans/litria/full.webp"
        sub={`Tier lists for every boss, plus a page for each of the ${invokers.length} Invokers and ${titans.length} Titans with their skills at every level, stats, tolerances and lore.`}
      />

      <div className="container w-section">
        <section className="w-card">
          <h2>Resources</h2>
          <div className="inv-resources">
            {resources.map((r) => (
              <div key={r.href} className="inv-resource">
                <Link href={r.href} className="btn">{r.label} →</Link>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
        </section>

        <WorldGameNews game="invokers" />
        <WorldGuideCards game="invokers" />

        <section className="w-card">
          <h2>Tier lists by boss</h2>
          <p className="w-muted">Each boss has its own ranking. Pick one to see who to bring.</p>
          <div className="inv-bosses">
            {bosses.map((b) => (
              <div key={b.id} className="inv-boss">
                <strong>{b.boss}</strong>
                <span>
                  <Link href={tierListPath('Invoker', b.id)}>Invokers</Link>
                  {' · '}
                  <Link href={tierListPath('Titan', b.id)}>Titans</Link>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="w-card">
          <h2>Top Invokers right now</h2>
          <p className="w-muted">Highest overall tier across every boss list.</p>
          <div className="qtb-grid inv-tight">
            {top.map((u) => <QTile key={u.slug} e={toTile(u, icons)} tier={u.overall?.tier} size="sm" />)}
          </div>
          <h3 className="inv-similar-title">Top Titans</h3>
          <div className="qtb-grid inv-tight">
            {topTitans.map((u) => <QTile key={u.slug} e={toTile(u, icons)} tier={u.overall?.tier} size="sm" />)}
          </div>
        </section>

        <section className="w-card">
          <h2>Factions</h2>
          <div className="inv-factions">
            {factions.map((f) => (
              <Link key={f.name} href={`${tierListPath('Invoker')}?view=grid&faction=${encodeURIComponent(f.name)}`} className="inv-faction">
                {icons[f.name] && <img src={icons[f.name]!} alt="" />}
                <span>
                  <strong>{f.name}</strong>
                  <small>{f.invokers} Invokers{f.titans ? ` · ${f.titans} Titans` : ''}</small>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
