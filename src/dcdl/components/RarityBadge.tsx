export const RARITIES = ['Iconic', 'Mythic +', 'Mythic', 'Legendary', 'Epic'] as const

export const RARITY_STYLE: Record<string, { background: string; boxShadow?: string }> = {
  'Iconic': {
    background: 'linear-gradient(105deg, #009a9a 0%, #70FFFF 30%, #e0ffff 48%, #70FFFF 66%, #009a9a 100%)',
    boxShadow: '0 0 12px rgba(112,255,255,0.55), inset 0 1px 0 rgba(255,255,255,0.25)',
  },
  'Mythic +': {
    background: 'linear-gradient(105deg, #c0003a 0%, #FF4B6A 30%, #ffb3c0 48%, #FF4B6A 66%, #c0003a 100%)',
    boxShadow: '0 0 12px rgba(255,75,106,0.55), inset 0 1px 0 rgba(255,255,255,0.25)',
  },
  'Mythic':    { background: '#FF4B6A' },
  'Legendary': { background: '#FFCC00' },
  'Epic':      { background: '#E873FF' },
}

export default function RarityBadge({ rarity }: { rarity: string }) {
  const s = RARITY_STYLE[rarity] ?? { background: '#555' }
  return (
    <span style={{
      ...s,
      color: 'white',
      padding: '0.3rem 0.85rem',
      borderRadius: '0.4rem',
      fontFamily: 'Unbounded, sans-serif',
      fontSize: '0.75rem',
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase' as const,
      whiteSpace: 'nowrap' as const,
      flexShrink: 0,
      textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
    }}>
      {rarity}
    </span>
  )
}
