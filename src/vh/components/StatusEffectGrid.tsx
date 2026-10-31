'use client'

import { useState } from 'react'
import StatusEffectBox, { type EffectOwner, type StatusEffect } from './StatusEffectBox'

export default function StatusEffectGrid({ effects, owners = {} }: { effects: StatusEffect[]; owners?: Record<string, EffectOwner> }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const ownersOf = (e: StatusEffect) => (e.hunters ?? []).map((id) => owners[id]).filter((o): o is EffectOwner => !!o)

  const filtered = effects.filter((e) =>
    !q || e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
      || ownersOf(e).some((o) => o.name.toLowerCase().includes(q))
  )

  return (
    <div className="vh-effects-wrap">
      <div className="qtb-controls">
        <input
          type="search"
          className="qtb-search"
          placeholder="Search effects, what they do or a hunter…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search status effects"
        />
      </div>

      {filtered.length === 0
        ? <p className="w-muted" style={{ marginTop: '1rem' }}>No status effects found.</p>
        : <div className="vh-effects">{filtered.map((e) => <StatusEffectBox key={e.id} effect={e} owners={ownersOf(e)} />)}</div>}

      <p className="w-muted vh-effects-note">
        X, Y and so on stand for numbers set by the skill that applies the effect, so
        they change from hunter to hunter and with skill level; [effect], [tag], [hunter] and similar stand for
        whatever effect, tag or hunter that skill names. Portraits show the hunters whose skills include the effect;
        a gold Unique tag marks an effect that belongs to one hunter. Tap a portrait to see how it works in their skills.
      </p>
    </div>
  )
}
