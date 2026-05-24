import { getResolvedHeros, getLegacy, getDataLastUpdated } from '@/src/dcdl/lib/data'
import '../../godforge/game.css'
import { TIER_COLORS } from '@/src/dcdl/components/TierBadge'
import { EntryBadgeGroup } from '@/src/dcdl/components/EntryBadges'

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
  position: 'relative',
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
  const lastUpdated = getDataLastUpdated('heros.json', 'legacy.json')

  return (
    <main>
      <section className="gh-hero" style={{ '--game-accent': '#4f8ef7' } as React.CSSProperties}>
        <div className="container">
          <p className="gh-overline">Tier List</p>
          <h1 className="gh-hero-title">DC: Dark Legion</h1>
          <p className="gh-hero-sub">Quantum&apos;s personal champion and legacy piece rankings across all three role groups.</p>
          <div className="gh-hero-divider" />
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', fontFamily: 'monospace' }}>Updated: {lastUpdated}</span>
            <a href="/games/dc-dark-legion" style={{ fontSize: '0.78rem', color: 'var(--gold)', opacity: 0.85, textDecoration: 'none' }}>← Champion List</a>
          </div>
        </div>
      </section>

      {/* Champion Tier List */}
      <section style={{ padding: '2.5rem 0 2rem' }}>
        <div className="container" style={{ overflowX: 'auto' }}>
          <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.6rem' }}>
            Clicking a champion opens their individual champion landing page.
          </p>
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
                                    style={{ display: 'block', flexShrink: 0, position: 'relative' }}
                                  >
                                    <img
                                      src={hero.imageHeadshot ?? ''}
                                      alt={hero.name}
                                      style={{
                                        width: '5.25rem',
                                        height: '5.25rem',
                                        objectFit: 'cover',
                                        borderRadius: '0.4rem',
                                        border: `2px solid ${tierColor}aa`,
                                        display: 'block',
                                        background: RARITY_BG[hero.rarity] ?? '#111',
                                      }}
                                    />
                                    <EntryBadgeGroup isNew={hero.isNew} isP2W={hero.isP2W} previousTier={hero.previousTier} currentTier={hero.tier ?? ''} size="sm" tierBottom="0" />
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
            <div style={{
              padding: '1.25rem 1.5rem',
              borderTop: GOLD_ROW_BORDER,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2.5rem',
              flexWrap: 'wrap',
            }}>
              <img
                src="/images/site/Q%20GOLD%20FULL%20ICON.png"
                alt="Quantum Game Guides"
                style={{ height: '5rem', objectFit: 'contain' }}
              />
              <img
                src="/dcdl/logos/Game_logo_-_blue_white.png"
                alt="DC: Dark Legion"
                style={{ height: '5rem', objectFit: 'contain' }}
              />
            </div>
            <img
              src="/dcdl/combat-cycle/LaughBatman.png"
              alt=""
              aria-hidden="true"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                height: '100%',
                width: 'auto',
                opacity: 0.1,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
          </div>
        </div>
      </section>

      {/* Legacy Piece Tier List */}
      <section style={{ padding: '0 0 4rem' }}>
        <div className="container" style={{ overflowX: 'auto' }}>
          <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.6rem' }}>
            Clicking a legacy piece opens the{' '}
            <a href="/games/dc-dark-legion/legacy/community-tier" style={{ color: 'var(--gold)' }}>
              Justice League of Discord community voted tier ranking page
            </a>{' '}for that item.
          </p>
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
                                    style={{ display: 'block', flexShrink: 0, position: 'relative' }}
                                  >
                                    <img
                                      src={piece.image ?? ''}
                                      alt={piece.name}
                                      style={{
                                        width: '5.25rem',
                                        height: '5.25rem',
                                        objectFit: 'contain',
                                        borderRadius: '0.4rem',
                                        border: `2px solid ${tierColor}aa`,
                                        display: 'block',
                                        background: '#1a0a3a',
                                      }}
                                    />
                                    <EntryBadgeGroup isNew={piece.isNew} isP2W={piece.isP2W} previousTier={piece.previousTier} currentTier={piece.tier ?? ''} size="sm" tierBottom="0" />
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
            <div style={{
              padding: '1.25rem 1.5rem',
              borderTop: GOLD_ROW_BORDER,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2.5rem',
              flexWrap: 'wrap',
            }}>
              <img
                src="/images/site/Q%20GOLD%20FULL%20ICON.png"
                alt="Quantum Game Guides"
                style={{ height: '5rem', objectFit: 'contain' }}
              />
              <img
                src="/dcdl/logos/Game_logo_-_blue_white.png"
                alt="DC: Dark Legion"
                style={{ height: '5rem', objectFit: 'contain' }}
              />
            </div>
            <img
              src="/dcdl/combat-cycle/LaughBatman.png"
              alt=""
              aria-hidden="true"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '100%',
                width: 'auto',
                opacity: 0.1,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
          </div>
          <p style={{
            marginTop: '0.85rem',
            fontSize: '0.75rem',
            color: '#888',
            fontStyle: 'italic',
          }}>
            <strong style={{ color: '#aaa', fontStyle: 'normal' }}>Note:</strong> This Legacy Piece tier list is a collaboration with Tyvokka.
          </p>
        </div>
      </section>

      {/* Logos Footer */}
      <section style={{ padding: '2.5rem 0 3rem' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
            <img
              src="/images/site/Q%20GOLD%20FULL%20ICON.png"
              alt="Quantum Game Guides"
              style={{ height: '6rem', objectFit: 'contain' }}
            />
            <img
              src="/dcdl/logos/Game_logo_-_blue_white.png"
              alt="DC: Dark Legion"
              style={{ height: '6rem', objectFit: 'contain' }}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
