import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

function getGuides() {
  const guidesDir = path.join(process.cwd(), 'src/dcdl/guides')
  const files = fs.readdirSync(guidesDir).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
  return files.map((filename) => {
    const raw = fs.readFileSync(path.join(guidesDir, filename), 'utf8')
    const { data } = matter(raw)
    return { id: filename.replace(/\.(mdx|md)$/, ''), title: data.title ?? filename, pubDate: data.pubDate ?? null, description: data.description ?? '' }
  }).sort((a, b) => (b.pubDate ?? '') > (a.pubDate ?? '') ? 1 : -1)
}

export default function GuidesPage() {
  const guides = getGuides()

  return (
    <main>
      <section
        style={{
          backgroundImage: "url('/images/site/Quantum Purple Background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '3rem 0',
        }}
      >
        <div className="container">
          <h1>DC: Dark Legion — Guides</h1>
          <p style={{ color: '#cccccc' }}>Learn how to dominate DC: Dark Legion!</p>
        </div>
      </section>

      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <h2>Written Guides</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {guides.map((guide) => (
              <div key={guide.id} className="card">
                <h3><a href={`/games/dc-dark-legion/guides/${guide.id}`}>{guide.title}</a></h3>
                {guide.description && <p style={{ color: '#cccccc', marginTop: '0.25rem' }}>{guide.description}</p>}
              </div>
            ))}
          </div>

          <h2 style={{ marginTop: '3rem' }}>Infographics</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
            <div>
              <h3>Character Tier List</h3>
              <img src="/dcdl/guides/Infographics/October2025DCDLTierList.png" alt="Character tier list" style={{ maxWidth: '90%' }} />
            </div>
            <div>
              <h3>Legacy Piece Tier List</h3>
              <img src="/dcdl/guides/Infographics/July2025LegacyPieces.png" alt="Legacy pieces tier list" style={{ maxWidth: '90%' }} />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
