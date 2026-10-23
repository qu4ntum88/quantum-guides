'use client'

// Small inputs shared by the Account Profile and the gear loadout.

import { useState } from 'react'

export function NumberField({ value, min, max, onChange, label, className = 'acct-num' }: { value: number; min: number; max: number; onChange: (n: number) => void; label: string; className?: string }) {
  const [text, setText] = useState(String(value))
  // Follow outside changes (Max buttons, another tab) without an effect.
  const [shown, setShown] = useState(value)
  if (shown !== value) { setShown(value); setText(String(value)) }
  const commit = (s: string) => {
    const n = Number(s)
    onChange(Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min)
  }
  return (
    <input
      className={className} type="number" inputMode="decimal" min={min} max={max} value={text} aria-label={label}
      onChange={(e) => setText(e.target.value)} onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value) }}
    />
  )
}

export function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (n: number) => void; label: string }) {
  return (
    <span className="acct-stepper">
      <button type="button" aria-label={`${label} down`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <NumberField value={value} min={min} max={max} onChange={(n) => onChange(Math.round(n))} label={label} />
      <button type="button" aria-label={`${label} up`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </span>
  )
}

export function Chips({ list, empty }: { list: string[]; empty?: string }) {
  if (!list.length) return empty ? <span className="acct-muted">{empty}</span> : null
  return <span className="acct-chips">{list.map((c) => <span key={c} className="acct-chip">{c}</span>)}</span>
}
