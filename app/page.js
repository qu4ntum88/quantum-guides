'use client'

import './page.css'

export default function Home() {
  const games = [
    {
      id: 'godforge',
      name: 'Godforge',
      slug: 'godforge',
      description: 'Hero collector RPG focused on strategic team composition',
      color: '#372061',
      image: '/images/games/godforgemain.png'
    },
    {
      id: 'dcdl',
      name: 'DC: Dark Legion',
      slug: 'dc-dark-legion',
      description: 'Strategy game set in the DC Universe with idle and base-building elements',
      color: '#1a1a1a',
      image: '/images/games/dcdlmain.png'
    },
    {
      id: 'void-hunters',
      name: 'Void Hunters',
      slug: 'void-hunters',
      description: 'Turn-based RPG with deep progression systems',
      color: '#2a2a2a',
      image: '/images/games/voidhuntersmain.jpg'
    }
  ]

  return (
    <main>
      <section className="hero">
        <div className="container">
          <h1><img src="/images/site/Q GOLD FULL ICON.png" alt="" className="brand-icon" />Quantum Game Guides</h1>
          <p className="tagline">Deep-dive guides, tier lists, and meta analysis for mobile gacha and strategy games</p>
          <p className="intro">
            On this site, you will find comprehensive written guides, links to video walkthroughs, and community discussion for DC: Dark Legion, Godforge, Void Hunters, and more!
          </p>
        </div>
      </section>

      <section className="games-section">
        <div className="container">
          <h2>Game Guides</h2>
          <div className="games-grid">
            {games.map((game) => (
              <a key={game.id} href={`/games/${game.slug}`} className="game-card">
                <div className="game-banner" style={{ backgroundColor: game.color }}>
                  {game.image && <img src={game.image} alt={game.name} />}
                  <h3>{game.name}</h3>
                </div>
                <div className="game-info">
                  <p>{game.description}</p>
                  <span className="cta">View Guides →</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="changelog-section">
        <div className="container">
          <h2>Changelog</h2>
          <div className="changelog">
            <div className="changelog-item">
              <div className="date">April 17, 2026</div>
              <div className="change">
                <h4>Website Launch</h4>
                <p>Quantum Game Guides website is now live with initial guides for DC: Dark Legion and Godforge.</p>
              </div>
            </div>
            <div className="changelog-item">
              <div className="date">May 20, 2026</div>
              <div className="change">
                <h4>Godforge Beta Coverage Begins</h4>
                <p>Comprehensive guides and coverage for Godforge as beta testing begins.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="email-section">
        <div className="container email-container">
          <h2>Stay Updated</h2>
          <p>Get notified when new guides are published</p>
          <form className="email-form" onSubmit={(e) => {
            e.preventDefault()
            alert('Email signup form will be connected to Mailchimp tomorrow!')
          }}>
            <input type="email" placeholder="your@email.com" required />
            <button type="submit">Sign Up</button>
          </form>
        </div>
      </section>
    </main>
  )
}
