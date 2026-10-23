'use client'

import { useEffect, useState } from 'react'
import { btn, btnQuiet, gold, hint, input, label } from '@/src/dcdl/components/admin/editor-ui'

/**
 * Site Admin → DC: Dark Legion → Base Skins.
 *
 * Stats, art and the release event come from the base-skins sync (Game Data tab), so the
 * only things to edit by hand are Quantum's own: his take, and any "how to get it" detail
 * the official posts don't spell out. Saving writes base-skins-notes.json locally; commit
 * and push to publish.
 */

type Skin = { id: string; name: string; icon: string | null }
type Note = { take?: string; howToGet?: string }

const hasNote = (n?: Note) => !!(n && (n.take || n.howToGet))

export default function BaseSkinsPanel() {
  const [skins, setSkins] = useState<Skin[]>([])
  const [notes, setNotes] = useState<Record<string, Note>>({})
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [draft, setDraft] = useState<Note>({})
  const [status, setStatus] = useState('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await fetch('/api/admin/dcdl/base-skins')
      const body = await res.json().catch(() => ({}))
      if (cancelled) return
      if (!res.ok) { setError(body.error ?? `Load failed (${res.status})`); return }
      setSkins(body.skins)
      setNotes(body.notes)
    })()
    return () => { cancelled = true }
  }, [])

  const skin = skins.find((s) => s.id === selected) ?? null
  const saved = selected ? notes[selected] ?? {} : {}
  const dirty = (draft.take ?? '') !== (saved.take ?? '') || (draft.howToGet ?? '') !== (saved.howToGet ?? '')

  function pick(id: string) {
    if (dirty && !window.confirm('Discard unsaved changes?')) return
    setSelected(id)
    setDraft({ ...(notes[id] ?? {}) })
    setStatus('')
  }

  async function save() {
    if (!selected) return
    setStatus('Saving…')
    const res = await fetch('/api/admin/dcdl/base-skins', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected, note: draft }),
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
    setStatus('Saved to base-skins-notes.json. Commit and push to publish.')
  }

  if (error) {
    return <p style={{ color: '#f87171' }}>{error}{error.includes('production') && ' — this tab edits files, so it only works on the local Site Admin.'}</p>
  }

  return (
    <div>
      <p style={{ ...hint, fontSize: '0.8rem', marginBottom: '1rem', lineHeight: 1.6 }}>
        Bonuses, art and the event each skin came from update themselves (Site → Game Data → Update Base Skins).
        Only skins an official post confirms as obtainable are listed; to add one you&apos;ve seen in game before a
        post names it, add its name to <code>confirmedInGame</code> in base-skins-notes.json and re-run the update.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 300px) 1fr', gap: '1.25rem', alignItems: 'start' }} className="sa-split">
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.4rem' }}>
          {skins.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => pick(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.55rem', width: '100%', padding: '0.35rem 0.5rem',
                  background: selected === s.id ? 'rgba(204,164,83,0.15)' : 'transparent', border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ddd', cursor: 'pointer', textAlign: 'left',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {s.icon ? <img src={s.icon} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} /> : <span style={{ width: 28 }} />}
                <span style={{ flex: 1, minWidth: 0, fontSize: '0.85rem' }}>{s.name}</span>
                {hasNote(notes[s.id]) && <span title="Has notes" style={{ width: 6, height: 6, borderRadius: '50%', background: gold }} />}
              </button>
            </li>
          ))}
          {skins.length === 0 && <li style={{ ...hint, padding: '0.75rem' }}>Loading…</li>}
        </ul>

        <div>
          {!skin ? (
            <p style={{ color: '#777', marginTop: '0.5rem' }}>Pick a skin on the left.</p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); void save() }}>
              <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {skin.icon && <img src={skin.icon} alt="" style={{ width: 64, height: 64, objectFit: 'contain' }} />}
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>{skin.name}</div>
                  <div style={hint}>
                    <a href={`/games/dc-dark-legion/base-skins#${skin.id}`} target="_blank" rel="noreferrer" style={{ color: gold }}>view page ↗</a>
                  </div>
                </div>
              </div>

              <label style={label}>How to get it (optional)</label>
              <textarea
                style={{ ...input, minHeight: '4.5rem', resize: 'vertical', lineHeight: 1.55 }}
                value={draft.howToGet ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, howToGet: e.target.value }))}
                placeholder="e.g. store price or pass track. The event name shows automatically."
              />

              <label style={label}>Quantum&apos;s Take</label>
              <textarea
                style={{ ...input, minHeight: '12rem', resize: 'vertical', lineHeight: 1.55 }}
                value={draft.take ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, take: e.target.value }))}
                placeholder={`Is ${skin.name} worth equipping?`}
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
