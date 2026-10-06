import { TIER_COLORS } from '@/src/dcdl/components/TierBadge'

/**
 * Row + column layout for the Tier List view on the champion and legacy pages.
 *
 * Kept free of DCDL data types so the same shape can drive another game's tier
 * view later: a list of rows (each a tier or a catch-all bucket), a list of
 * role-group columns, and a function that says which row an entry sits in.
 * Shared by the on-page <TierView> and the PNG export so they always agree.
 */

export type TierRow = {
  /** Stable id; also what an entry's `row` is matched against. */
  key: string
  /** Text inside the coloured badge ("S+", "F2P"). Keep it to ~3 characters. */
  badge: string
  /** Caption under the badge. */
  label: string
  color: string
  /** Leave the row off the board entirely when nothing lands in it. */
  hideWhenEmpty?: boolean
}

export type TierColumn = { label: string; classes: string[] }

export const RANKED_TIERS = ['S+', 'S', 'A+', 'A', 'B', 'C', 'D'] as const

const TIER_LABELS: Record<string, string> = {
  'S+': 'Universal',
  'S':  'Meta',
  'A+': 'Sub-Meta',
  'A':  'Off-Meta',
  'B':  'Whale',
  'C':  'Skip',
  'D':  'New Player',
}

function rankedRows(labels: Record<string, string>): TierRow[] {
  return RANKED_TIERS.map((t) => ({ key: t, badge: t, label: labels[t] ?? '', color: TIER_COLORS[t] }))
}

/** One column per role group, shared by champions (class) and legacy (role). */
export const TIER_COLUMNS: TierColumn[] = [
  { label: 'Assassin | Firepower | Magical', classes: ['Assassin', 'Firepower', 'Magical'] },
  { label: 'Warrior | Guardian',             classes: ['Warrior', 'Guardian'] },
  { label: 'Supporter | Intimidator',        classes: ['Supporter', 'Intimidator'] },
]

/** Does an entry's class/role string belong in this column? */
export function inColumn(col: TierColumn, group: string): boolean {
  return col.classes.some((c) => group.includes(c))
}

// ── Champions ────────────────────────────────────────────────────────────────

export const CHAMPION_ROWS: TierRow[] = [
  ...rankedRows(TIER_LABELS),
  // Champions Quantum no longer ranks, kept on the board so the page still
  // lists every champion.
  { key: 'HR', badge: 'HR', label: 'Historical Reference', color: '#64748b' },
]

export function championRow(hero: { tier?: string | null }): string {
  return hero.tier && (RANKED_TIERS as readonly string[]).includes(hero.tier) ? hero.tier : 'HR'
}

// ── Legacy pieces ────────────────────────────────────────────────────────────

export const LEGACY_ROWS: TierRow[] = [
  // The legacy D row is where the late-game Mythic pieces sit.
  ...rankedRows({ ...TIER_LABELS, D: 'Late Game Mythics' }),
  { key: 'F2P', badge: 'F2P', label: 'F2P', color: '#22c55e' },
  { key: 'NP',  badge: 'NP',  label: 'New Players', color: '#a855f7' },
  // Safety net for an unranked Mythic + / Iconic piece, which has no bracket.
  { key: 'UR',  badge: '—',   label: 'Unranked', color: '#64748b', hideWhenEmpty: true },
]

/**
 * Ranked pieces sit in their tier. Unranked ones are bracket recommendations:
 * every Epic is a New Player piece, and Legendaries plus any Mythic not already
 * ranked are the F2P bracket. Derived rather than listed, so ranking a piece in
 * the Studio moves it out of its bracket and into the table automatically.
 */
export function legacyRow(piece: { tier?: string | null; rank?: string | null }): string {
  if (piece.tier && (RANKED_TIERS as readonly string[]).includes(piece.tier)) return piece.tier
  if (piece.rank === 'Epic') return 'NP'
  if (piece.rank === 'Legendary' || piece.rank === 'Mythic') return 'F2P'
  return 'UR'
}

export const LEGACY_TITLE = "Quantum & Tyvokka's Legacy Piece Tier List"
export const CHAMPION_TITLE = 'All Purpose Champion Tier List'
