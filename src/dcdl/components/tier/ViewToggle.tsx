'use client'

import { useCallback, useEffect, useState } from 'react'

export type ViewMode = 'tier' | 'grid'

/**
 * Tier List ↔ Grid choice for a database page.
 *
 * A `?view=tier|grid` URL param wins (so links like the navbar's "Tier List"
 * land on the right view), then the viewer's last choice from localStorage,
 * then the Tier List. Read after mount, so the server render is always the
 * Tier List.
 */
export function useViewMode(storageKey: string): [ViewMode, (v: ViewMode) => void] {
  const [view, setViewState] = useState<ViewMode>('tier')

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('view')
    let saved: string | null = null
    try { saved = localStorage.getItem(storageKey) } catch { /* storage blocked */ }
    const initial = param === 'grid' || param === 'tier' ? param : saved
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of browser-only state after mount
    if (initial === 'grid' || initial === 'tier') setViewState(initial)
  }, [storageKey])

  const setView = useCallback((v: ViewMode) => {
    setViewState(v)
    try { localStorage.setItem(storageKey, v) } catch { /* storage blocked */ }
    const url = new URL(window.location.href)
    url.searchParams.set('view', v)
    window.history.replaceState(null, '', url)
  }, [storageKey])

  return [view, setView]
}

/**
 * Shared height for the toggle / search / reset row so the three line up.
 * Inline because the global `button` and `input` rules in globals.css are
 * unlayered and would otherwise beat the Tailwind sizing (extra button padding
 * pushed the label off-centre; the input gets a 1rem bottom margin).
 */
export const CONTROL_HEIGHT = '2.75rem'

export const CONTROL_BUTTON: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  height: CONTROL_HEIGHT, padding: '0 1.1rem', lineHeight: 1, boxSizing: 'border-box',
}

export const CONTROL_INPUT: React.CSSProperties = {
  height: CONTROL_HEIGHT, marginBottom: 0, boxSizing: 'border-box',
}

const OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'tier', label: 'Tier List' },
  { value: 'grid', label: 'Grid' },
]

export default function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div role="tablist" aria-label="View" style={{
      display: 'inline-flex', alignItems: 'stretch', padding: '0.2rem', gap: '0.2rem',
      height: CONTROL_HEIGHT, boxSizing: 'border-box', flexShrink: 0,
      border: '2px solid #444', borderRadius: '0.6rem', background: 'rgba(0,0,0,0.25)',
    }}>
      {OPTIONS.map((o) => {
        const selected = view === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(o.value)}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
              padding: '0 0.95rem', borderRadius: '0.4rem', cursor: 'pointer',
              border: selected ? '2px solid var(--gold)' : '2px solid transparent',
              background: selected ? 'rgba(124,58,237,0.35)' : 'transparent',
              color: selected ? 'var(--gold)' : '#888',
              fontFamily: 'Unbounded, sans-serif', fontSize: '0.68rem', fontWeight: 700,
              letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
