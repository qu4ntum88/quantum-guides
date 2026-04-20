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

export default function HunterBox({ hunter }: { hunter: Hunter }) {
  return (
    <div style={{
      background: 'var(--light-bg)',
      borderRadius: '0.5rem',
      overflow: 'hidden',
      border: '1px solid #2a2a2a',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ aspectRatio: '1 / 1', background: '#111', overflow: 'hidden' }}>
        {hunter.portrait
          ? <img src={hunter.portrait} alt={hunter.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '2rem' }}>?</div>
        }
      </div>
      <div style={{ padding: '0.4rem 0.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#e8e8e8', lineHeight: 1.25 }}>{hunter.name}</div>
      </div>
    </div>
  )
}
