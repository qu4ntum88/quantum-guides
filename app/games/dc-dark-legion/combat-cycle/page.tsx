import { getHeros, getDataLastUpdated } from '@/src/dcdl/lib/data'
import CombatCycleBosses from '@/src/dcdl/components/CombatCycleBosses'
import '../../godforge/game.css'
import './combat-cycle.css'

type CCStatusEffect = { name: string; effect: string }
type CCSkill = { name: string; description: string; type?: string; status_effects?: CCStatusEffect[] }
type CCCurrency = { name: string; image: string }

type CCBoss = {
  id: string
  name: string
  ccTag: string
  day: string
  currencies: CCCurrency[]
  image: string
  portrait: string
  mechanics: string
  skills: CCSkill[]
}

function readBosses(): CCBoss[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/src/dcdl/data/combat-cycle.json') as CCBoss[]
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function CombatCyclePage() {
  const lastUpdated = getDataLastUpdated('heros.json', 'combat-cycle.json')
  const heroes = getHeros()
  const bosses = readBosses().sort((a, b) => {
    const firstDay = (d: string) => d.split('/')[0].trim()
    return DAY_ORDER.indexOf(firstDay(a.day)) - DAY_ORDER.indexOf(firstDay(b.day))
  })

  // Counters are matched here, on the server, so the client component only
  // receives the champion fields it actually renders.
  const bossesWithCounters = bosses.map((boss) => ({
    ...boss,
    counters: heroes
      .filter((h) => h.gameModes?.includes(boss.ccTag))
      .map((h) => ({
        id: h.id,
        name: h.name,
        imageHeadshot: h.imageHeadshot ?? null,
        rarity: h.rarity,
      })),
  }))

  return (
    <main style={{ '--game-accent': '#4f8ef7' } as React.CSSProperties}>
      <section className="gh-hero">
        <div className="container">
          <h1 className="gh-hero-title">DC: Dark Legion Combat Cycle Guide</h1>
          <p className="gh-hero-sub">Quantum&apos;s ultimate guide to all 7 Combat Cycle bosses — mechanics, skills, and top counters.</p>
          <div className="gh-hero-divider" />
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', fontFamily: 'monospace' }}>Updated: {lastUpdated}</span>
            <a href="/games/dc-dark-legion" style={{ fontSize: '0.78rem', color: 'var(--gold)', opacity: 0.85, textDecoration: 'none' }}>← Champion List</a>
          </div>
        </div>
      </section>

      <section style={{ padding: '2rem 0 4rem' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <CombatCycleBosses bosses={bossesWithCounters} />
        </div>
      </section>

      {/* Logos Footer */}
      <section style={{ padding: '2.5rem 0 3rem' }}>
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

