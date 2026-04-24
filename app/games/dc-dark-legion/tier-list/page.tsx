import { getResolvedHeros, getLegacy } from '@/src/dcdl/lib/data'
import { TIER_COLORS } from '@/src/dcdl/components/TierBadge'

const RARITY_BG: Record<string, string> = {
  'Iconic':   '#00292a',
  'Mythic +': '#3a000f',
  'Mythic':   '#3a0014',
  'Legendary':'#3a2d00',
  'Epic':     '#2e0038',
}

const TIERS = ['S+', 'S', 'A+', 'A', 'B', 'C', 'D'] as const

const TIER_LABELS: Record<string, string> = {
  'S+': 'Elite Meta',
  'S':  'Must Build',
  'A+': 'Must Build',
  'A':  'Niche',
  'B':  'Situational',
  'C':  'Starter',
  'D':  'New Player',
}

const COLUMNS: { label: string; classes: string[] }[] = [
  { label: 'Assassin | Firepower | Magical', classes: ['Assassin', 'Firepower', 'Magical'] },
  { label: 'Warrior | Guardian',             classes: ['Warrior', 'Guardian'] },
  { label: 'Supporter | Intimidator',        classes: ['Supporter', 'Intimidator'] },
]

const GOLD = '#c9a01e'
const GOLD_BORDER = `2px solid ${GOLD}55`
const GOLD_ROW_BORDER = `2px solid ${GOLD}40`
const CONTAINER_BG = '#120834'

const tableCard: React.CSSProperties = {
  background: CONTAINER_BG,
  border: `2px solid ${GOLD}88`,
  borderRadius: '0.875rem',
  overflow: 'hidden',
}

function TableTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '1.25rem 1.5rem 1rem',
      borderBottom: GOLD_ROW_BORDER,
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: 'Unbounded, sans-serif',
        fontSize: 'clamp(1rem, 3vw, 1.6rem)',
        fontWeight: 900,
        color: GOLD,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        lineHeight: 1.2,
        textShadow: `0 0 24px ${GOLD}55`,
      }}>
        {children}
      </div>
    </div>
  )
}

function TierCell({ tier }: { tier: string }) {
  const color = TIER_COLORS[tier] ?? '#888'
  const label = TIER_LABELS[tier] ?? ''
  return (
    <td style={{
      padding: '0.5rem 0.6rem',
      verticalAlign: 'middle',
      textAlign: 'center',
      width: '5.5rem',
      minWidth: '5.5rem',
    }}>
      <div style={{
        width: '3.25rem',
        height: '3.25rem',
        borderRadius: '0.45rem',
        background: color,
        border: '2px solid rgba(255,255,255,0.9)',
        boxShadow: `0 2px 10px ${color}66`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'Unbounded, sans-serif',
        fontSize: '1.25rem',
        fontWeight: 900,
        letterSpacing: '-0.02em',
        textShadow: '-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000',
        margin: '0 auto 0.35rem',
        flexShrink: 0,
      }}>
        {tier}
      </div>
      <div style={{
        fontSize: '0.45rem',
        fontFamily: 'Unbounded, sans-serif',
        fontWeight: 600,
        color: `${color}cc`,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        lineHeight: 1.2,
        textAlign: 'center',
      }}>
        {label}
      </div>
    </td>
  )
}

function ColHeader({ col }: { col: typeof COLUMNS[number] }) {
  return (
    <th style={{ padding: '0.75rem 0.5rem', verticalAlign: 'bottom', borderLeft: GOLD_BORDER }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
        {col.classes.map((cls) => (
          <img
            key={cls}
            src={`/dcdl/role_images/${cls}.png`}
            alt={cls}
            title={cls}
            style={{ width: '1.75rem', height: '1.75rem', objectFit: 'contain' }}
          />
        ))}
      </div>
      <div style={{
        fontFamily: 'Unbounded, sans-serif',
        fontSize: '0.55rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: GOLD,
        textAlign: 'center',
      }}>
        {col.label}
      </div>
    </th>
  )
}

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
            Quantum&apos;s personal champion and legacy piece rankings across all three role groups.
          </p>
          <a
            href="/games/dc-dark-legion"
            style={{ color: 'var(--gold)', fontSize: '0.85rem', display: 'inline-block', marginTop: '0.75rem' }}
          >
            ← Back to Champion List
          </a>
        </div>
      </section>

      {/* Champion Tier List */}
      <section style={{ padding: '2.5rem 0 2rem' }}>
        <div className="container" style={{ overflowX: 'auto' }}>
          <div style={{ ...tableCard, minWidth: '600px' }}>
            <TableTitle>All Purpose Champion Tier List</TableTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: GOLD_ROW_BORDER }}>
                  <th style={{ width: '5.5rem', padding: '0.5rem' }} />
                  {COLUMNS.map((col) => <ColHeader key={col.label} col={col} />)}
                </tr>
              </thead>
              <tbody>
                {TIERS.map((tier) => {
                  const tierColor = TIER_COLORS[tier] ?? '#888'
                  return (
                    <tr key={tier} style={{ borderTop: GOLD_ROW_BORDER }}>
                      <TierCell tier={tier} />
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
                              background: `${tierColor}12`,
                              borderLeft: GOLD_BORDER,
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
                                        border: `2px solid ${tierColor}aa`,
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
        </div>
      </section>

      {/* Legacy Piece Tier List */}
      <section style={{ padding: '0 0 4rem' }}>
        <div className="container" style={{ overflowX: 'auto' }}>
          <div style={{ ...tableCard, minWidth: '600px' }}>
            <TableTitle>Legacy Piece Tier List</TableTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: GOLD_ROW_BORDER }}>
                  <th style={{ width: '5.5rem', padding: '0.5rem' }} />
                  {COLUMNS.map((col) => <ColHeader key={col.label} col={col} />)}
                </tr>
              </thead>
              <tbody>
                {TIERS.map((tier) => {
                  const tierColor = TIER_COLORS[tier] ?? '#888'
                  return (
                    <tr key={tier} style={{ borderTop: GOLD_ROW_BORDER }}>
                      <TierCell tier={tier} />
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
                              background: `${tierColor}12`,
                              borderLeft: GOLD_BORDER,
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
                                    style={{ display: 'block', flexShrink: 0 }}
                                  >
                                    <img
                                      src={piece.image ?? ''}
                                      alt={piece.name}
                                      style={{
                                        width: '3.5rem',
                                        height: '3.5rem',
                                        objectFit: 'contain',
                                        borderRadius: '0.4rem',
                                        border: `2px solid ${tierColor}aa`,
                                        display: 'block',
                                        background: '#1a0a3a',
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
