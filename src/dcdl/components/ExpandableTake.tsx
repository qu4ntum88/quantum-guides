'use client'

// Clamps a long Quantum's Take to a preview with a fade and a "Read full take" toggle.
// Short takes that already fit render as-is with no button. The full text always stays
// in the DOM (only visually clipped), so search engines and screen readers get all of it.

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import './expandable-take.css'

export default function ExpandableTake({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  const [open, setOpen] = useState(false)
  const [overflows, setOverflows] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Compare against the clamped height; a small slack avoids a button that reveals one line.
    const check = () => setOverflows(el.scrollHeight > el.clientHeight + 24)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const clamped = !open
  return (
    <div className="xt">
      <div
        id={id}
        ref={ref}
        className={'xt-body' + (clamped ? ' is-clamped' : '') + (clamped && overflows ? ' has-fade' : '')}
      >
        {children}
      </div>
      {(overflows || open) && (
        <button
          type="button"
          className="xt-toggle"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => {
            setOpen(!open)
            // Collapsing a long take would leave the reader far below it; bring the start back.
            if (open) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
          }}
        >
          {open ? 'Show less' : 'Read the full take'}
          <span aria-hidden="true" className={'xt-chev' + (open ? ' is-open' : '')}>▾</span>
        </button>
      )}
    </div>
  )
}
