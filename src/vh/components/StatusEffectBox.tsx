'use client'

export type StatusEffect = {
  id: string
  name: string
  image: string
  description: string
}

export default function StatusEffectBox({ effect }: { effect: StatusEffect }) {
  return (
    <div
      title={effect.description || undefined}
      style={{
        background: 'var(--light-bg)',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        border: '1px solid #2a2a2a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0.5rem',
        gap: '0.35rem',
        cursor: effect.description ? 'help' : 'default',
      }}
    >
      <div style={{ width: '100%', aspectRatio: '1 / 1', background: '#111', borderRadius: '0.375rem', overflow: 'hidden' }}>
        {effect.image
          ? <img src={effect.image} alt={effect.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '1.5rem' }}>?</div>
        }
      </div>
      <div style={{ fontWeight: 600, fontSize: '0.7rem', color: '#e8e8e8', textAlign: 'center', lineHeight: 1.25 }}>
        {effect.name}
      </div>
    </div>
  )
}
