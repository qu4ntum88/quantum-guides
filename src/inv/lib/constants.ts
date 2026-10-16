// Isomorphic Invokers constants (safe to import from client components).

export const TIERS = ['S+', 'S', 'A+', 'A', 'B', 'C', 'D', 'E'] as const

export const TIER_COLORS: Record<string, string> = {
  'S+': '#FF6EC7',
  S: '#FF415C',
  'A+': '#FA8319',
  A: '#FDCE3B',
  B: '#CB4CDA',
  C: '#43B3ED',
  D: '#39D196',
  E: '#7a7f8c',
}

export const RARITIES = ['Mythical', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'] as const

export const RARITY_COLORS: Record<string, string> = {
  Mythical: '#ff4d6d',
  Legendary: '#f59e0b',
  Epic: '#a855f7',
  Rare: '#3b82f6',
  Uncommon: '#22c55e',
  Common: '#9ca3af',
}

export const ELEMENTS = ['Fire', 'Water', 'Earth', 'Wind', 'Light', 'Dark'] as const
export const CLASSES = ['Melee Attacker', 'Ranged Attacker', 'Support', 'Tank'] as const
export const TITAN_ROLES = ['Damage', 'Tank'] as const

export const INV_BASE = '/games/invokers'
export const unitPath = (kind: string, slug: string) =>
  `${INV_BASE}/${kind === 'Titan' ? 'titans' : 'heroes'}/${slug}`
export const tierListPath = (kind: string, listId?: string | null) =>
  `${INV_BASE}/${kind === 'Titan' ? 'titan' : 'invoker'}-tier-list${listId && listId !== 'overall' ? `/${listId}` : ''}`

export const tierIndex = (t: string | null | undefined) => {
  const i = TIERS.indexOf((t ?? '') as (typeof TIERS)[number])
  return i < 0 ? TIERS.length : i
}
