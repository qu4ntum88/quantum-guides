import type { Legacy } from '@/src/dcdl/lib/data'

/**
 * The three "hand of cards" panels under the legacy tier table.
 *
 * Mythic / Legendary / Epic pieces are deliberately left off the ranked table —
 * they are bracket recommendations rather than competitive rankings — so rather
 * than dropping them from the page entirely each rank gets a small fanned
 * display of a few representative pieces.
 *
 * `buildShowcases` is the single source of truth for what each panel contains,
 * so the page and the PNG export always agree.
 */

/** How many cards make up a hand. More than this reads as a pile, not a fan. */
export const FAN_LIMIT = 5

/** Widest angle from centre, in degrees. The hand splays between ±this. */
const FAN_SPREAD = 21

// Mythic and Legendary deliberately share a heading — the rank pill under it is
// what separates the two panels.
const BRACKETS = [
  { rank: 'Mythic',    title: 'Starter',    accent: '#e0457b', bg: '#3a0014' },
  { rank: 'Legendary', title: 'Starter',    accent: '#c9a01e', bg: '#3a2d00' },
  { rank: 'Epic',      title: 'New Player', accent: '#a855f7', bg: '#2e0038' },
] as const

export type ShowcaseCard = { id: string; name: string; img: string | null }

export type Showcase = {
  rank: string
  title: string
  accent: string
  bg: string
  total: number
  cards: ShowcaseCard[]
}

/** Untiered pieces of each rank, trimmed to a hand. Empty brackets drop out. */
export function buildShowcases(pieces: Legacy[]): Showcase[] {
  return BRACKETS.map((bracket) => {
    const pool = pieces.filter((p) => !p.tier && p.rank === bracket.rank)
    return {
      ...bracket,
      total: pool.length,
      cards: pool.slice(0, FAN_LIMIT).map((p) => ({
        id: p.id,
        name: p.name,
        img: p.image ?? null,
      })),
    }
  }).filter((s) => s.cards.length > 0)
}

/** Even spread around centre; a single card sits upright. */
export function fanAngle(index: number, count: number): number {
  if (count < 2) return 0
  return -FAN_SPREAD + (index * (FAN_SPREAD * 2)) / (count - 1)
}

export default function LegacyShowcase({ showcases }: { showcases: Showcase[] }) {
  if (showcases.length === 0) return null

  return (
    <div className="lsc-wrap">
      {showcases.map((showcase) => (
        <div
          key={showcase.rank}
          className="lsc-panel"
          style={{ '--lsc-accent': showcase.accent, '--lsc-bg': showcase.bg } as React.CSSProperties}
        >
          <h3 className="lsc-title">{showcase.title}</h3>
          <span className="lsc-rank">{showcase.rank}</span>

          <div className="lsc-fan">
            {showcase.cards.map((card, i) => (
              <a
                key={card.id}
                href={`/games/dc-dark-legion/legacy/${card.id}`}
                className="lsc-card"
                title={card.name}
                style={{
                  '--a': `${fanAngle(i, showcase.cards.length)}deg`,
                  zIndex: i + 1,
                } as React.CSSProperties}
              >
                <span className="lsc-face">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.img ?? ''} alt={card.name} />
                  <span className="lsc-name">{card.name}</span>
                </span>
              </a>
            ))}
          </div>

          {showcase.total > showcase.cards.length && (
            <span className="lsc-more">+{showcase.total - showcase.cards.length} more</span>
          )}
        </div>
      ))}
    </div>
  )
}
