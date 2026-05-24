import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import '../../godforge/game.css'

type Guide = {
  id: string
  title: string
  pubDate: string | null
  author: string | null
  description: string
  coverImage: string | null
}

function getGuides(): Guide[] {
  const guidesDir = path.join(process.cwd(), 'src/dcdl/guides')
  const files = fs.readdirSync(guidesDir).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
  return files.map((filename) => {
    const raw = fs.readFileSync(path.join(guidesDir, filename), 'utf8')
    const { data } = matter(raw)
    const pubDate = data.pubDate
      ? String(data.pubDate instanceof Date ? data.pubDate.toISOString().slice(0, 10) : data.pubDate)
      : null
    return {
      id: filename.replace(/\.(mdx|md)$/, ''),
      title: data.title ?? filename,
      pubDate,
      author: data.author ?? null,
      description: data.description ?? '',
      coverImage: data.coverImage ?? null,
    }
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

function getInfographicsCount(): number {
  try {
    return (JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/dcdl/data/infographics.json'), 'utf8')) as unknown[]).length
  } catch { return 0 }
}

const GUIDE_GRADIENTS = [
  'linear-gradient(135deg, #0a1628 0%, #1a0a2e 100%)',
  'linear-gradient(135deg, #1a0a10 0%, #0a1628 100%)',
  'linear-gradient(135deg, #0d1f0d 0%, #1a1628 100%)',
  'linear-gradient(135deg, #1a1400 0%, #0a1020 100%)',
]

const secTitle: React.CSSProperties = {
  fontFamily: 'Unbounded, sans-serif', fontSize: '0.65rem', fontWeight: 700,
  letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)',
  borderBottom: '1px solid rgba(204,164,83,0.2)', paddingBottom: '0.5rem', marginBottom: '0.85rem',
}

export default function GuidesPage() {
  const guides = getGuides()
  const { latestServer, patchNotes, gameCodes } = getGameInfo()
  const infographicsCount = getInfographicsCount()

  const featured = guides[0] ?? null
  const remaining = guides.slice(1)

  const hasSidebar = latestServer || gameCodes.length > 0

  return (
    <main style={{ '--game-accent': '#4f8ef7' } as React.CSSProperties}>
      <section className="gh-hero">
        <div className="container">
          <p className="gh-overline">Game Hub</p>
          <h1 className="gh-hero-title">DC: Dark Legion</h1>
          <p className="gh-hero-sub">
            Strategy game set in the DC Universe — idle RPG with base-building, champion collection, and PvP combat across iconic Gotham.
          </p>
          <div className="gh-hero-divider" />
        </div>
      </section>

      <section style={{ padding: '2rem 0 4rem' }}>
        <div className="container">

          {/* Featured Guide */}
          {featured && (
            <a
              href={`/games/dc-dark-legion/guides/${featured.id}`}
              style={{ display: 'block', textDecoration: 'none', marginBottom: '2rem' }}
            >
              <div style={{
                position: 'relative',
                height: '260px',
                borderRadius: '1rem',
                overflow: 'hidden',
                background: '#0a0a14',
                border: '1px solid rgba(79,142,247,0.3)',
                boxShadow: '0 0 0 1px rgba(79,142,247,0.08)',
              }}>
                {featured.coverImage ? (
                  <img
                    src={featured.coverImage}
                    alt=""
                    aria-hidden="true"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
                  />
                ) : (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, #071422 0%, #130a28 40%, #071422 100%)',
                  }} />
                )}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.15) 100%)',
                }} />
                <div style={{ position: 'relative', zIndex: 1, padding: '2rem 2.5rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '640px' }}>
                  <div style={{
                    fontFamily: 'Unbounded, sans-serif', fontSize: '0.5rem', fontWeight: 700,
                    color: '#4f8ef7', letterSpacing: '0.18em', textTransform: 'uppercase',
                    marginBottom: '0.6rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}>
                    <span style={{ display: 'inline-block', width: '1.5rem', height: '2px', background: '#4f8ef7', flexShrink: 0 }} />
                    Featured Guide
                  </div>
                  <h2 style={{
                    margin: '0 0 0.6rem',
                    fontFamily: 'Unbounded, sans-serif',
                    fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)',
                    fontWeight: 800,
                    color: '#fff',
                    lineHeight: 1.25,
                  }}>
                    {featured.title}
                  </h2>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: '#888', marginBottom: featured.description ? '0.6rem' : 0 }}>
                    {featured.pubDate && <span>{featured.pubDate}</span>}
                    {featured.author && <span>by {featured.author}</span>}
                  </div>
                  {featured.description && (
                    <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, maxWidth: '480px' }}>
                      {featured.description}
                    </p>
                  )}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    fontFamily: 'Unbounded, sans-serif', fontSize: '0.65rem', fontWeight: 700,
                    color: 'var(--gold)', letterSpacing: '0.05em',
                  }}>
                    Read Guide →
                  </span>
                </div>
              </div>
            </a>
          )}

          {/* Two-column layout: main + sidebar */}
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Main column */}
            <div style={{ flex: '1 1 480px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Patch Notes */}
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

              {/* Infographics teaser */}
              <a href="/games/dc-dark-legion/infographics" style={{ display: 'block', textDecoration: 'none' }}>
                <div className="gh-info-teaser">
                  <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>📊</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '0.5rem', fontWeight: 700, color: '#4f8ef7', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Visual Resources
                    </div>
                    <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                      Helpful Infographics
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#777', lineHeight: 1.5 }}>
                      Charts, tables, and visual guides curated by Quantum and fellow creators.
                      {infographicsCount > 0 && ` ${infographicsCount} available.`}
                    </p>
                  </div>
                  <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>
                    Browse All →
                  </div>
                </div>
              </a>

              {/* Written Guides Grid */}
              {(remaining.length > 0 || guides.length > 0) && (
                <div>
                  <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Written Guides</h2>
                  {remaining.length === 0 && guides.length === 1 ? (
                    <p style={{ color: '#555', fontSize: '0.85rem', fontStyle: 'italic' }}>More guides coming soon.</p>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                      gap: '1rem',
                    }}>
                      {remaining.map((guide, idx) => (
                        <a
                          key={guide.id}
                          href={`/games/dc-dark-legion/guides/${guide.id}`}
                          className="gh-guide-card"
                        >
                          <div style={{
                            width: '100%',
                            aspectRatio: '16/9',
                            background: guide.coverImage ? '#000' : GUIDE_GRADIENTS[idx % GUIDE_GRADIENTS.length],
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}>
                            {guide.coverImage && (
                              <img
                                src={guide.coverImage}
                                alt=""
                                aria-hidden="true"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                              />
                            )}
                          </div>
                          <div style={{ padding: '0.9rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
                            <div style={{
                              fontFamily: 'Unbounded, sans-serif',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: '#e8e8e8',
                              lineHeight: 1.35,
                            }}>
                              {guide.title}
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.65rem', color: '#555' }}>
                              {guide.pubDate && <span>{guide.pubDate}</span>}
                              {guide.author && <span>by {guide.author}</span>}
                            </div>
                            {guide.description && (
                              <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#777', lineHeight: 1.5, flex: 1 }}>
                                {guide.description}
                              </p>
                            )}
                            <div style={{ marginTop: '0.5rem', fontSize: '0.62rem', color: 'var(--gold)', fontFamily: 'Unbounded, sans-serif', letterSpacing: '0.04em' }}>
                              Read →
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            {hasSidebar && (
              <div style={{
                width: '260px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'sticky',
                top: '5.5rem',
                alignSelf: 'flex-start',
              }}>
                {latestServer && (
                  <div className="card">
                    <div style={secTitle}>Latest Server</div>
                    <p style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, fontFamily: 'Unbounded, sans-serif', color: '#fff', lineHeight: 1.2 }}>
                      {latestServer}
                    </p>
                  </div>
                )}
                {gameCodes.length > 0 && (
                  <div className="card">
                    <div style={secTitle}>Active Game Codes</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {gameCodes.map((code: string) => (
                        <span key={code} style={{
                          fontFamily: 'Unbounded, sans-serif',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          color: 'var(--gold)',
                          background: 'rgba(204,164,83,0.08)',
                          border: '1px solid rgba(204,164,83,0.35)',
                          borderRadius: '0.375rem',
                          padding: '0.45rem 0.75rem',
                          letterSpacing: '0.04em',
                          display: 'block',
                          textAlign: 'center',
                          wordBreak: 'break-all',
                        }}>
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </section>
    </main>
  )
}
