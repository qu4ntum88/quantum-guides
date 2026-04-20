import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

function getGuides() {
  const guidesDir = path.join(process.cwd(), 'src/dcdl/guides')
  const files = fs.readdirSync(guidesDir).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
  return files.map((filename) => {
    const raw = fs.readFileSync(path.join(guidesDir, filename), 'utf8')
    const { data } = matter(raw)
    const pubDate = data.pubDate ? String(data.pubDate instanceof Date ? data.pubDate.toISOString().slice(0, 10) : data.pubDate) : null
    return { id: filename.replace(/\.(mdx|md)$/, ''), title: data.title ?? filename, pubDate, author: data.author ?? null, description: data.description ?? '' }
  }).sort((a, b) => {
    if (!a.pubDate && !b.pubDate) return 0
    if (!a.pubDate) return 1
    if (!b.pubDate) return -1
    return b.pubDate.localeCompare(a.pubDate)
  })
}

function getGameInfo() {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/dcdl/data/game-info.json'), 'utf8'))
  } catch {
    return { latestServer: '', patchNotes: '', gameCodes: [] }
  }
}

const secTitle: React.CSSProperties = {
  fontFamily: 'Unbounded, sans-serif', fontSize: '0.75rem', fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)',
  borderBottom: '1px solid rgba(204,164,83,0.3)', paddingBottom: '0.5rem', marginBottom: '0.75rem',
}

export default function GuidesPage() {
  const guides = getGuides()
  const { latestServer, patchNotes, gameCodes } = getGameInfo()

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
          <h1>DC: Dark Legion — Info & Guides</h1>
          <p style={{ color: '#cccccc' }}>Learn how to dominate DC: Dark Legion!</p>
        </div>
      </section>

      <section style={{ padding: '2rem 0' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {(latestServer || gameCodes.length > 0) && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {latestServer && (
                <div className="card" style={{ flex: '0 0 auto' }}>
                  <div style={secTitle}>Latest Server</div>
                  <p style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{latestServer}</p>
                </div>
              )}
              {gameCodes.length > 0 && (
                <div className="card" style={{ flex: '1 1 auto' }}>
                  <div style={secTitle}>Active Game Codes</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                    {gameCodes.map((code: string) => (
                      <span key={code} style={{
                        fontFamily: 'Unbounded, sans-serif',
                        fontWeight: 800,
                        fontSize: '1rem',
                        color: 'var(--gold)',
                        background: 'rgba(204,164,83,0.1)',
                        border: '1px solid rgba(204,164,83,0.4)',
                        borderRadius: '0.375rem',
                        padding: '0.4rem 0.9rem',
                        letterSpacing: '0.04em',
                      }}>
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {patchNotes && (
            <div className="card">
              <div style={secTitle}>Latest Patch Notes</div>
              <pre style={{
                fontFamily: "'VT323', monospace",
                fontSize: '1.1rem',
                color: '#39ff88',
                background: '#040d04',
                border: '1px solid #1a4d1a',
                borderRadius: '0.375rem',
                padding: '1.25rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.55,
                margin: 0,
              }}>
                {patchNotes}
              </pre>
            </div>
          )}

          <div>
            <h2>Written Guides</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {guides.map((guide) => (
                <div key={guide.id} className="card">
                  <h3 style={{ marginBottom: '0.25rem' }}><a href={`/games/dc-dark-legion/guides/${guide.id}`}>{guide.title}</a></h3>
                  <div style={{ fontSize: '0.78rem', color: '#666', marginBottom: '0.4rem', display: 'flex', gap: '1rem' }}>
                    {guide.pubDate && <span>{guide.pubDate}</span>}
                    {guide.author && <span>by {guide.author}</span>}
                  </div>
                  {guide.description && <p style={{ color: '#cccccc', margin: 0 }}>{guide.description}</p>}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </main>
  )
}
