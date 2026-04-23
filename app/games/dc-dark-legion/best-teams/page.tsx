import { getResolvedHeros } from '@/src/dcdl/lib/data'

type Team = { rank: number; explanation: string; required: string[]; optional: string[] }

function readTeams(): Team[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/src/dcdl/data/best-teams.json') as Team[]
}

const RARITY_BG: Record<string, string> = {
  'Iconic':   '#4a3000',
  'Mythic +': '#3b0a4a',
  'Mythic':   '#1a0a3a',
  'Legendary':'#1a2a10',
  'Epic':     '#0a1a3a',
}

const RANK_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
}

export default function BestTeamsPage() {
  const heroes = getResolvedHeros()
  const heroMap = Object.fromEntries(heroes.map((h) => [h.id, h]))
  const teams = readTeams()
  const filledTeams = teams.filter((t) => t.required.length > 0 || t.optional.length > 0 || t.explanation)

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
          <h1 style={{ color: '#fff', marginBottom: '0.5rem' }}>DC: Dark Legion — Best Teams</h1>
          <p style={{ color: '#cccccc' }}>
            Quantum&apos;s top 10 team compositions ranked by overall effectiveness.
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
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filledTeams.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No teams have been configured yet.</p>
          ) : (
            filledTeams.map((team) => {
              const rankColor = RANK_COLORS[team.rank] ?? 'var(--gold)'
              const requiredHeroes = team.required.map((id) => heroMap[id]).filter(Boolean)
              const optionalHeroes = team.optional.map((id) => heroMap[id]).filter(Boolean)

              return (
                <div
                  key={team.rank}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid #222',
                    borderLeft: `4px solid ${rankColor}`,
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0,
                  }}
                >
                  {/* Header bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem 1.25rem',
                    background: `linear-gradient(90deg, ${rankColor}18 0%, transparent 100%)`,
                    borderBottom: '1px solid #1e1e1e',
                    flexWrap: 'wrap',
                  }}>
                    <span style={{
                      fontFamily: 'Unbounded, sans-serif',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: rankColor,
                      minWidth: '2rem',
                    }}>
                      #{team.rank}
                    </span>
                    {team.explanation && (
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#c0c0c0', lineHeight: 1.6, flex: 1 }}>
                        {team.explanation}
                      </p>
                    )}
                  </div>

                  {/* Champions row */}
                  <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {/* Required */}
                    {requiredHeroes.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.6rem', fontFamily: 'Unbounded, sans-serif', color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          Required
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {requiredHeroes.map((hero) => (
                            <a key={hero.id} href={`/games/dc-dark-legion/heros/${hero.id}`} title={hero.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}>
                              <img
                                src={hero.imageHeadshot ?? ''}
                                alt={hero.name}
                                style={{
                                  width: '5.25rem',
                                  height: '5.25rem',
                                  objectFit: 'cover',
                                  borderRadius: '0.5rem',
                                  border: '2px solid var(--gold)',
                                  background: RARITY_BG[hero.rarity] ?? '#111',
                                  display: 'block',
                                }}
                              />
                              <span style={{ fontSize: '0.6rem', color: '#aaa', textAlign: 'center', maxWidth: '5.25rem', lineHeight: 1.2 }}>
                                {hero.name.split('(')[0].trim()}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    {requiredHeroes.length > 0 && optionalHeroes.length > 0 && (
                      <div style={{ width: '1px', height: '5.25rem', background: '#2a2a2a', flexShrink: 0 }} />
                    )}

                    {/* Optional */}
                    {optionalHeroes.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.6rem', fontFamily: 'Unbounded, sans-serif', color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          Optional
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {optionalHeroes.map((hero) => (
                            <a key={hero.id} href={`/games/dc-dark-legion/heros/${hero.id}`} title={hero.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}>
                              <img
                                src={hero.imageHeadshot ?? ''}
                                alt={hero.name}
                                style={{
                                  width: '3.5rem',
                                  height: '3.5rem',
                                  objectFit: 'cover',
                                  borderRadius: '0.4rem',
                                  border: '2px solid #555',
                                  background: RARITY_BG[hero.rarity] ?? '#111',
                                  display: 'block',
                                }}
                              />
                              <span style={{ fontSize: '0.55rem', color: '#888', textAlign: 'center', maxWidth: '3.5rem', lineHeight: 1.2 }}>
                                {hero.name.split('(')[0].trim()}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>
    </main>
  )
}
