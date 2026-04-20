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
      borderRadius: '0.5rem',
      overflow: 'hidden',
      border: '1px solid #2a2a2a',
      position: 'relative',
      aspectRatio: '3 / 4',
      background: '#111',
    }}>
      {hunter.portrait
        ? <img src={hunter.portrait} alt={hunter.name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '2rem' }}>?</div>
      }
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(0,0,0,0.55)',
        padding: '0.4rem 0.5rem',
        textAlign: 'center',
      }}>
        <div style={{
          fontWeight: 700,
          fontSize: '0.85rem',
          color: '#e8e8e8',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          lineHeight: 1.25,
        }}>
          {hunter.name}
        </div>
      </div>
    </div>
  )
}
