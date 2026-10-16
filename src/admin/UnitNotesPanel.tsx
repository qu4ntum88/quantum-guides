'use client'

import { useEffect, useMemo, useState } from 'react'
import { btn, btnQuiet, gold, hint, input, label } from '@/src/dcdl/components/admin/editor-ui'
import { unitPath } from '@/src/inv/lib/constants'

/**
 * Site Admin → Godforge / Invokers / Void Hunters → Heroes / Units / Hunters.
 *
 * Kits, stats and art come from the game-data syncs, so the only things to
 * edit by hand are Quantum's own: his take and the Pay-to-Win / New flags
 * (src/qgg/notes.ts). Saving writes the game's notes.json locally; commit and
 * push to publish, like every other data change.
 */

type Game = 'godforge' | 'invokers' | 'voidhunters'
type Unit = { id: string; name: string; img: string | null; group: string; rarity: string | null }
type Note = { take?: string; p2w?: boolean; isNew?: boolean }

const PAGE: Record<Game, (u: Unit) => string> = {
  godforge: (u) => `/games/godforge/heroes/${u.id}`,
  voidhunters: (u) => `/games/void-hunters/hunters/${u.id}`,
  invokers: (u) => unitPath(u.group, u.id),
}

const hasNote = (n?: Note) => !!(n && (n.take || n.p2w || n.isNew))

