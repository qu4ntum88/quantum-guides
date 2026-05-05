import '../legal.css'

export const metadata = {
  title: 'Disclaimer — Quantum Game Guides',
}

export default function Disclaimer() {
  return (
    <main>
      <section className="legal-hero">
        <div className="container">
          <h1>Disclaimer</h1>
        </div>
      </section>

      <section className="legal-body">
        <div className="container">
          <div className="legal-content">
            <p className="legal-updated">Last updated: May 5, 2026</p>

            <h2>Fan Site — No Affiliation</h2>
            <p>
              Quantum Game Guides is an independent fan site created by and for players of mobile and hero collector RPGs. We are not affiliated with, endorsed by, sponsored by, or officially connected to any of the game developers or publishers whose games are covered on this site, including:
            </p>
            <ul>
              <li><strong>DC: Dark Legion</strong> — DC Comics, Warner Bros. Discovery, and any associated developers or publishers</li>
              <li><strong>Godforge</strong> — Fateless Games and HellHades</li>
              <li><strong>Void Hunters</strong> — associated developers and publishers</li>
            </ul>
            <p>
              All game names, logos, characters, artwork, and trademarks featured on this site are the property of their respective owners. Their use here is for fan, commentary, and informational purposes and does not imply any ownership or endorsement.
            </p>

            <h2>Content Accuracy</h2>
            <p>
              We strive to keep all game data, champion information, and guides accurate and up to date. However, mobile games are updated frequently — balance changes, new content, and mechanic revisions can render information outdated. We make no guarantee that any guide, tier rating, or database entry reflects the current state of the game.
            </p>
            <p>
              Always cross-reference important decisions with current in-game data and official sources.
            </p>

            <h2>Community Tier Lists</h2>
            <p>
              Tier ratings displayed on this site represent aggregated community votes submitted by registered users. They reflect community opinion at a point in time and do not constitute professional game advice. Tier positions shift as the meta evolves, new content is released, or new votes are submitted. No tier rating should be treated as definitive.
            </p>

            <h2>Advertising Disclosure</h2>
            <p>
              This site displays advertising through Google AdSense. Advertising revenue helps support the operation of this site. The presence of ads does not influence our content, tier ratings, or game coverage decisions. We receive no direct compensation from game developers for coverage.
            </p>
            <p>
              Links to external resources (official game sites, databases, Discord servers) are provided as a convenience to visitors and do not represent a paid or sponsored relationship unless explicitly stated.
            </p>

            <h2>External Links</h2>
            <p>
              Links to third-party websites are provided for reference only. We are not responsible for the content, accuracy, or privacy practices of any external site.
            </p>

            <h2>Contact</h2>
            <p>
              For questions or concerns, reach us through our <a href="https://discord.gg/BSPQuvGdSP" target="_blank" rel="noopener noreferrer">Discord community</a> or via <a href="https://www.youtube.com/@Quantumx86" target="_blank" rel="noopener noreferrer">YouTube</a>.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
