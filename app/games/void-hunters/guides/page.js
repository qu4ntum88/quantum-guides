import '../../godforge/game.css'

export const revalidate = 3600

const GOLD = 'rgba(201, 160, 30, 0.45)'

export default function VoidHuntersGuidesPage() {
  return (
    <main style={{ '--game-accent': '#06b6d4' }}>
      <section className="gh-hero">
        <div className="container">
          <p className="gh-overline">Game Hub</p>
          <h1 className="gh-hero-title">Void Hunters</h1>
          <p className="gh-hero-sub">Dark fantasy turn-based RPG — build your hunter roster, master strategic combat, and take on escalating void threats.</p>
          <div className="gh-hero-divider" />
        </div>
      </section>

      <section className="game-content">
        <div className="container">
          <div className="content-grid">
            <div className="main-content">

              <section className="resources-section" style={{ marginBottom: '2rem' }}>
                <h2>Resources</h2>
                <div style={{ marginTop: '0.75rem' }}>
                  {/* Hunter Database row */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 0' }}>
                    <div style={{ flexShrink: 0, width: '13rem', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingRight: '1.25rem' }}>
                      <a href="/games/void-hunters" className="btn" style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem', whiteSpace: 'nowrap' }}>
                        Hunter Database →
                      </a>
                    </div>
                    <div style={{ width: '2px', height: '2.5rem', background: GOLD, flexShrink: 0, alignSelf: 'center' }} />
                    <p style={{ margin: 0, paddingLeft: '1.25rem', color: '#cccccc', lineHeight: 1.7, fontSize: '0.92rem' }}>
                      Want to come up with your own builds and theorycraft? We&apos;ve got a sortable grid where you can filter through all of the Hunters and find the ones you need. And if you want to learn more about those hunters, you can click on each one to go to their dedicated page to learn more about their kits, lore, and upgrades.
                    </p>
                  </div>

                  {/* Row divider */}
                  <div style={{ height: '2px', background: GOLD }} />

                  {/* Status Effects row */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 0' }}>
                    <div style={{ flexShrink: 0, width: '13rem', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingRight: '1.25rem' }}>
                      <a href="/games/void-hunters/status-effects" className="btn" style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem', whiteSpace: 'nowrap' }}>
                        Status Effects →
                      </a>
                    </div>
                    <div style={{ width: '2px', height: '2.5rem', background: GOLD, flexShrink: 0, alignSelf: 'center' }} />
                    <p style={{ margin: 0, paddingLeft: '1.25rem', color: '#cccccc', lineHeight: 1.7, fontSize: '0.92rem' }}>
                      We&apos;ve compiled a list of all the status effects in the game in a searchable grid.
                    </p>
                  </div>
                </div>
              </section>

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

            </div>

            <aside className="sidebar">
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
