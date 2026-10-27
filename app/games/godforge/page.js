import Link from 'next/link'
import './game.css'
import './godforge.css'
import JsonLd from '../../components/JsonLd'
import QTile from '@/src/qgg/components/QTile'
import WorldHero from '@/src/qgg/components/WorldHero'
import { breadcrumbLd, GF_CRUMB, pageMeta } from '@/src/lib/seo'
import { gfEntities, getGfTieredRoster } from '@/src/gf/lib/heroes'
import { WorldGameNews, WorldGuideCards } from '@/src/qgg/components/WorldGuidePage'
import HubLogos from '@/src/qgg/components/HubLogos'

export const metadata = pageMeta({
  title: 'Godforge Guides: Tier List, Heroes & Dungeons',
  description:
    'The Godforge hub: a tier list ranked by archetype, the full hero database with skills, stats and lore, every dungeon and boss, and a status effect reference.',
  path: '/games/godforge',
})

// Guides, codes and patch notes come from the CMS; refresh like the guide pages.
export const revalidate = 60

async function getLatestFatelessVideo() {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=UCSpCHYBp2ptiAHVX0KYYlSQ&maxResults=1&order=date&type=video&key=${process.env.YOUTUBE_API_KEY}`
    )
    const data = await res.json()
    return data.items?.[0]?.id?.videoId ?? null
  } catch {
    return null
  }
}

const ON_SITE = [
  { href: '/games/godforge/hero-tier-list', label: 'Hero Tier List', text: 'Every hero ranked S to F within their archetype, or switch to Grid to filter the full database by rarity, affinity, allegiance and realm.' },
  { href: '/games/godforge/dungeons', label: 'Dungeons', text: 'Every ascension and equipment dungeon with its boss, stages, rewards and the heroes we recommend for it.' },
  { href: '/games/godforge/status-effects', label: 'Status Effects', text: 'Every buff, debuff and disable in one searchable grid.' },
]

const ELSEWHERE = [
  { href: 'https://www.ravenpyros.com/', label: 'RavenPyros', text: 'A community-driven Godforge hub with tier lists, dungeon data, weapons and plenty of helpful content.' },
  { href: 'https://godforge.gg/heroes/aaru', label: 'Official DB', text: 'The official Godforge hero database, with stats and information from the developers.' },
  { href: 'https://www.hellhades.com', label: 'HellHades', text: 'Creator and game developer resources for Godforge.' },
]

export default async function GodforgePage() {
  const [latestDevVideoId, roster] = await Promise.all([getLatestFatelessVideo(), getGfTieredRoster()])
  const topS = gfEntities(roster.filter((h) => h.tier === 'S').slice(0, 12))

  return (
    <main>
      <JsonLd data={breadcrumbLd([GF_CRUMB])} />
      <WorldHero
        world="godforge"
        overline="Game Hub"
        title="Godforge Guides"
        sub="Hero collector RPG of gods, myths and legends. Tier lists, every hero's kit and lore, and a guide to each dungeon."
      />

      <div className="container w-section">
        <div className="content-grid">
          <div className="main-content">
            <section className="w-card">
              <h2>On Quantum</h2>
              <div className="gf-resources">
                {ON_SITE.map((r) => (
                  <div key={r.href} className="gf-resource">
                    <Link href={r.href} className="btn">{r.label}</Link>
                    <p>{r.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <WorldGameNews game="godforge" />
            <WorldGuideCards game="godforge" />

            {topS.length > 0 && (
              <section className="w-card">
                <h2>S-tier heroes</h2>
                <p className="w-muted">The top of Quantum&apos;s tier list right now.</p>
                <div className="qtb-grid gf-tight">
                  {topS.map((e) => <QTile key={e.id} e={e} tier="S" size="sm" />)}
                </div>
              </section>
            )}

            <section className="w-card">
              <h2>Other Godforge resources</h2>
              <div className="gf-resources">
                {ELSEWHERE.map((r) => (
                  <div key={r.href} className="gf-resource">
                    <a href={r.href} target="_blank" rel="noopener noreferrer" className="btn">{r.label} ↗</a>
                    <p>{r.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="w-card">
              <h2>Video guides</h2>
              <div className="video-container">
                <iframe
                  width="100%"
                  height="315"
                  src="https://www.youtube.com/embed/videoseries?list=PLj9TDaSk5Dc8XzeAqwdxx7T_uYb9D_YPH"
                  title="Godforge Video Guides"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            </section>

            <section className="w-card">
              <h2>Latest developer news</h2>
              {latestDevVideoId ? (
                <div className="video-container">
                  <iframe
                    width="100%"
                    height="315"
                    src={`https://www.youtube.com/embed/${latestDevVideoId}`}
                    title="Latest Fateless Games video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <p className="w-muted">
                  Visit <a href="https://www.youtube.com/@FatelessGames" target="_blank" rel="noopener noreferrer">Fateless Games on YouTube</a> for the latest news.
                </p>
              )}
            </section>
          </div>

          <aside className="sidebar">
            <div className="w-card">
              <h3>About Godforge</h3>
              <p className="w-muted">Godforge is a hero collector RPG from Fateless Games focused on strategic team composition and deep progression systems. It&apos;s a world of gods, myths and legends.</p>
            </div>
            <div className="w-card">
              <h3>Community</h3>
              <p className="w-muted">Join the Godforge community to discuss strategies, share tips and stay updated on the latest content.</p>
              <a href="https://discord.gg/RdvnWRBZ8j" target="_blank" rel="noopener noreferrer" className="btn">Join Discord</a>
            </div>
          </aside>
        </div>
      </div>
      <HubLogos game="godforge" />
    </main>
  )
}
