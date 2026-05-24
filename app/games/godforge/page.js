import './game.css'

export const revalidate = 3600

const GOLD = 'rgba(201, 160, 30, 0.45)'

async function getLatestFatelessVideo() {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=UCSpCHYBp2ptiAHVX0KYYlSQ&maxResults=1&order=date&type=video&key=${process.env.YOUTUBE_API_KEY}`
    )
    const data = await res.json()
    return data.items?.[0]?.id?.videoId ?? null
  } catch {
    return null
  }
}

export default async function GodforgePage() {
  const latestDevVideoId = await getLatestFatelessVideo()

  return (
    <main style={{ '--game-accent': '#a855f7' }}>
      <section className="gh-hero">
        <div className="container">
          <p className="gh-overline">Game Hub</p>
          <h1 className="gh-hero-title">
            <img src="/images/site/Godforge_LogoPNG.png" alt="Godforge" className="game-title-logo" />
            Guides
          </h1>
          <p className="gh-hero-sub">Hero collector RPG focused on strategic team composition and deep progression systems</p>
          <div className="gh-hero-divider" />
        </div>
      </section>

      <section className="game-content">
        <div className="container">
          <div className="content-grid">
            <div className="main-content">

              <section className="resources-section">
                <h2>Resources</h2>
                <div style={{ marginTop: '0.75rem' }}>

                  {/* Heroes */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 0' }}>
                    <div style={{ flexShrink: 0, width: '13rem', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingRight: '1.25rem' }}>
                      <a href="/games/godforge/heroes" className="btn" style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img src="/images/site/Q WHITE ICON.png" alt="" style={{ width: '0.95rem', height: '0.95rem', flexShrink: 0 }} />
                        Heroes →
                      </a>
                    </div>
                    <div style={{ width: '2px', height: '2.5rem', background: GOLD, flexShrink: 0, alignSelf: 'center' }} />
                    <p style={{ margin: 0, paddingLeft: '1.25rem', color: '#cccccc', lineHeight: 1.7, fontSize: '0.92rem' }}>
                      Browse all 200+ heroes in a sortable, filterable grid. Filter by rarity, affinity, allegiance, archetype, or faction to find exactly who you&apos;re looking for.
                    </p>
                  </div>

                  <div style={{ height: '2px', background: GOLD }} />

                  {/* Status Effects */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 0' }}>
                    <div style={{ flexShrink: 0, width: '13rem', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingRight: '1.25rem' }}>
                      <a href="/games/godforge/status-effects" className="btn" style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img src="/images/site/Q WHITE ICON.png" alt="" style={{ width: '0.95rem', height: '0.95rem', flexShrink: 0 }} />
                        Status Effects →
                      </a>
                    </div>
                    <div style={{ width: '2px', height: '2.5rem', background: GOLD, flexShrink: 0, alignSelf: 'center' }} />
                    <p style={{ margin: 0, paddingLeft: '1.25rem', color: '#cccccc', lineHeight: 1.7, fontSize: '0.92rem' }}>
                      A searchable grid of all status effects in the game, organized by buffs, debuffs, and disables.
                    </p>
                  </div>

                  <div style={{ height: '2px', background: GOLD }} />

                  {/* RavenPyros */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 0' }}>
                    <div style={{ flexShrink: 0, width: '13rem', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingRight: '1.25rem' }}>
                      <a href="https://www.ravenpyros.com/" target="_blank" rel="noopener noreferrer" className="btn" style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem', whiteSpace: 'nowrap' }}>
                        RavenPyros →
                      </a>
                    </div>
                    <div style={{ width: '2px', height: '2.5rem', background: GOLD, flexShrink: 0, alignSelf: 'center' }} />
                    <p style={{ margin: 0, paddingLeft: '1.25rem', color: '#cccccc', lineHeight: 1.7, fontSize: '0.92rem' }}>
                      RavenPyros runs a community driven resource hub with tons of tier lists and helpful content.
                    </p>
                  </div>

                  <div style={{ height: '2px', background: GOLD }} />

                  {/* Official Godforge Database */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 0' }}>
                    <div style={{ flexShrink: 0, width: '13rem', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingRight: '1.25rem' }}>
                      <a href="https://godforge.gg/heroes/aaru" target="_blank" rel="noopener noreferrer" className="btn" style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem', whiteSpace: 'nowrap' }}>
                        Official DB →
                      </a>
                    </div>
                    <div style={{ width: '2px', height: '2.5rem', background: GOLD, flexShrink: 0, alignSelf: 'center' }} />
                    <p style={{ margin: 0, paddingLeft: '1.25rem', color: '#cccccc', lineHeight: 1.7, fontSize: '0.92rem' }}>
                      The official Godforge hero database — champion stats and information direct from the developers.
                    </p>
                  </div>

                  <div style={{ height: '2px', background: GOLD }} />

                  {/* HellHades */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 0' }}>
                    <div style={{ flexShrink: 0, width: '13rem', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingRight: '1.25rem' }}>
                      <a href="https://www.hellhades.com" target="_blank" rel="noopener noreferrer" className="btn" style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem', whiteSpace: 'nowrap' }}>
                        HellHades →
                      </a>
                    </div>
                    <div style={{ width: '2px', height: '2.5rem', background: GOLD, flexShrink: 0, alignSelf: 'center' }} />
                    <p style={{ margin: 0, paddingLeft: '1.25rem', color: '#cccccc', lineHeight: 1.7, fontSize: '0.92rem' }}>
                      Creator and game developer resources for Godforge.
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
                    src="https://www.youtube.com/embed/videoseries?list=PLj9TDaSk5Dc8XzeAqwdxx7T_uYb9D_YPH"
                    title="Godforge Video Guides"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
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

            </div>

            <aside className="sidebar">
              <div className="sidebar-card">
                <h3>About Godforge</h3>
                <p>Godforge is a hero collector RPG from Fateless Studios focused on strategic team composition and deep progression systems. It&apos;s a world of gods, myths, and legends.</p>
              </div>

              <div className="sidebar-card">
                <h3>Community</h3>
                <p>Join the Godforge community to discuss strategies, share tips, and stay updated on the latest content.</p>
                <a href="https://discord.gg/RdvnWRBZ8j" target="_blank" rel="noopener noreferrer" className="btn">Join Discord</a>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
