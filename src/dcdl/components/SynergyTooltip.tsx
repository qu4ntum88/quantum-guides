'use client'
import { useState } from 'react'

export default function SynergyTooltip({
  name,
  tagImage,
  descImage,
}: {
  name: string
  tagImage?: string
  descImage?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', cursor: 'default' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {tagImage && <img src={tagImage} alt={name} style={{ width: '2.5rem', flexShrink: 0 }} />}
      <span>{name}</span>
      {visible && descImage && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 10px)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          pointerEvents: 'none',
          background: '#100824',
          border: '1px solid #3a2a5a',
          borderRadius: '0.6rem',
          padding: '0.4rem',
          boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
          whiteSpace: 'nowrap',
        }}>
          <img
            src={descImage}
            alt={name}
            style={{ width: '260px', borderRadius: '0.35rem', display: 'block' }}
          />
        </div>
      )}
    </div>
  )
}
