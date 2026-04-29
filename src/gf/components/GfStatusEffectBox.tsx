'use client'

import { useState } from 'react'

export type GfStatusEffect = {
  id: string
  name: string
  category: 'buff' | 'debuff' | 'disable'
  image: string
  description: string
}

const CATEGORY_COLORS: Record<string, string> = {
  buff: '#166534',
  debuff: '#7f1d1d',
  disable: '#1e3a5f',
}

export default function GfStatusEffectBox({ effect }: { effect: GfStatusEffect }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          background: 'var(--light-bg)',
          borderRadius: '0.5rem',
          overflow: 'visible',
          border: `1px solid ${CATEGORY_COLORS[effect.category] ?? '#2a2a2a'}`,
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
        <div style={{ fontWeight: 600, fontSize: '0.65rem', color: '#e8e8e8', textAlign: 'center', lineHeight: 1.25 }}>
          {effect.name}
        </div>
      </div>

      {/* Tooltip */}
      {hovered && effect.description && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1a1a1a',
            border: '1px solid #444',
            borderRadius: '0.5rem',
            padding: '0.6rem 0.75rem',
            fontSize: '0.75rem',
            color: '#e8e8e8',
            lineHeight: 1.5,
            width: '14rem',
            maxWidth: '90vw',
            zIndex: 100,
            pointerEvents: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.7)',
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--gold, #cca453)', marginBottom: '0.3rem', fontSize: '0.78rem' }}>
            {effect.name}
          </div>
          {effect.description}
        </div>
      )}
    </div>
  )
}
