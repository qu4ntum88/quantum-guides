import './game.css'

export const revalidate = 3600

async function getLatestFatelessVideo() {
  try {
    const res = await fetch(
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCSpCHYBp2ptiAHVX0KYYlSQ'
    )
    const xml = await res.text()
    const match = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

export default async function GodforgePage() {
  const latestDevVideoId = await getLatestFatelessVideo()

  return (
    <main>
      <section className="game-hero" style={{ backgroundImage: "url('/images/site/Quantum Purple Background.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="container">
          <h1>Godforge Guides</h1>
          <p className="subtitle">Hero collector RPG focused on strategic team composition and deep progression systems</p>
        </div>
      </section>

      <section className="game-content">
        <div className="container">
          <div className="content-grid">
            <div className="main-content">
              <section className="guides-section">
                <h2>Comprehensive Guides</h2>
                <p className="section-desc">In-depth guides covering all aspects of Godforge gameplay</p>

                <div className="guides-list">
                  <div className="guide-card">
                    <h3>Mechanics Guide</h3>
                    <p>Complete walkthrough of Godforge mechanics, progression systems, and core gameplay loops.</p>
                    <a href="#" className="guide-link">Read Guide →</a>
                  </div>

                  <div className="guide-card">
                    <h3>Champion Guide</h3>
                    <p>Comprehensive breakdown of all champions, their abilities, and optimal team compositions.</p>
                    <a href="#" className="guide-link">Read Guide →</a>
                  </div>

                  <div className="guide-card">
                    <h3>Progression Strategy</h3>
                    <p>Step-by-step guide to efficient progression from early game through endgame content.</p>
                    <a href="#" className="guide-link">Read Guide →</a>
                  </div>

                  <div className="guide-card">
                    <h3>Team Building</h3>
                    <p>Advanced strategies for building synergistic teams and optimizing for different content.</p>
                    <a href="#" className="guide-link">Read Guide →</a>
                  </div>
                </div>
              </section>

              <section className="videos-section">
                <h2>Video Guides</h2>
                <p className="section-desc">Watch video walkthroughs and detailed explanations</p>
                <div className="videos-placeholder">
                  <p>Latest video guides coming during Godforge beta...</p>
                </div>
              </section>

              <section className="videos-section">
                <h2>Latest Developer News</h2>
                <p className="section-desc">The latest from Fateless Games</p>
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
                  <div className="videos-placeholder">
                    <p>Visit <a href="https://www.youtube.com/@FatelessGames" target="_blank" rel="noopener noreferrer">Fateless Games on YouTube</a> for the latest news.</p>
                  </div>
                )}
              </section>

              <section className="resources-section">
                <h2>Resources</h2>
                <ul className="resources-list">
                  <li><a href="https://godforge.gg/heroes/aaru" target="_blank" rel="noopener noreferrer">Official Godforge Database</a> - Champion stats and information</li>
                  <li><a href="https://www.hellhades.com" target="_blank" rel="noopener noreferrer">HellHades Guides</a> - Creator and game developer resources</li>
                </ul>
              </section>
            </div>

            <aside className="sidebar">
              <div className="sidebar-card">
                <h3>About Godforge</h3>
                <p>Godforge is a hero collector RPG from Fateless Studios focused on strategic team composition and deep progression systems. It's a world of gods, myths, and legends.</p>
              </div>

              <div className="sidebar-card">
                <h3>Community</h3>
                <p>Join the Godforge community to discuss strategies, share tips, and stay updated on the latest content.</p>
                <a href="https://discord.gg/RdvnWRBZ8j" target="_blank" rel="noopener noreferrer" className="btn">Join Discord</a>
              </div>

              <div className="sidebar-card">
                <h3>Latest Updates</h3>
                <ul className="updates-list">
                  <li>Champion Balance Update - April 2026</li>
                  <li>New Campaign Mode Released</li>
                  <li>Beta Sign-ups Now Open</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
