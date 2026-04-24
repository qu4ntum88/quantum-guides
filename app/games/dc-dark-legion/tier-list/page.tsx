import { getResolvedHeros, getLegacy } from '@/src/dcdl/lib/data'
import { TIER_COLORS } from '@/src/dcdl/components/TierBadge'

// Dark tints matching the game's rarity palette (Iconic=teal, Mythic+=red, Mythic=pink-red, Legendary=gold, Epic=purple)
const RARITY_BG: Record<string, string> = {
  'Iconic':   '#00292a',
  'Mythic +': '#3a000f',
  'Mythic':   '#3a0014',
  'Legendary':'#3a2d00',
  'Epic':     '#2e0038',
}

const TIERS = ['S+', 'S', 'A+', 'A', 'B', 'C', 'D'] as const

const COLUMNS: { label: string; classes: string[] }[] = [
  { label: 'Assassin | Firepower | Magical', classes: ['Assassin', 'Firepower', 'Magical'] },
  { label: 'Warrior | Guardian',             classes: ['Warrior', 'Guardian'] },
  { label: 'Supporter | Intimidator',        classes: ['Supporter', 'Intimidator'] },
]

export default function TierListPage() {
  const heroes = getResolvedHeros()
  const legacyPieces = getLegacy()

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
          <h1 style={{ color: '#fff', marginBottom: '0.5rem' }}>DC: Dark Legion — Tier List</h1>
          <p style={{ color: '#cccccc' }}>
            Quantum&apos;s personal champion rankings across all three role groups.
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
        <div className="container" style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '600px',
          }}>
            {/* Column headers */}
            <thead>
              <tr>
                {/* Empty corner cell */}
                <th style={{ width: '5rem', padding: '0.5rem' }} />
                {COLUMNS.map((col) => (
                  <th key={col.label} style={{ padding: '0.75rem 1rem', verticalAlign: 'bottom' }}>
                    {/* Class icons */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      {col.classes.map((cls) => (
                        <img
                          key={cls}
                          src={`/dcdl/role_images/${cls}.png`}
                          alt={cls}
                          title={cls}
                          style={{ width: '2rem', height: '2rem', objectFit: 'contain' }}
                        />
                      ))}
                    </div>
                    <div style={{
                      fontFamily: 'Unbounded, sans-serif',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: 'var(--gold)',
                      textAlign: 'center',
                    }}>
                      {col.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {TIERS.map((tier) => {
                const tierColor = TIER_COLORS[tier] ?? '#888'
                return (
                  <tr
                    key={tier}
                    style={{ borderTop: '1px solid #1e1e1e' }}
                  >
                    {/* Tier row header */}
                    <td style={{ padding: '0.75rem 0.5rem', verticalAlign: 'middle', textAlign: 'center' }}>
                      <div style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '50%',
                        background: tierColor,
                        border: '2px solid rgba(255,255,255,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontFamily: 'Unbounded, sans-serif',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        textShadow: '-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000',
                        margin: '0 auto',
                        flexShrink: 0,
                      }}>
                        {tier}
                      </div>
                    </td>

                    {/* Champion cells per column group */}
                    {COLUMNS.map((col) => {
                      const cell = heroes.filter(
                        (h) => h.tier === tier && col.classes.includes(h.class)
                      )
                      return (
                        <td
                          key={col.label}
                          style={{
                            padding: '0.6rem 0.75rem',
                            verticalAlign: 'middle',
                            background: `${tierColor}0d`,
                            borderLeft: '1px solid #1e1e1e',
                          }}
                        >
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center' }}>
                            {cell.length === 0 ? (
                              <span style={{ color: '#333', fontSize: '0.75rem', fontStyle: 'italic' }}>—</span>
                            ) : (
                              cell.map((hero) => (
                                <a
                                  key={hero.id}
                                  href={`/games/dc-dark-legion/heros/${hero.id}`}
                                  title={hero.name}
                                  style={{ display: 'block', flexShrink: 0 }}
                                >
                                  <img
                                    src={hero.imageHeadshot ?? ''}
                                    alt={hero.name}
                                    style={{
                                      width: '3.5rem',
                                      height: '3.5rem',
                                      objectFit: 'cover',
                                      borderRadius: '0.4rem',
                                      border: `2px solid ${tierColor}88`,
                                      display: 'block',
                                      background: RARITY_BG[hero.rarity] ?? '#111',
                                    }}
                                  />
                                </a>
                              ))
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Legacy Piece Tier List */}
      <section style={{ padding: '0 0 4rem' }}>
        <div className="container">
          <h2 style={{
            fontFamily: 'Unbounded, sans-serif',
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--gold)',
            marginBottom: '1.25rem',
            letterSpacing: '0.04em',
          }}>
            Legacy Piece Tier List
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr>
                  <th style={{ width: '5rem', padding: '0.5rem' }} />
                  {COLUMNS.map((col) => (
                    <th key={col.label} style={{ padding: '0.75rem 1rem', verticalAlign: 'bottom' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        {col.classes.map((cls) => (
                          <img
                            key={cls}
                            src={`/dcdl/role_images/${cls}.png`}
                            alt={cls}
                            title={cls}
                            style={{ width: '2rem', height: '2rem', objectFit: 'contain' }}
                          />
                        ))}
                      </div>
                      <div style={{
                        fontFamily: 'Unbounded, sans-serif',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: 'var(--gold)',
                        textAlign: 'center',
                      }}>
                        {col.label}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIERS.map((tier) => {
                  const tierColor = TIER_COLORS[tier] ?? '#888'
                  return (
                    <tr key={tier} style={{ borderTop: '1px solid #1e1e1e' }}>
                      <td style={{ padding: '0.75rem 0.5rem', verticalAlign: 'middle', textAlign: 'center' }}>
                        <div style={{
                          width: '3rem',
                          height: '3rem',
                          borderRadius: '50%',
                          background: tierColor,
                          border: '2px solid rgba(255,255,255,0.85)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontFamily: 'Unbounded, sans-serif',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          letterSpacing: '-0.02em',
                          textShadow: '-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000',
                          margin: '0 auto',
                          flexShrink: 0,
                        }}>
                          {tier}
                        </div>
                      </td>
                      {COLUMNS.map((col) => {
                        const cell = legacyPieces.filter(
                          (l) => l.tier === tier && col.classes.some((cls) => (l.role ?? '').includes(cls))
                        )
                        return (
                          <td
                            key={col.label}
                            style={{
                              padding: '0.6rem 0.75rem',
                              verticalAlign: 'middle',
                              background: `${tierColor}0d`,
                              borderLeft: '1px solid #1e1e1e',
                            }}
                          >
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center' }}>
                              {cell.length === 0 ? (
                                <span style={{ color: '#333', fontSize: '0.75rem', fontStyle: 'italic' }}>—</span>
                              ) : (
                                cell.map((piece) => (
                                  <a
                                    key={piece.id}
                                    href={`/games/dc-dark-legion/legacy/${piece.id}`}
                                    title={piece.name}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}
                                  >
                                    <img
                                      src={piece.image ?? ''}
                                      alt={piece.name}
                                      style={{
                                        width: '3.5rem',
                                        height: '3.5rem',
                                        objectFit: 'contain',
                                        borderRadius: '0.4rem',
                                        border: `2px solid ${tierColor}88`,
                                        display: 'block',
                                        background: '#111',
                                      }}
                                    />
                                  </a>
                                ))
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  )
}
