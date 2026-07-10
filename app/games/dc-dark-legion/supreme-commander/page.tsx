import { getDataLastUpdated } from '@/src/dcdl/lib/data'
import '../../godforge/game.css'
import './supreme-commander.css'
import SupremeCommanderView, { type SupremeCommanderData } from './View'

export const metadata = {
  title: 'Supreme Commander Guide — DC: Dark Legion',
  description:
    'Day-by-day strategy for the weekly Supreme Commander event in DC: Dark Legion — point values, reward tracks, and the most efficient path for individual players.',
}

function readData(): SupremeCommanderData {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/src/dcdl/data/supreme-commander.json') as SupremeCommanderData
}

export default function SupremeCommanderPage() {
  const lastUpdated = getDataLastUpdated('supreme-commander.json')
  const data = readData()

  return (
    <main>
      <section className="gh-hero" style={{ '--game-accent': '#CCA453' } as React.CSSProperties}>
        <div className="container">
          <p className="gh-overline">DC: Dark Legion — Weekly Event</p>
          <h1 className="gh-hero-title">Supreme Commander Guide</h1>
          <p className="gh-hero-sub">
            The most efficient day-by-day path for individual players — where to spend, what scores, and the rewards on the line.
          </p>
          <div className="gh-hero-divider" />
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', fontFamily: 'monospace' }}>Updated: {lastUpdated}</span>
            <a href="/games/dc-dark-legion" style={{ fontSize: '0.78rem', color: 'var(--gold)', opacity: 0.85, textDecoration: 'none' }}>← Champion List</a>
          </div>
        </div>
      </section>

      <SupremeCommanderView data={data} />

      {/* Logos Footer */}
      <section style={{ padding: '2.5rem 0 3rem', background: '#0a0a10' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
            <img
              src="/images/site/Q%20GOLD%20FULL%20ICON.png"
              alt="Quantum Game Guides"
              style={{ height: '6rem', objectFit: 'contain' }}
            />
            <img
              src="/dcdl/logos/Game_logo_-_blue_white.png"
              alt="DC: Dark Legion"
              style={{ height: '6rem', objectFit: 'contain' }}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
