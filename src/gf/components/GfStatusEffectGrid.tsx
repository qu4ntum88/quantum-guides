'use client'

import { useState, useMemo } from 'react'
import GfStatusEffectBox, { type GfStatusEffect } from './GfStatusEffectBox'

type Category = 'all' | 'buff' | 'debuff' | 'disable'

const TABS: { key: Category; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: '#888' },
  { key: 'buff', label: 'Buffs', color: '#166534' },
  { key: 'debuff', label: 'Debuffs', color: '#7f1d1d' },
  { key: 'disable', label: 'Disables', color: '#1e3a5f' },
]

export default function GfStatusEffectGrid({ effects }: { effects: GfStatusEffect[] }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category>('all')

  const filtered = useMemo(() => {
    let result = effects
    if (category !== 'all') result = result.filter((e) => e.category === category)
    if (query) result = result.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
    return result
  }, [effects, category, query])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '68rem' }}>
      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {TABS.map(({ key, label, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(key)}
            style={{
              background: category === key ? color : '#1a1a1a',
              border: `1px solid ${color}`,
              borderRadius: '0.375rem',
              color: category === key ? '#fff' : '#aaa',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: category === key ? 700 : 400,
              padding: '0.35rem 1rem',
              transition: 'background 0.1s, color 0.1s',
            }}
          >
            {label}
            <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', opacity: 0.7 }}>
              ({key === 'all' ? effects.length : effects.filter((e) => e.category === key).length})
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Search status effects..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          background: '#1a1a1a', border: '1px solid #444', borderRadius: '0.5rem',
          color: '#fff', padding: '0.6rem 1rem', fontSize: '0.95rem', width: '100%',
        }}
      />

      {filtered.length === 0
        ? <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '1rem' }}>No status effects found.</p>
        : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(7rem, 1fr))',
            gap: '0.6rem',
            marginTop: '0.25rem',
          }}>
            {filtered.map((e) => <GfStatusEffectBox key={e.id} effect={e} />)}
          </div>
        )
      }
      <p style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.25rem' }}>
        Hover over an effect to see its description.
      </p>
    </div>
  )
}
