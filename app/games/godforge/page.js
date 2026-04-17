'use client'

import './game.css'

export default function GodforgePage() {
  return (
    <main>
      <section className="game-hero" style={{ backgroundImage: 'linear-gradient(135deg, #372061 0%, #2a1a4a 100%)' }}>
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

              <section className="resources-section">
                <h2>Resources</h2>
                <ul className="resources-list">
                  <li><a href="https://godforge.gg" target="_blank" rel="noopener">Official Godforge Database</a> - Champion stats and information</li>
                  <li><a href="https://www.hellhades.com" target="_blank" rel="noopener">HellHades Guides</a> - Creator and game developer resources</li>
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
                <a href="https://discord.gg" target="_blank" rel="noopener" className="btn">Join Discord</a>
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
