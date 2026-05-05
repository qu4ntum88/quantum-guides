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

      <section className="community-section">
        <div className="container">
          <h2>Join the Community</h2>
          <p className="community-desc">Follow along for guides, tier updates, and game news</p>
          <div className="community-links">
            <a href="https://www.youtube.com/@Quantumx86" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <img src="/images/site/yt_logo_mono_dark.png" alt="YouTube" className="community-logo" />
            </a>
            <a href="https://discord.gg/BSPQuvGdSP" target="_blank" rel="noopener noreferrer" aria-label="Discord">
              <img src="/images/site/Discord-Logo-Blurple.png" alt="Discord" className="community-logo" />
            </a>
            <a href="https://x.com/Quantumx86" target="_blank" rel="noopener noreferrer" aria-label="X">
              <img src="/images/site/twitter_logo_white.png" alt="X" className="community-logo" />
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
