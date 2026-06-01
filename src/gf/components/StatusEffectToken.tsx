'use client'

import { useState } from 'react'
import type { StatusEffect } from '../lib/statusEffects'
import { EFFECT_COLOR } from '../lib/statusEffects'

export function StatusEffectToken({ effect }: { effect: StatusEffect }) {
  const [open, setOpen] = useState(false)
  const color = EFFECT_COLOR[effect.category]

  return (
    <span
      style={{ position: 'relative', display: 'inline' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span style={{
        color,
        fontWeight: 600,
        cursor: 'help',
        borderBottom: `1px dotted ${color}`,
      }}>
        [{effect.name}]
      </span>
      {open && (
        <span style={{
          position: 'absolute',
          bottom: 'calc(100% + 4px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a1a1a',
          border: `1px solid ${color}55`,
          borderRadius: '0.5rem',
          padding: '0.55rem 0.75rem',
          minWidth: '11rem',
          maxWidth: '15rem',
          zIndex: 200,
          pointerEvents: 'none',
          display: 'inline-flex',
          flexDirection: 'column',
          gap: '0.35rem',
          whiteSpace: 'normal',
          boxShadow: `0 4px 20px rgba(0,0,0,0.7)`,
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            {effect.image && (
              <img src={effect.image} alt="" style={{ width: '1.4rem', height: '1.4rem', objectFit: 'contain', flexShrink: 0 }} />
            )}
            <span style={{ color, fontWeight: 700, fontSize: '0.78rem' }}>{effect.name}</span>
          </span>
          {effect.description && (
            <span style={{ color: '#aaa', fontSize: '0.7rem', lineHeight: 1.45 }}>{effect.description}</span>
          )}
        </span>
      )}
    </span>
  )
}
