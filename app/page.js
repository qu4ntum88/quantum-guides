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
      <div className="page-hero-wrapper">
        <section className="hero">
          <div className="container">
            <h1><img src="/images/site/Q GOLD FULL ICON.png" alt="" className="brand-icon" />Quantum Game Guides</h1>
            <p className="tagline">Deep-dive guides, tier lists, and meta analysis for mobile gacha and strategy games</p>
          </div>
        </section>

        <section className="games-section">
          <div className="container">
            <h2>GAMES WE COVER</h2>
            <div className="games-grid">
              {games.map((game) => (
                <a key={game.id} href={`/games/${game.slug}`} className="game-card">
                  <div className="game-banner" style={{ backgroundColor: game.color }}>
                    {game.image && <img src={game.image} alt={game.name} />}
                    <h3>{game.name}</h3>
                  </div>
                  <div className="game-info">
                    <p>{game.description}</p>
                    <span className="cta">Game Hub →</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>

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
