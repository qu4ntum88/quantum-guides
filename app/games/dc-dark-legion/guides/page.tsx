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

// 8-spike starburst polygon
const STARBURST = 'polygon(50% 0%, 61% 24%, 85% 15%, 76% 39%, 100% 50%, 76% 61%, 85% 85%, 61% 76%, 50% 100%, 39% 76%, 15% 85%, 24% 61%, 0% 50%, 24% 39%, 15% 15%, 39% 24%)'

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

          {latestServer && (
            <div className="card">
              <div style={secTitle}>Latest Server</div>
              <p style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{latestServer}</p>
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

          {gameCodes.length > 0 && (
            <div className="card">
              <div style={secTitle}>Active Game Codes</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0' }}>
                {gameCodes.map((code: string) => (
                  <div key={code} style={{
                    clipPath: STARBURST,
                    background: 'var(--gold)',
                    color: '#111',
                    fontWeight: 900,
                    fontFamily: 'Unbounded, sans-serif',
                    fontSize: '0.7rem',
                    width: '140px',
                    height: '140px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '1.5rem',
                    wordBreak: 'break-all',
                    letterSpacing: '0.02em',
                  }}>
                    {code}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2>Written Guides</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {guides.map((guide) => (
                <div key={guide.id} className="card">
                  <h3><a href={`/games/dc-dark-legion/guides/${guide.id}`}>{guide.title}</a></h3>
                  {guide.description && <p style={{ color: '#cccccc', marginTop: '0.25rem' }}>{guide.description}</p>}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </main>
  )
}
