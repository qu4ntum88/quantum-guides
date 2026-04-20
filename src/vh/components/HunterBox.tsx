'use client'

export type Hunter = {
  id: string
  name: string
  portrait: string
  class: string
  homeland: string
  species: string
  other: string[]
}

const CLASS_COLORS: Record<string, string> = {
  Attacker: '#e05252',
  Balanced: '#c0a030',
  Support:  '#52a0e0',
  Tank:     '#7a7a7a',
}

export default function HunterBox({ hunter }: { hunter: Hunter }) {
  const color = CLASS_COLORS[hunter.class] ?? '#555'
  return (
    <div style={{
      background: 'var(--light-bg)',
      borderRadius: '0.5rem',
      overflow: 'hidden',
      border: '1px solid #2a2a2a',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: '#111', overflow: 'hidden' }}>
        {hunter.portrait
          ? <img src={hunter.portrait} alt={hunter.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '2rem' }}>?</div>
        }
        {hunter.class && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: `${color}cc`,
            padding: '0.2rem 0.4rem',
            fontFamily: 'Unbounded, sans-serif',
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#fff',
            textAlign: 'center',
            textShadow: '-1px -1px 0 #000, 1px 1px 0 #000',
          }}>
            {hunter.class}
          </div>
        )}
      </div>
      <div style={{ padding: '0.4rem 0.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#e8e8e8', lineHeight: 1.25 }}>{hunter.name}</div>
        {(hunter.homeland || hunter.species) && (
          <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '0.15rem' }}>
            {[hunter.homeland, hunter.species].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
    </div>
  )
}
