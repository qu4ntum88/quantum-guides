import Link from 'next/link'
import './about.css'

export const revalidate = 3600

async function getLatestQuantumVideo() {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=UCu4ftCdHwu6imYFbjIUAbhg&maxResults=1&order=date&type=video&key=${process.env.YOUTUBE_API_KEY}`
    )
    const data = await res.json()
    return data.items?.[0]?.id?.videoId ?? null
  } catch {
    return null
  }
}

export default async function About() {
  const latestVideoId = await getLatestQuantumVideo()
  return (
    <main>
      <section className="about-hero">
        <div className="container">
          <h1 className="about-heading">
            <img src="/images/site/Q GOLD LOGOTYPE.png" alt="Quantum" className="about-logotype" />
          </h1>
        </div>
      </section>

      <section className="about-content">
        <div className="container">
          <div className="about-grid">
            <div className="bio-section">
              <h2>Who I Am</h2>
              <p>
                Quantum is a gaming content creator focused primarily on mobile hero collector RPGs. He covers DC: Dark Legion, Godforge, and Void Hunters — games where team-building, progression knowledge, and up-to-date tier information actually matter. When he&apos;s not grinding out guides or making videos, you can find him enjoying an ice cold Mountain Dew Baja Blast Zero and wishing he had more time for a proper MMO.
              </p>
              <p>
                This site exists because good game information is scattered, outdated, or locked behind Discord walls. The goal is to keep it organized, honest, and community-driven — with live tier voting so the wisdom-of-the-crowd stays current as metas shift.
              </p>

              <h3>Connect</h3>
              <ul className="connect-links">
                <li>
                  <a href="https://www.youtube.com/@Quantumx86" target="_blank" rel="noopener noreferrer">
                    <img src="/images/site/yt_logo_mono_dark.png" alt="YouTube Channel" className="social-icon" />
                  </a>
                </li>
                <li>
                  <a href="https://discord.gg/BSPQuvGdSP" target="_blank" rel="noopener noreferrer">
                    <img src="/images/site/Discord-Logo-Blurple.png" alt="Join Discord Community" className="social-icon" />
                  </a>
                </li>
                <li>
                  <a href="https://x.com/Quantumx86" target="_blank" rel="noopener noreferrer">
                    <img src="/images/site/twitter_logo_white.png" alt="Follow on X" className="social-icon" />
                  </a>
                </li>
              </ul>
            </div>

            <div className="video-section">
              <h2>Latest Video</h2>
              {latestVideoId ? (
                <div className="video-container">
                  <iframe
                    width="100%"
                    height="315"
                    src={`https://www.youtube.com/embed/${latestVideoId}`}
                    title="Latest Quantum video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <div className="placeholder">
                  <a href="https://www.youtube.com/@Quantumx86" target="_blank" rel="noopener noreferrer">
                    View latest videos on YouTube →
                  </a>
                </div>
              )}
              <p className="video-note">
                <a href="https://www.youtube.com/@Quantumx86" target="_blank" rel="noopener noreferrer">
                  View all videos on YouTube →
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-site">
        <div className="container">
          <h2 className="site-section-heading">What You&apos;ll Find Here</h2>
          <p className="site-section-intro">
            Quantum Game Guides covers three games in depth — a champion database for each, community tier voting, status effect references, and written guides where the meta is settled enough to be useful.
          </p>
          <div className="games-overview">
            <div className="game-overview-card">
              <h3>DC: Dark Legion</h3>
              <p>
                The most developed section on the site. Browse the full champion roster with synergies, faction tags, and community tier ratings built from real player votes. Explore legacy pieces, use the interactive Gotham battle map for ship combat planning, and check the live community tier list.
              </p>
              <a href="/games/dc-dark-legion" className="overview-link">Explore DCDL →</a>
            </div>
            <div className="game-overview-card">
              <h3>Godforge</h3>
              <p>
                Browse all 202 heroes with filterable grids by rarity, affinity, allegiance, archetype, and faction. Explore the full status effects library covering 105 buffs, debuffs, and disables — useful for team-building and content prep.
              </p>
              <Link href="/games/godforge/heroes" className="overview-link">Explore Godforge →</Link>
            </div>
            <div className="game-overview-card">
              <h3>Void Hunters</h3>
              <p>
                Browse the full hunter roster and the complete status effects database. Community features and written guides are in development as the game&apos;s meta matures.
              </p>
              <a href="/games/void-hunters" className="overview-link">Explore Void Hunters →</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
