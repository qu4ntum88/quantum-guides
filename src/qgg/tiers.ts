// Cross-game tier vocabulary. Every game's board uses the same tier colours, so a
// Quantum tier list reads the same whether it's Godforge, Invokers or Void Hunters.

export const TIER_COLORS: Record<string, string> = {
  'S+': '#FF6EC7',
  S: '#FF415C',
  'A+': '#FA8319',
  A: '#FDCE3B',
  B: '#CB4CDA',
  C: '#43B3ED',
  D: '#39D196',
  E: '#7a7f8c',
  F: '#6b6f78',
}

/** Godforge and Void Hunters: Quantum's own lists (no S+, an F floor). */
export const QUANTUM_TIERS = ['S', 'A+', 'A', 'B', 'C', 'D', 'F'] as const

/** Starting tier from rarity, until Quantum re-ranks a unit. A+ and F start empty. */
export const RARITY_SEED_TIER: Record<string, string> = {
  Legendary: 'S',
  Epic: 'A',
  Rare: 'B',
  Uncommon: 'C',
  Common: 'D',
}

export const RARITY_COLORS: Record<string, string> = {
  Mythical: '#ff4d6d',
  Legendary: '#f59e0b',
  Epic: '#a855f7',
  Rare: '#3b82f6',
  Uncommon: '#22c55e',
  Common: '#9ca3af',
}

export const RARITY_ORDER = ['Mythical', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common']

export interface BoardRow {
  tier: string
  groups: { role: string; members: string[] }[]
}

/** Board rows from per-entity tiers, in array order within each tier. */
export function rowsFromTiers(
  entities: { id: string; group: string | null; tier: string | null | undefined }[],
  tiers: readonly string[],
  columns: readonly string[],
): BoardRow[] {
  return tiers.map((tier) => ({
    tier,
    groups: columns.map((role) => ({
      role,
      members: entities.filter((e) => e.tier === tier && e.group === role).map((e) => e.id),
    })),
  }))
}
