import '../../godforge/game.css'

export const revalidate = 3600

const GOLD = 'rgba(201, 160, 30, 0.45)'

export default function VoidHuntersGuidesPage() {
  return (
    <main>
      <section className="game-hero" style={{ backgroundImage: "url('/images/site/Quantum Purple Background.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="container">
          <h1 className="game-title">Void Hunters Guides</h1>
          <p className="subtitle">
            Void Hunters is a strategic RPG where you build and manage a roster of hunters to take on increasingly challenging content. It&apos;s a dark fantasy, Free-to-Play, turn-based hero collector, where all hunters are meant to be used for one game mode or another and they are fully built into the lore. On this site, you&apos;ll find Quantum&apos;s strategic guides for Void Hunters, including recommended hunter and team builds, community driven tier rankings, a sortable grid for all hunters, individual hunter pages with additional information, and progression tips.
          </p>
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
