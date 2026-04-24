import { getHeros } from '@/src/dcdl/lib/data'

type CCStatusEffect = { name: string; effect: string }
type CCSkill = { name: string; description: string; type?: string; status_effects?: CCStatusEffect[] }
type CCCurrency = { name: string; image: string }

type CCBoss = {
  id: string
  name: string
  ccTag: string
  day: string
  currencies: CCCurrency[]
  image: string
  portrait: string
  mechanics: string
  skills: CCSkill[]
}

function readBosses(): CCBoss[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/src/dcdl/data/combat-cycle.json') as CCBoss[]
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
  const bosses = readBosses().sort((a, b) => {
    const firstDay = (d: string) => d.split('/')[0].trim()
    return DAY_ORDER.indexOf(firstDay(a.day)) - DAY_ORDER.indexOf(firstDay(b.day))
  })

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
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {bosses.map((boss) => {
            const recommendedHeroes = heroes.filter(
              (h) => h.gameModes?.includes(boss.ccTag)
            )
            const bgSrc = boss.image ? `/dcdl/combat-cycle/${boss.image}` : ''
            const portraitSrc = boss.portrait ? `/dcdl/combat-cycle/${boss.portrait}` : ''

            return (
              <div
                key={boss.id}
                style={{
                  position: 'relative',
                  border: '1px solid #333',
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  background: '#0c0618',
                }}
              >
                {/* Faded full-size background image */}
                {bgSrc && (
                  <img
                    src={bgSrc}
                    alt=""
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center top',
                      opacity: 0.1,
                      zIndex: 0,
                    }}
                  />
                )}

                {/* Content layer */}
                <div style={{ position: 'relative', zIndex: 1 }}>

                  {/* Header — fixed height for all bosses */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    height: '200px',
                    borderBottom: '1px solid #2a2a2a',
                  }}>
                    {/* Portrait */}
                    <div style={{
                      width: '200px',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1rem',
                      background: 'rgba(0,0,0,0.25)',
                      borderRight: '1px solid #2a2a2a',
                    }}>
                      {portraitSrc ? (
                        <img
                          src={portraitSrc}
                          alt={boss.name}
                          style={{
                            width: '160px',
                            height: '160px',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <span style={{ color: '#444', fontSize: '0.75rem', fontStyle: 'italic' }}>No portrait</span>
                      )}
                    </div>

                    {/* Name + day + currencies */}
                    <div style={{
                      flex: 1,
                      padding: '1.5rem 1.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: '0.75rem',
                    }}>
                      <h2 style={{
                        margin: 0,
                        fontFamily: 'Unbounded, sans-serif',
                        fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
                        fontWeight: 700,
                        color: 'var(--gold)',
                        lineHeight: 1.2,
                      }}>
                        {boss.name}
                      </h2>
                      <span style={{
                        fontFamily: 'Unbounded, sans-serif',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: '#aaa',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}>
                        📅 {boss.day}
                      </span>
                      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {(boss.currencies ?? []).map((cur) => (
                          <div key={cur.name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <img
                              src={`/dcdl/resource_icons/${cur.image}`}
                              alt={cur.name}
                              title={cur.name}
                              style={{ width: '2.75rem', height: '2.75rem', objectFit: 'contain' }}
                            />
                            <span style={{
                              fontFamily: 'Unbounded, sans-serif',
                              fontSize: '1rem',
                              fontWeight: 600,
                              color: '#a0c8ff',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}>
                              {cur.name}
                            </span>
                          </div>
                        ))}
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {boss.skills.map((skill, i) => (
                            <div
                              key={i}
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid #2a2a2a',
                                borderRadius: '0.6rem',
                                overflow: 'hidden',
                              }}
                            >
                              {/* Skill name row */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                padding: '0.6rem 1rem',
                                borderBottom: '1px solid #1e1e1e',
                                background: 'rgba(255,255,255,0.03)',
                              }}>
                                <span style={{
                                  fontFamily: 'Unbounded, sans-serif',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: 'var(--gold)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  flex: 1,
                                }}>
                                  {skill.name}
                                </span>
                                {skill.type && (
                                  <span style={{
                                    fontSize: '0.55rem',
                                    fontFamily: 'Unbounded, sans-serif',
                                    fontWeight: 700,
                                    color: '#c8a0ff',
                                    background: 'rgba(130,80,200,0.2)',
                                    border: '1px solid rgba(130,80,200,0.35)',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '0.25rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    flexShrink: 0,
                                  }}>
                                    {skill.type}
                                  </span>
                                )}
                              </div>
                              {/* Description + status effects */}
                              <div style={{ padding: '0.65rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {skill.description && (
                                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#b8b8b8', lineHeight: 1.7 }}>
                                    {skill.description}
                                  </p>
                                )}
                                {(skill.status_effects ?? []).length > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.2rem' }}>
                                    {skill.status_effects!.map((se, j) => (
                                      <div key={j} style={{
                                        background: 'rgba(100,60,180,0.12)',
                                        border: '1px solid rgba(120,70,200,0.25)',
                                        borderRadius: '0.35rem',
                                        padding: '0.35rem 0.75rem',
                                        display: 'flex',
                                        gap: '0.5rem',
                                        alignItems: 'baseline',
                                        flexWrap: 'wrap',
                                      }}>
                                        <span style={{
                                          fontFamily: 'Unbounded, sans-serif',
                                          fontSize: '0.6rem',
                                          fontWeight: 700,
                                          color: '#c8a0ff',
                                          whiteSpace: 'nowrap',
                                          flexShrink: 0,
                                        }}>
                                          [{se.name}]
                                        </span>
                                        <span style={{ fontSize: '0.82rem', color: '#999', lineHeight: 1.5 }}>
                                          {se.effect}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Top Counters */}
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
