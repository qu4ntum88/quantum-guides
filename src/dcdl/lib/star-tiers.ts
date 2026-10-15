// DCDL star tiers: stars 1–25 run in five colour bands of five (White, Blue, Purple,
// Yellow, Red); star 0 is the unlock. Labels come from the game-data export, e.g. "3★ Blue".

export const STAR_TIERS = [
  { name: 'White', color: '#e5e7eb' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Purple', color: '#a855f7' },
  { name: 'Yellow', color: '#f59e0b' },
  { name: 'Red', color: '#ef4444' },
] as const

export const UNLOCK_COLOR = '#94a3b8'

/** Colour for a label like "3★ Blue" / "Unlock". */
export function starLabelColor(label: string): string {
  const tier = STAR_TIERS.find((t) => label.endsWith(t.name))
  return tier ? tier.color : UNLOCK_COLOR
}

/** "3★ Blue" -> { star: 3, tier: 'Blue' }; "Unlock" -> { star: 0, tier: null }. */
export function parseStarLabel(label: string): { star: number; tier: string | null } {
  const m = label.match(/^(\d)★\s+(\w+)$/)
  return m ? { star: Number(m[1]), tier: m[2] } : { star: 0, tier: null }
}
