import fs from 'fs'
import path from 'path'
import GfCampaignTool from '@/src/gf/components/GfCampaignTool'
import type { GfHero } from '@/src/gf/components/GfHeroBox'
import '../game.css'

function getHeroes(): GfHero[] {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/gf/data/heroes-api.json'), 'utf8'))
    return (data.heroes as GfHero[]).filter((h: GfHero & { _error?: boolean }) => !h._error)
  } catch { return [] }
}

export default function GodforgeCampaignPage() {
  const heroes = getHeroes()

  return (
    <main style={{ '--game-accent': '#a855f7' } as React.CSSProperties}>
      <section className="gh-hero">
        <div className="container">
          <p className="gh-overline">Campaign Tool</p>
          <h1 className="gh-hero-title">Campaign Star Planner</h1>
          <p className="gh-hero-sub">
            Build your team and instantly see which star requirements you meet across every stage.
            Stars will update according to your selections. Once you have two characters in your team,
            it is assumed you can clear the stage and win in 20 turns or less with the right investment.
          </p>
          <div className="gh-hero-divider" />
          <div style={{
            display: 'inline-block',
            background: 'rgba(168,85,247,0.08)',
            border: '1px solid rgba(168,85,247,0.25)',
            borderRadius: '0.5rem',
            padding: '0.6rem 1rem',
            fontSize: '0.78rem',
            color: '#c4b5fd',
            marginBottom: '1rem',
          }}>
            Built in conjunction with{' '}
            <a href="https://www.youtube.com/@RagewoodGaming" target="_blank" rel="noopener noreferrer" style={{ color: '#e9d5ff', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: '2px' }}>Ragewood</a>
            {' '}using jointly collected data.
          </div>
          <div className="gh-hero-back">
            <a href="/games/godforge" className="btn" style={{ fontSize: '0.78rem', padding: '0.45rem 1rem' }}>
              ← Back to Hub
            </a>
          </div>
        </div>
      </section>

      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <GfCampaignTool heroes={heroes} />
        </div>
      </section>
    </main>
  )
}