export default function UnitNotesPanel({ game, noun }: { game: Game; noun: string }) {
  const [units, setUnits] = useState<Unit[]>([])
  const [notes, setNotes] = useState<Record<string, Note>>({})
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('')
  const [onlyNoted, setOnlyNoted] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [draft, setDraft] = useState<Note>({})
  const [status, setStatus] = useState('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await fetch(`/api/admin/notes?game=${game}`)
      const body = await res.json().catch(() => ({}))
      if (cancelled) return
      if (!res.ok) { setError(body.error ?? `Load failed (${res.status})`); return }
      setUnits(body.units)
      setNotes(body.notes)
    })()
    return () => { cancelled = true }
  }, [game])

  const groups = useMemo(() => [...new Set(units.map((u) => u.group).filter(Boolean))].sort(), [units])
  const visible = units.filter((u) =>
    (!group || u.group === group) &&
    (!onlyNoted || hasNote(notes[u.id])) &&
    (!query || u.name.toLowerCase().includes(query.toLowerCase())),
  )
  const unit = units.find((u) => u.id === selected) ?? null
  const saved = selected ? notes[selected] ?? {} : {}
  const dirty = (draft.take ?? '') !== (saved.take ?? '') || !!draft.p2w !== !!saved.p2w || !!draft.isNew !== !!saved.isNew
  const notedCount = units.filter((u) => hasNote(notes[u.id])).length

  function pick(id: string) {
    if (dirty && !window.confirm('Discard unsaved changes?')) return
    setSelected(id)
    setDraft({ ...(notes[id] ?? {}) })
    setStatus('')
  }

  async function save() {
    if (!selected) return
    setStatus('Saving…')
    const res = await fetch('/api/admin/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game, id: selected, note: draft }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) { setStatus(`Save failed: ${body.error ?? res.status}`); return }
    setNotes((n) => {
      const next = { ...n }
      if (hasNote(body.note)) next[selected] = body.note
      else delete next[selected]
      return next
    })
    setDraft(body.note)
    setStatus('Saved to notes.json. Commit and push to publish.')
  }

  if (error) {
    return <p style={{ color: '#f87171' }}>{error}{error.includes('production') && ' — this tab edits files, so it only works on the local Site Admin.'}</p>
  }

  return (
    <div>
      <p style={{ ...hint, fontSize: '0.8rem', marginBottom: '1rem', lineHeight: 1.6 }}>
        Kits, stats and art update themselves from the game-data sync. This is where your own calls go: Quantum&apos;s
        Take, and the <strong style={{ color: '#4ade80' }}>P2W</strong> and <strong style={{ color: '#f87171' }}>New</strong> flags
        (shown on the {noun.toLowerCase()} page and as badges on its tile). {notedCount} of {units.length} have notes.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 300px) 1fr', gap: '1.25rem', alignItems: 'start' }} className="sa-split">
        <div>
          <input style={input} placeholder={`Search ${noun.toLowerCase()}…`} value={query} onChange={(e) => setQuery(e.target.value)} />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {groups.length > 1 && (
              <select style={{ ...input, width: 'auto', flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem' }} value={group} onChange={(e) => setGroup(e.target.value)}>
                <option value="">All</option>
                {groups.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            )}
            <label style={{ fontSize: '0.75rem', color: '#aaa', display: 'flex', gap: '0.3rem', alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={onlyNoted} onChange={(e) => setOnlyNoted(e.target.checked)} style={{ accentColor: gold }} />
              With notes
            </label>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0.6rem 0 0', maxHeight: '65vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.4rem' }}>
            {visible.map((u) => {
              const n = notes[u.id]
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => pick(u.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.55rem', width: '100%', padding: '0.35rem 0.5rem',
                      background: selected === u.id ? 'rgba(204,164,83,0.15)' : 'transparent', border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ddd', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {u.img ? <img src={u.img} alt="" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, background: '#111' }} /> : <span style={{ width: 28 }} />}
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{u.name}</span>
                    {n?.isNew && <span style={{ fontSize: '0.55rem', color: '#f87171', fontWeight: 700 }}>NEW</span>}
                    {n?.p2w && <span style={{ fontSize: '0.6rem', color: '#4ade80', fontWeight: 700 }}>$</span>}
                    {n?.take && <span title="Has a take" style={{ width: 6, height: 6, borderRadius: '50%', background: gold }} />}
                  </button>
                </li>
              )
            })}
            {visible.length === 0 && <li style={{ ...hint, padding: '0.75rem' }}>{units.length ? 'No matches.' : 'Loading…'}</li>}
          </ul>
        </div>

        <div>
          {!unit ? (
            <p style={{ color: '#777', marginTop: '0.5rem' }}>Pick a {noun.toLowerCase().replace(/s$/, '')} on the left.</p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); void save() }}>
              <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {unit.img && <img src={unit.img} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, background: '#111' }} />}
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>{unit.name}</div>
                  <div style={hint}>
                    {[unit.rarity, unit.group].filter(Boolean).join(' · ')} ·{' '}
                    <a href={PAGE[game](unit)} target="_blank" rel="noreferrer" style={{ color: gold }}>view page ↗</a>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', cursor: 'pointer', color: '#ddd' }}>
                  <input type="checkbox" checked={!!draft.p2w} onChange={(e) => setDraft((d) => ({ ...d, p2w: e.target.checked }))} style={{ accentColor: gold, width: '1rem', height: '1rem' }} />
                  Pay to win
                </label>
                <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', cursor: 'pointer', color: '#ddd' }}>
                  <input type="checkbox" checked={!!draft.isNew} onChange={(e) => setDraft((d) => ({ ...d, isNew: e.target.checked }))} style={{ accentColor: gold, width: '1rem', height: '1rem' }} />
                  New
                </label>
              </div>

              <label style={label}>Quantum&apos;s Take</label>
              <textarea
                style={{ ...input, minHeight: '16rem', resize: 'vertical', lineHeight: 1.55 }}
                value={draft.take ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, take: e.target.value }))}
                placeholder={`Your analysis of ${unit.name}…`}
              />
              <p style={hint}>Blank line = new paragraph · <code>## </code> heading · <code>- </code> bullet · <code>**bold**</code></p>

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="submit" style={{ ...btn, opacity: dirty ? 1 : 0.5 }} disabled={!dirty}>Save</button>
                {dirty && <button type="button" style={btnQuiet} onClick={() => setDraft({ ...saved })}>Revert</button>}
                {status && <span style={{ fontSize: '0.8rem', color: status.startsWith('Save failed') ? '#f87171' : gold }}>{status}</span>}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
