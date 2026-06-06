'use client'

import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { StatusEffect } from '../lib/statusEffects'
import { EFFECT_COLOR } from '../lib/statusEffects'

const TOOLTIP_W = 220

export function StatusEffectToken({ effect }: { effect: StatusEffect }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const ref = useRef<HTMLSpanElement>(null)
  const color = EFFECT_COLOR[effect.category]

  const show = useCallback(() => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    // Clamp x so the tooltip never bleeds off screen
    const x = Math.max(
      TOOLTIP_W / 2 + 8,
      Math.min(window.innerWidth - TOOLTIP_W / 2 - 8, r.left + r.width / 2)
    )
    setPos({ x, y: r.top })
  }, [])

  return (
    <span
      ref={ref}
      style={{ position: 'relative', display: 'inline' }}
      onMouseEnter={show}
      onMouseLeave={() => setPos(null)}
    >
      <span style={{ color, fontWeight: 600, cursor: 'help', borderBottom: `1px dotted ${color}` }}>
        [{effect.name}]
      </span>
      {pos && createPortal(
        <span style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y - 8,
          transform: 'translateX(-50%) translateY(-100%)',
          background: '#1a1a1a',
          border: `1px solid ${color}55`,
          borderRadius: '0.5rem',
          padding: '0.55rem 0.75rem',
          width: `${TOOLTIP_W}px`,
          zIndex: 9999,
          pointerEvents: 'none',
          display: 'inline-flex',
          flexDirection: 'column',
          gap: '0.35rem',
          whiteSpace: 'normal',
          boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
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
        </span>,
        document.body
      )}
    </span>
  )
}
