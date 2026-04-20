'use client'

import { useState } from 'react'
import StatusEffectBox, { type StatusEffect } from './StatusEffectBox'

export default function StatusEffectGrid({ effects }: { effects: StatusEffect[] }) {
  const [query, setQuery] = useState('')

  const filtered = effects.filter((e) =>
    !query || e.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '64rem' }}>
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
            marginTop: '0.5rem',
          }}>
            {filtered.map((e) => <StatusEffectBox key={e.id} effect={e} />)}
          </div>
        )
      }
      <p style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.25rem' }}>
        Hover over an effect to see its description.
      </p>
    </div>
  )
}
