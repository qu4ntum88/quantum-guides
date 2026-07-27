import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import InfographicsGrid from '@/src/dcdl/components/InfographicsGrid'
import type { Infographic, ShardsData } from '@/src/dcdl/components/InfographicsGrid'
import { getInfographics as getInfographicsData } from '@/src/dcdl/lib/content-db'
import '../../godforge/game.css'

// Refresh at most once a minute so editor changes appear without a redeploy.
export const revalidate = 60

function getShardsData(): ShardsData {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/dcdl/data/shards-per-star.json'), 'utf8'))
}

export default async function InfographicsPage() {
  const infographics: Infographic[] = (await getInfographicsData()).map((i) => ({
    id: i.id, title: i.title, description: i.description,
    image: i.image, builtin: i.builtin ?? undefined, credit: i.credit,
  }))
  const shardsData = getShardsData()

  return (
    <main style={{ '--game-accent': '#4f8ef7' } as React.CSSProperties}>
      <section className="gh-hero">
        <div className="container">
          <p className="gh-overline">DC: Dark Legion</p>
          <h1 className="gh-hero-title">Helpful Infographics</h1>
          <p className="gh-hero-sub">
            Quantum has curated some of his most helpful infographics and the infographics of his friends and fellow creators to help you get ahead of the competition!
          </p>
          <div className="gh-hero-divider" />
          <div style={{ marginTop: '1rem' }}>
            <Link href="/games/dc-dark-legion/guides" style={{ fontSize: '0.78rem', color: 'var(--gold)', opacity: 0.85, textDecoration: 'none' }}>
              ← Hub
            </Link>
          </div>
        </div>
      </section>

      <section style={{ padding: '2rem 0 4rem' }}>
        <div className="container">
          <InfographicsGrid infographics={infographics} shardsData={shardsData} />
        </div>
      </section>

      <section style={{ padding: '2.5rem 0 3rem' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
            <img src="/images/site/Q%20GOLD%20FULL%20ICON.png" alt="Quantum Game Guides" style={{ height: '6rem', objectFit: 'contain' }} />
            <img src="/dcdl/logos/Game_logo_-_blue_white.png" alt="DC: Dark Legion" style={{ height: '6rem', objectFit: 'contain' }} />
          </div>
        </div>
      </section>
    </main>
  )
}
