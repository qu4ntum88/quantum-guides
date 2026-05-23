'use client'
import { useState } from 'react'

export default function StatusEffectTooltip({
  name,
  image,
  description,
}: {
  name: string
  image: string
  description: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <span
      style={{ position: 'relative', display: 'inline' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span style={{
        color: '#f59e0b',
        fontWeight: 600,
        cursor: 'default',
        borderBottom: '1px dashed rgba(245,158,11,0.5)',
      }}>
        {name}
      </span>
      {visible && (
        <span style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          background: '#1a1a1a',
          border: '1px solid rgba(201,160,30,0.5)',
          borderRadius: '0.5rem',
          padding: '0.65rem 0.85rem',
          minWidth: '12rem',
          maxWidth: '18rem',
          pointerEvents: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          display: 'block',
          whiteSpace: 'normal',
        }}>
          <span style={{ display: 'flex', gap: '0.55rem', alignItems: 'center' }}>
            <img src={image} alt={name} style={{ width: '1.75rem', height: '1.75rem', flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', fontFamily: 'Unbounded, sans-serif', color: '#f59e0b', fontWeight: 700, lineHeight: 1.3 }}>
              {name}
            </span>
          </span>
          {description && (
            <span style={{ display: 'block', marginTop: '0.4rem', fontSize: '0.77rem', color: '#aaaaaa', lineHeight: 1.5 }}>
              {description}
            </span>
          )}
        </span>
      )}
    </span>
  )
}
