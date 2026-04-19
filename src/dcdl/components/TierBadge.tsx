export const TIER_COLORS: Record<string, string> = {
  'S+': '#FF6EC7',
  S: '#FF415C',
  'A+': '#FA8319',
  A: '#FDCE3B',
  B: '#CB4CDA',
  C: '#43B3ED',
  D: '#39D196',
}

export default function TierBadge({ tier }: { tier?: string | null }) {
  if (!tier) {
    return (
      <div style={{
        width: '3rem', height: '3rem', borderRadius: '50%',
        background: '#333', border: '2px solid #555',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#666', fontSize: '1rem', flexShrink: 0,
      }}>—</div>
    )
  }
  const color = TIER_COLORS[tier] ?? '#888'
  return (
    <div style={{
      width: '3rem', height: '3rem', borderRadius: '50%',
      background: color, border: '2px solid rgba(255,255,255,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontFamily: 'Unbounded, sans-serif',
      fontSize: tier.length > 1 ? '0.7rem' : '1rem',
      fontWeight: 700, flexShrink: 0, letterSpacing: '-0.01em',
      textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
    }}>
      {tier}
    </div>
  )
}
