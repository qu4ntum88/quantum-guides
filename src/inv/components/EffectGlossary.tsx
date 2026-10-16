'use client'

import { useState } from 'react'
import QTile, { type TileEntity } from '@/src/qgg/components/QTile'
import type { EffectEntry } from '../lib/data'

/** Searchable buff/debuff list; each effect expands to the Invokers and Titans that apply it. */
export default function EffectGlossary({
  effects,
  units,
}: {
  effects: EffectEntry[]
  units: Record<string, TileEntity>
}) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<'all' | 'Buffs' | 'Debuffs'>('all')
  const [open, setOpen] = useState<string | null>(null)
  const q = query.trim().toLowerCase()

  const shown = effects.filter(
    (e) =>
      (group === 'all' || e.group === group) &&
      (!q ||
        e.label.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        [...e.invokers.map((s) => `Invoker:${s}`), ...e.titans.map((s) => `Titan:${s}`)].some((k) =>
          units[k]?.name.toLowerCase().includes(q),
        )),
  )

  return (
    <div>
      <div className="qtb-controls">
        <div className="inv-seg" role="tablist" aria-label="Effect type">
          {(['all', 'Buffs', 'Debuffs'] as const).map((g) => (
            <button key={g} type="button" role="tab" aria-selected={group === g} className={group === g ? 'is-on' : ''} onClick={() => setGroup(g)}>
              {g === 'all' ? 'All' : g}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="qtb-search"
          placeholder="Search effects or Invokers…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search effects"
        />
      </div>
      <div className="inv-effects">
        {shown.map((e) => {
          const isOpen = open === e.label
          const who = [...e.invokers.map((s) => units[`Invoker:${s}`]), ...e.titans.map((s) => units[`Titan:${s}`])].filter(Boolean)
          return (
            <article key={e.label} className={`inv-effect-card${isOpen ? ' is-open' : ''}`}>
              <button type="button" className="inv-effect-head" onClick={() => setOpen(isOpen ? null : e.label)} aria-expanded={isOpen}>
                <span className={`inv-effect inv-effect--${e.group === 'Buffs' ? 'buff' : 'debuff'}`}>{e.label}</span>
                <span className="inv-effect-desc">{e.description}</span>
                <span className="inv-effect-count">
                  {e.invokers.length > 0 && `${e.invokers.length} Invoker${e.invokers.length === 1 ? '' : 's'}`}
                  {e.invokers.length > 0 && e.titans.length > 0 && ' · '}
                  {e.titans.length > 0 && `${e.titans.length} Titan${e.titans.length === 1 ? '' : 's'}`}
                </span>
              </button>
              {isOpen && (
                <div className="qtb-grid inv-tight">
                  {who.map((u) => <QTile key={u.href} e={u} size="sm" />)}
                </div>
              )}
            </article>
          )
        })}
        {shown.length === 0 && <p className="inv-empty">No effects match.</p>}
      </div>
    </div>
  )
}
