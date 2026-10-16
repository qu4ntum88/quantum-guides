import Link from 'next/link'
import '../../godforge/game.css'
import '../void-hunters.css'
import JsonLd from '../../../components/JsonLd'
import WorldHero from '@/src/qgg/components/WorldHero'
import QTile from '@/src/qgg/components/QTile'
import { breadcrumbLd, pageMeta, VH_CRUMB } from '@/src/lib/seo'
import { getVhTieredRoster, vhEntities } from '@/src/vh/lib/hunters'

export const revalidate = 3600

export const metadata = pageMeta({
  title: 'Void Hunters Guides: Tier List, Hunters & Status Effects',
  description:
    'The Void Hunters hub: a tier list ranked by class, a page for every hunter with skills, upgrades and lore, the status effect reference, and video guides.',
  path: '/games/void-hunters/guides',
})

const RESOURCES = [
  { href: '/games/void-hunters/hunter-tier-list', label: 'Hunter Tier List', text: 'Every hunter ranked S to F within their class. Switch to Grid to filter the database by rarity, homeland and species, and open any hunter for their kit, upgrades and lore.' },
  { href: '/games/void-hunters/status-effects', label: 'Status Effects', text: 'Every buff, debuff and disable in the game, in one searchable grid.' },
]

export default async function VoidHuntersGuidesPage() {
  const roster = await getVhTieredRoster()
  const top = vhEntities(roster.filter((h) => h.tier === 'S').slice(0, 12))

  return (
    <main>
      <JsonLd data={breadcrumbLd([VH_CRUMB])} />
      <WorldHero
        world="voidhunters"
        overline="Game Hub"
        title="Void Hunters Guides"
        sub="Dark fantasy turn-based RPG: build your hunter roster, master the fight, and hold the line against the void."
      />

      <div className="container w-section">
        <div className="content-grid">
          <div className="main-content">
            <section className="w-card">
              <h2>On Quantum</h2>
              <div className="vh-resources">
                {RESOURCES.map((r) => (
                  <div key={r.href} className="vh-resource">
                    <Link href={r.href} className="btn">{r.label}</Link>
                    <p>{r.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {top.length > 0 && (
              <section className="w-card">
                <h2>S-tier hunters</h2>
                <p className="w-muted">The top of Quantum&apos;s tier list right now.</p>
                <div className="qtb-grid vh-tight">
                  {top.map((e) => <QTile key={e.id} e={e} tier="S" size="sm" />)}
                </div>
              </section>
            )}

            <section className="w-card">
              <h2>Video guides</h2>
              <div className="video-container">
                <iframe
                  width="100%"
                  height="315"
                  src="https://www.youtube.com/embed/videoseries?list=PLj9TDaSk5Dc-sdI1bxzAO4jbm1Z5LBKhF"
                  title="Void Hunters Video Guides"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            </section>
          </div>

          <aside className="sidebar">
            <div className="w-card">
              <h3>Community</h3>
              <p className="w-muted">Join the community to discuss strategies, share tips and stay updated on the latest content.</p>
              <a href="https://discord.gg/2McMuE94bC" target="_blank" rel="noopener noreferrer" className="btn">Join Discord</a>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
