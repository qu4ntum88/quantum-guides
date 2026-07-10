import './page.css'
import { PUBLIC_SECTIONS } from '@/src/lib/siteConfig'

export default function Home() {
  const allGames = [
    {
      id: 'dcdl',
      section: 'dcdl',
      name: 'DC: Dark Legion',
      href: '/games/dc-dark-legion/guides',
      description: 'Idle strategy RPG set in the DC Universe — collect champions, build your base, and battle across iconic Gotham.',
      accent: '#4f8ef7',
      image: '/images/games/dcdlmain.png'
    },
    {
      id: 'godforge',
      section: 'godforge',
      name: 'Godforge',
      href: '/games/godforge',
      description: 'Hero collector RPG built around strategic team composition — gods, myths, and legends across deep progression systems.',
      accent: '#a855f7',
      image: '/images/games/godforgemain.png'
    },
    {
      id: 'void-hunters',
      section: 'voidHunters',
      name: 'Void Hunters',
      href: '/games/void-hunters/guides',
      description: 'Turn-based RPG with deep hunter progression, strategic squad combat, and escalating void threats.',
      accent: '#06b6d4',
      image: '/images/games/voidhuntersmain.jpg'
    }
  ]

  const games = allGames.filter((g) => PUBLIC_SECTIONS[g.section])

  return (
    <main>
      <section className="lp-hero">
        <div className="lp-hero-content">
          <img src="/images/site/Q GOLD FULL ICON.png" alt="" className="lp-hero-icon" />
          <p className="lp-overline">Quantum Game Guides</p>
          <h1 className="lp-title">
            Your Edge.<br />
            <span className="lp-title-accent">Your Meta.</span>
          </h1>
          <p className="lp-tagline">
            Deep-dive guides, tier lists, hero databases, and meta analysis — built by players, for players.
          </p>
          <div className="lp-divider" />
        </div>
      </section>

      <section className="lp-games">
        <div className="container">
          <div className="lp-section-label">
            <span className="lp-section-line" />
            <span className="lp-section-text">What We Cover</span>
            <span className="lp-section-line lp-section-line-right" />
          </div>
          <div className="lp-games-grid">
            {games.map((game) => (
              <a
                key={game.id}
                href={game.href}
                className="lp-game-card"
                style={{ '--game-accent': game.accent }}
              >
                <div className="lp-card-banner">
                  {game.image && (
                    <img src={game.image} alt={game.name} className="lp-card-img" />
                  )}
                  <div className="lp-card-overlay" />
                  <div className="lp-card-cta-wrap">
                    <span className="lp-card-cta">Explore Hub →</span>
                  </div>
                </div>
                <div className="lp-card-body">
                  <div className="lp-card-top-bar" />
                  <h3 className="lp-card-title">{game.name}</h3>
                  <p className="lp-card-desc">{game.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-community">
        <div className="container">
          <div className="lp-community-card">
            <div className="lp-community-text">
              <p className="lp-overline lp-overline--sm">Stay Connected</p>
              <h2 className="lp-community-heading">Join the Community</h2>
              <p className="lp-community-desc">
                Follow for guides, tier updates, game news, and live streams.
              </p>
            </div>
            <div className="lp-social-row">
              <a href="https://www.youtube.com/@Quantumx86" target="_blank" rel="noopener noreferrer" className="lp-social-btn">
                <img src="/images/site/yt_logo_mono_dark.png" alt="YouTube" className="lp-social-img" />
              </a>
              <a href="https://discord.gg/BSPQuvGdSP" target="_blank" rel="noopener noreferrer" className="lp-social-btn">
                <img src="/images/site/Discord-Logo-Blurple.png" alt="Discord" className="lp-social-img" />
              </a>
              <a href="https://x.com/Quantumx86" target="_blank" rel="noopener noreferrer" className="lp-social-btn">
                <img src="/images/site/twitter_logo_white.png" alt="X / Twitter" className="lp-social-img" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
