'use client'
import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const GAP = 6
const EDGE = 8

/** An effect name in skill text; hover (or tap) shows its icon and description. The popup is
 *  portalled to <body> with fixed positioning, so skill cards with overflow:hidden can't clip it,
 *  and it is kept inside the window: above the word, or below when there isn't room. */
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
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const anchor = useRef<HTMLSpanElement>(null)
  const popup = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    if (!visible || !anchor.current || !popup.current) { setPos(null); return }
    const a = anchor.current.getBoundingClientRect()
    const p = popup.current.getBoundingClientRect()
    const above = a.top - GAP - p.height
    const top = above >= EDGE ? above : a.bottom + GAP
    const left = Math.min(Math.max(a.left + a.width / 2 - p.width / 2, EDGE), window.innerWidth - p.width - EDGE)
    setPos({ top, left })
  }, [visible])

  // A tap opens it on touch screens; scrolling or tapping elsewhere closes it.
  useLayoutEffect(() => {
    if (!visible) return
    const close = (e: Event) => { if (!anchor.current?.contains(e.target as Node)) setVisible(false) }
    const hide = () => setVisible(false)
    document.addEventListener('pointerdown', close)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    return () => {
      document.removeEventListener('pointerdown', close)
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    }
  }, [visible])

  return (
    <span
      ref={anchor}
      style={{ display: 'inline' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={() => setVisible(true)}
    >
      <span style={{
        color: '#f59e0b',
        fontWeight: 600,
        cursor: 'default',
        borderBottom: '1px dashed rgba(245,158,11,0.5)',
      }}>
        {name}
      </span>
      {visible && createPortal(
        <span ref={popup} role="tooltip" style={{
          position: 'fixed',
          top: pos?.top ?? 0,
          left: pos?.left ?? 0,
          visibility: pos ? 'visible' : 'hidden',
          zIndex: 1000,
          background: '#1a1a1a',
          border: '1px solid rgba(201,160,30,0.5)',
          borderRadius: '0.5rem',
          padding: '0.65rem 0.85rem',
          width: 'max-content',
          minWidth: '12rem',
          maxWidth: `min(18rem, calc(100vw - ${EDGE * 2}px))`,
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
            <span style={{ display: 'block', marginTop: '0.4rem', fontSize: '0.77rem', color: '#aaaaaa', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
              {description}
            </span>
          )}
        </span>,
        document.body,
      )}
    </span>
  )
}
