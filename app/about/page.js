'use client'

import { useEffect, useState } from 'react'
import './about.css'

export default function About() {
  const [latestVideo, setLatestVideo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch latest video from YouTube API
    const fetchLatestVideo = async () => {
      try {
        // This will be configured with your API key tomorrow
        // For now, we'll show a placeholder
        setLatestVideo({
          title: 'Latest Video',
          url: 'https://www.youtube.com/@Quantumx86',
          thumbnail: '/placeholder.jpg'
        })
      } catch (error) {
        console.log('Video fetch will be configured tomorrow')
      } finally {
        setLoading(false)
      }
    }

    fetchLatestVideo()
  }, [])

  return (
    <main>
      <section className="about-hero">
        <div className="container">
          <h1>About Quantum</h1>
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
                <li><a href="https://www.youtube.com/@Quantumx86" target="_blank" rel="noopener">YouTube Channel</a></li>
                <li><a href="https://discord.gg" target="_blank" rel="noopener">Join Discord Community</a></li>
                <li><a href="https://twitter.com" target="_blank" rel="noopener">Follow on Twitter</a></li>
              </ul>
            </div>

            <div className="video-section">
              <h2>Latest Video</h2>
              {loading ? (
                <div className="placeholder">Loading latest video...</div>
              ) : (
                <div className="video-container">
                  <iframe
                    width="100%"
                    height="315"
                    src="https://www.youtube.com/embed/videoseries?list=UUVTGRJrAuVLh0KEHHYAn6aA"
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
              <p className="video-note">
                <a href="https://www.youtube.com/@Quantumx86" target="_blank" rel="noopener">
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
