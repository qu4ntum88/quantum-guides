'use client'
import { useState, useRef } from 'react'

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
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)

  const handleEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setCoords({ top: rect.top, left: rect.left + rect.width / 2 })
    }
    setVisible(true)
  }

  return (
    <div
      ref={ref}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', cursor: 'default' }}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setVisible(false)}
    >
      {tagImage && <img src={tagImage} alt={name} style={{ width: '2.5rem', flexShrink: 0 }} />}
      <span>{name}</span>
      {visible && descImage && (
        <div style={{
          position: 'fixed',
          top: coords.top,
          left: coords.left,
          transform: 'translate(-50%, -100%) translateY(-12px)',
          zIndex: 9999,
          pointerEvents: 'none',
          background: '#100824',
          border: '1px solid #3a2a5a',
          borderRadius: '0.75rem',
          padding: '0.5rem',
          boxShadow: '0 16px 48px rgba(0,0,0,0.85)',
        }}>
          <img
            src={descImage}
            alt={name}
            style={{ width: '480px', maxWidth: '85vw', borderRadius: '0.5rem', display: 'block' }}
          />
        </div>
      )}
    </div>
  )
}
