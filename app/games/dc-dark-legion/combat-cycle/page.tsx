import { getHeros, getDataLastUpdated } from '@/src/dcdl/lib/data'
import CombatCycleBosses from '@/src/dcdl/components/CombatCycleBosses'
import JsonLd from '@/app/components/JsonLd'
import { pageMeta, breadcrumbLd, DCDL_CRUMB } from '@/src/lib/seo'
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
  videoUrl?: string
  bestChampions?: string[]
}

function readBosses(): CCBoss[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/src/dcdl/data/combat-cycle.json') as CCBoss[]
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const PATH = '/games/dc-dark-legion/combat-cycle'

export function generateMetadata() {
  const names = readBosses().map((b) => b.name)
  return pageMeta({
    title: 'DC: Dark Legion Combat Cycle Guide: All Bosses & Best Counters',
    description:
      `Every DC: Dark Legion Combat Cycle boss with its day, skills, mechanics and the best champions to counter it` +
      (names.length ? `: ${names.join(', ')}.` : '.'),
    path: PATH,
  })
}

export default function CombatCyclePage() {
  const lastUpdated = getDataLastUpdated('heros.json', 'combat-cycle.json')
  const heroes = getHeros()
  const bosses = readBosses().sort((a, b) => {
    const firstDay = (d: string) => d.split('/')[0].trim()
    return DAY_ORDER.indexOf(firstDay(a.day)) - DAY_ORDER.indexOf(firstDay(b.day))
  })

  // Counters are resolved here, on the server, so the client component only
  // receives the champion fields it actually renders. `bestChampions` is
  // Quantum's ordered pick list (Site Admin → DC: Dark Legion → Combat Cycle).
  const byId = new Map(heroes.map((h) => [h.id, h]))
  const bossesWithCounters = bosses.map((boss) => ({
    ...boss,
    counters: (boss.bestChampions ?? [])
      .map((id) => byId.get(id))
      .filter((h) => h != null)
      .map((h) => ({
        id: h.id,
        name: h.name,
        imageHeadshot: h.imageHeadshot ?? null,
        rarity: h.rarity,
      })),
  }))

  return (
    <main style={{ '--game-accent': '#4f8ef7' } as React.CSSProperties}>
      <JsonLd data={breadcrumbLd([DCDL_CRUMB, ['Combat Cycle', PATH]])} />
      <section className="gh-hero">
        <div className="container">
          <h1 className="gh-hero-title">DC: Dark Legion Combat Cycle Guide</h1>
          <p className="gh-hero-sub">Quantum&apos;s ultimate guide to all 7 Combat Cycle bosses — mechanics, skills, and top counters.</p>
          <div className="gh-hero-divider" />
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', fontFamily: 'monospace' }}>Updated: {lastUpdated}</span>
            <a href="/games/dc-dark-legion/champion-tier-list" style={{ fontSize: '0.78rem', color: 'var(--gold)', opacity: 0.85, textDecoration: 'none' }}>← Champion List</a>
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

