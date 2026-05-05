import '../../godforge/game.css'

export const revalidate = 3600

export default function VoidHuntersGuidesPage() {
  return (
    <main>
      <section className="game-hero" style={{ backgroundImage: "url('/images/site/Quantum Purple Background.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="container">
          <h1 className="game-title">Void Hunters Guides</h1>
          <p className="subtitle">Strategic guides for Void Hunters — hunter builds, team composition, and progression tips</p>
        </div>
      </section>

      <section className="game-content">
        <div className="container">
          <div className="content-grid">
            <div className="main-content">
              <section className="videos-section">
                <h2>Video Guides</h2>
                <p className="section-desc">Watch video walkthroughs and detailed explanations</p>
                <div className="video-container">
                  <iframe
                    width="100%"
                    height="315"
                    src="https://www.youtube.com/embed/videoseries?list=PLj9TDaSk5Dc-sdI1bxzAO4jbm1Z5LBKhF"
                    title="Void Hunters Video Guides"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              </section>

              <section className="resources-section">
                <h2>Resources</h2>
                <ul className="resources-list">
                  <li><a href="/games/void-hunters" rel="noopener noreferrer">Hunter Database</a> — Browse and filter all Void Hunters</li>
                  <li><a href="/games/void-hunters/status-effects" rel="noopener noreferrer">Status Effects</a> — Reference for all buffs and debuffs</li>
                </ul>
              </section>
            </div>

            <aside className="sidebar">
              <div className="sidebar-card">
                <h3>About Void Hunters</h3>
                <p>Void Hunters is a strategic RPG where you build and manage a roster of hunters to take on increasingly challenging content.</p>
              </div>

              <div className="sidebar-card">
                <h3>Community</h3>
                <p>Join the community to discuss strategies, share tips, and stay updated on the latest content.</p>
                <a href="https://discord.gg/2McMuE94bC" target="_blank" rel="noopener noreferrer" className="btn">Join Discord</a>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
