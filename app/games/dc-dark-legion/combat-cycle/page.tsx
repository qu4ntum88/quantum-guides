import { getHeros } from '@/src/dcdl/lib/data'

type CCSkill = { name: string; description: string }

type CCBoss = {
  id: string
  name: string
  day: string
  currency: string
  image: string
  mechanics: string
  skills: CCSkill[]
  recommendedChampions: string[]
}

function readBosses(): CCBoss[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/src/dcdl/data/combat-cycle.json') as CCBoss[]
}

function bossImagePath(raw: string): string {
  if (!raw) return ''
  return '/dcdl/combat-cycle/' + raw.replace(/^\.\//, '')
}

const RARITY_BG: Record<string, string> = {
  'Iconic':   '#00292a',
  'Mythic +': '#3a000f',
  'Mythic':   '#3a0014',
  'Legendary':'#3a2d00',
  'Epic':     '#2e0038',
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function CombatCyclePage() {
  const heroes = getHeros()
  const heroMap = Object.fromEntries(heroes.map((h) => [h.id, h]))
  const bosses = readBosses().sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
  )

  return (
    <main>
      <section
        className="game-hero"
        style={{
          backgroundImage: "url('/images/site/Quantum Purple Background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '3rem 0',
        }}
      >
        <div className="container">
          <h1 style={{ color: '#fff', marginBottom: '0.5rem' }}>
            DC: Dark Legion — Combat Cycle Guide
          </h1>
          <p style={{ color: '#cccccc' }}>
            Quantum&apos;s ultimate guide to all 7 Combat Cycle bosses — mechanics, skills, and top counters.
          </p>
          <a
            href="/games/dc-dark-legion"
            style={{ color: 'var(--gold)', fontSize: '0.85rem', display: 'inline-block', marginTop: '0.75rem' }}
          >
            ← Back to Champion List
          </a>
        </div>
      </section>

      <section style={{ padding: '2rem 0 4rem' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {bosses.map((boss) => {
            const imgSrc = bossImagePath(boss.image)
            const recommendedHeroes = boss.recommendedChampions
              .map((id) => heroMap[id])
              .filter(Boolean)

            return (
              <div
                key={boss.id}
                style={{
                  border: '1px solid #2a2a2a',
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {/* Boss header band */}
                <div style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: 0,
                  borderBottom: '1px solid #2a2a2a',
                  background: 'rgba(255,255,255,0.03)',
                }}>
                  {/* Boss image */}
                  <div style={{
                    width: '220px',
                    minHeight: '180px',
                    flexShrink: 0,
                    background: '#0a0a0a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={boss.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <span style={{ color: '#333', fontSize: '0.75rem', fontStyle: 'italic' }}>No image</span>
                    )}
                  </div>

                  {/* Name + day + currency */}
                  <div style={{
                    flex: 1,
                    padding: '1.5rem 1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}>
                    <h2 style={{
                      margin: 0,
                      fontFamily: 'Unbounded, sans-serif',
                      fontSize: '1.4rem',
                      fontWeight: 700,
                      color: 'var(--gold)',
                      lineHeight: 1.2,
                    }}>
                      {boss.name}
                    </h2>
                    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{
                        fontFamily: 'Unbounded, sans-serif',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: '#c0c0c0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}>
                        📅 {boss.day}
                      </span>
                      {boss.currency && (
                        <span style={{
                          fontFamily: 'Unbounded, sans-serif',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: '#a0c8ff',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}>
                          💰 {boss.currency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

                  {/* Mechanics */}
                  {boss.mechanics && (
                    <div>
                      <div style={sectionLabel}>Boss Mechanics</div>
                      <p style={{ margin: 0, color: '#c0c0c0', lineHeight: 1.75, fontSize: '0.9rem' }}>
                        {boss.mechanics}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {boss.skills.length > 0 && (
                    <div>
                      <div style={sectionLabel}>Boss Skills</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {boss.skills.map((skill, i) => (
                          <div
                            key={i}
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid #222',
                              borderRadius: '0.5rem',
                              padding: '0.6rem 1rem',
                            }}
                          >
                            <div style={{
                              fontFamily: 'Unbounded, sans-serif',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: 'var(--gold)',
                              marginBottom: '0.25rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}>
                              {skill.name}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#b0b0b0', lineHeight: 1.6 }}>
                              {skill.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Champions */}
                  {recommendedHeroes.length > 0 && (
                    <div>
                      <div style={sectionLabel}>Top Counters</div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {recommendedHeroes.map((hero) => (
                          <a
                            key={hero.id}
                            href={`/games/dc-dark-legion/heros/${hero.id}`}
                            title={hero.name}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}
                          >
                            <img
                              src={hero.imageHeadshot ?? ''}
                              alt={hero.name}
                              style={{
                                width: '4.5rem',
                                height: '4.5rem',
                                objectFit: 'cover',
                                borderRadius: '0.5rem',
                                border: '2px solid var(--gold)',
                                background: RARITY_BG[hero.rarity] ?? '#111',
                                display: 'block',
                              }}
                            />
                            <span style={{ fontSize: '0.55rem', color: '#aaa', textAlign: 'center', maxWidth: '4.5rem', lineHeight: 1.2 }}>
                              {hero.name.split('(')[0].trim()}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!boss.mechanics && boss.skills.length === 0 && recommendedHeroes.length === 0 && (
                    <p style={{ margin: 0, color: '#444', fontStyle: 'italic', fontSize: '0.85rem' }}>
                      Guide content coming soon.
                    </p>
                  )}

                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}

const sectionLabel: React.CSSProperties = {
  fontFamily: 'Unbounded, sans-serif',
  fontSize: '0.6rem',
  fontWeight: 700,
  color: '#888',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: '0.6rem',
}
