'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { btn, btnDanger, btnQuiet, gold, hint, input, label } from '@/src/dcdl/components/admin/editor-ui'

/**
 * Void Hunters status effects, live: take any effect offline in one click (it drops off the
 * status effects page and out of hunter-page tooltips right away), publish it again, or replace
 * its name / text. Changes are stored as overrides on top of status-effects.json, so the next
 * sync doesn't undo them; "Revert to game text" clears an edit.
 */

type Effect = {
  id: string
  image: string
  name: string
  description: string
  hidden: boolean
  unique: boolean
  hunters: string[]
  file: { name: string; description: string; hidden: boolean }
  override: { hidden: boolean | null; name: string | null; description: string | null; updated_at: string } | null
}

type Filter = 'all' | 'live' | 'offline' | 'nohunter' | 'edited'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'offline', label: 'Offline' },
  { id: 'nohunter', label: 'No hunter named' },
  { id: 'edited', label: 'Edited' },
]

const tag = (bg: string, fg: string): React.CSSProperties => ({
  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
  padding: '0.12rem 0.45rem', borderRadius: '0.25rem', background: bg, color: fg, whiteSpace: 'nowrap',
})
const area: React.CSSProperties = { ...input, minHeight: '6rem', resize: 'vertical', lineHeight: 1.5 }
async function fetchEffects() {
  const res = await fetch('/api/admin/vh/status-effects')
  const json = await res.json().catch(() => ({ error: res.status }))
  return { ok: res.ok, json }
}
const isEdited = (e: Effect) => !!(e.override?.name || e.override?.description != null)

export default function VhStatusEffectsTab({ setStatus }: { setStatus: (s: string) => void }) {
  const [effects, setEffects] = useState<Effect[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<{ id: string; name: string; description: string } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { ok, json } = await fetchEffects()
    if (!ok) { setStatus(`Couldn't load status effects: ${json.error}`); return }
    setEffects(json.effects)
  }, [setStatus])

  // No synchronous setState: this doubles as the mount effect.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const { ok, json } = await fetchEffects()
      if (cancelled) return
      if (!ok) setStatus(`Couldn't load status effects: ${json.error}`)
      else setEffects(json.effects)
    })()
    return () => { cancelled = true }
  }, [setStatus])

  const save = async (id: string, patch: Record<string, unknown>, done: string) => {
    setBusy(id)
    const res = await fetch('/api/admin/vh/status-effects', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...patch }),
    })
    const json = await res.json().catch(() => ({ error: res.status }))
    setBusy(null)
    if (!res.ok) { setStatus(`Save failed: ${json.error}`); return false }
    setStatus(done)
    await load()
    return true
  }

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    return effects.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q) && !e.file.name.toLowerCase().includes(q) && !e.description.toLowerCase().includes(q)) return false
      if (filter === 'live') return !e.hidden
      if (filter === 'offline') return e.hidden
      if (filter === 'nohunter') return !e.hunters.length
      if (filter === 'edited') return isEdited(e)
      return true
    })
  }, [effects, filter, search])

  const offline = effects.filter((e) => e.hidden).length

  return (
    <div>
      <p style={{ ...hint, fontSize: '0.8rem', marginTop: 0 }}>
        {effects.length} effects · {effects.length - offline} live · {offline} offline. Taking one offline removes it from
        the status effects page and hunter-page tooltips immediately; nothing is deleted, and Publish brings it back.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', margin: '0.75rem 0 1rem' }}>
        {FILTERS.map((f) => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)}
            style={{ ...btnQuiet, padding: '0.35rem 0.8rem', ...(filter === f.id ? { borderColor: gold, color: gold } : {}) }}>
            {f.label}
          </button>
        ))}
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or text…"
          style={{ ...input, width: 'auto', flex: '1 1 12rem', minWidth: '10rem' }} />
      </div>

      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {shown.map((e) => {
          const open = editing?.id === e.id
          return (
            <div key={e.id} style={{
              border: `1px solid ${e.hidden ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.1)'}`,
              background: e.hidden ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
              borderRadius: '0.5rem', padding: '0.6rem 0.75rem',
            }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <img src={e.image} alt="" width={40} height={40} style={{ flex: '0 0 auto', opacity: e.hidden ? 0.5 : 1 }} />
                <div style={{ flex: '1 1 14rem', minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong style={{ color: '#fff' }}>{e.name}</strong>
                    {e.hidden
                      ? <span style={tag('rgba(239,68,68,0.2)', '#fca5a5')}>Offline</span>
                      : <span style={tag('rgba(34,197,94,0.18)', '#86efac')}>Live</span>}
                    {!e.hunters.length && <span style={tag('rgba(245,158,11,0.18)', '#fcd34d')}>No hunter named</span>}
                    {isEdited(e) && <span style={tag('rgba(168,85,247,0.2)', '#d8b4fe')}>Edited</span>}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#bbb', whiteSpace: 'pre-line', marginTop: '0.2rem' }}>
                    {e.description || <em style={{ color: '#777' }}>No text.</em>}
                  </div>
                  <div style={{ ...hint, marginTop: '0.3rem' }}>
                    {e.hunters.length ? `${e.unique ? 'Unique to' : 'In kits of'}: ${e.hunters.join(', ')}` : 'Not named in any hunter kit on the site.'}
                    {e.override && ` · Changed ${new Date(e.override.updated_at).toLocaleString()}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button type="button" disabled={busy === e.id}
                    style={e.hidden ? btn : btnDanger}
                    onClick={() => save(e.id, { hidden: !e.hidden }, `${e.name} is ${e.hidden ? 'live again' : 'offline'}.`)}>
                    {busy === e.id ? '…' : e.hidden ? 'Publish' : 'Take offline'}
                  </button>
                  <button type="button" style={btnQuiet}
                    onClick={() => setEditing(open ? null : { id: e.id, name: e.name, description: e.description })}>
                    {open ? 'Close' : 'Edit'}
                  </button>
                </div>
              </div>

              {open && editing && (
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={label}>Name</label>
                  <input style={input} value={editing.name} onChange={(ev) => setEditing({ ...editing, name: ev.target.value })} />
                  <label style={label}>Description</label>
                  <textarea style={area} value={editing.description}
                    onChange={(ev) => setEditing({ ...editing, description: ev.target.value })} />
                  <p style={hint}>Game text: {e.file.name} — {e.file.description || 'none'}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    <button type="button" style={btn} disabled={busy === e.id} onClick={async () => {
                      const ok = await save(e.id, {
                        name: editing.name.trim() === e.file.name ? null : editing.name,
                        description: editing.description === e.file.description ? null : editing.description,
                      }, `Saved ${editing.name || e.file.name}.`)
                      if (ok) setEditing(null)
                    }}>Save</button>
                    {isEdited(e) && (
                      <button type="button" style={btnQuiet} disabled={busy === e.id} onClick={async () => {
                        if (await save(e.id, { name: null, description: null }, `${e.file.name} is back to the game text.`)) setEditing(null)
                      }}>Revert to game text</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {!shown.length && <p style={hint}>Nothing matches.</p>}
      </div>
    </div>
  )
}
