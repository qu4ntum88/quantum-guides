import './about.css'

export const revalidate = 3600

async function getLatestQuantumVideo() {
  try {
    const res = await fetch(
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCAEzz9h47VuaGSTgwzavxEA'
    )
    const xml = await res.text()
    const match = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)
    return match ? match[1] : null
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
                Quantum is a gaming content creator who covers primarily mobile games on his YouTube channel, but who prefers MMOs when he really has time to devote to a game. When he's not making videos or infographics or playing games, you can find him enjoying an ice cold Mountain Dew Baja Blast Zero. Currently, Quantum spends most of his time making content for DC: Dark Legion, Godforge, and Void Hunters.
              </p>

              <h3>Connect</h3>
              <ul className="connect-links">
                <li><a href="https://www.youtube.com/@Quantumx86" target="_blank" rel="noopener noreferrer">YouTube Channel</a></li>
                <li><a href="https://discord.gg/BSPQuvGdSP" target="_blank" rel="noopener noreferrer">Join Discord Community</a></li>
                <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Follow on Twitter</a></li>
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
                  <p>Visit <a href="https://www.youtube.com/@Quantumx86" target="_blank" rel="noopener noreferrer">Quantum on YouTube</a> for the latest videos.</p>
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
    </main>
  )
}
