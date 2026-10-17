'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { btn, btnDanger, btnQuiet, gold, hint, input, label } from '@/src/dcdl/components/admin/editor-ui'
import { HISTORY_KINDS } from '@/src/dcdl/components/history/EntityHistory'
import type { HistoryKind } from '@/src/dcdl/lib/history-db'

/**
 * Review + edit the dated History entries on champion and legacy pages.
 * Drafts arrive as "pending"; approving one publishes it on the page within a minute.
 * Pick a champion / legacy piece on the left, edit its entries on the right, and
 * approve them one at a time or all at once.
 */

type Entry = {
  id: string
  entity_type: 'champion' | 'legacy'
  entity_id: string
  entity_name: string
  event_date: string
  kind: HistoryKind
  title: string
  body: string
  take: string | null
  servers: string | null
  source_post_ids: string[]
  status: 'pending' | 'approved'
}
type Post = { id: string; title: string; posted_at: string; kind: string }

const KIND_IDS = Object.keys(HISTORY_KINDS) as HistoryKind[]

async function fetchHistory(game: string) {
  const res = await fetch(`/api/admin/history?game=${game}`)
  const json = await res.json().catch(() => ({ error: res.status }))
  return { ok: res.ok, json }
}
const area: React.CSSProperties = { ...input, minHeight: '6rem', resize: 'vertical', lineHeight: 1.5 }

export default function HistoryTab({ setStatus, game = 'dcdl' }: { setStatus: (s: string) => void; game?: string }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [posts, setPosts] = useState<Record<string, Post>>({})
  const [entities, setEntities] = useState<{ key: string; name: string }[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [onlyPending, setOnlyPending] = useState(true)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState<{ key: string; event_date: string; kind: HistoryKind; title: string } | null>(null)

  const apply = useCallback((json: { entries: Entry[]; posts: Record<string, Post>; entities: { key: string; name: string }[] }) => {
    setEntries(json.entries)
    setPosts(json.posts)
    setEntities(json.entities)
  }, [])

  const load = useCallback(async () => {
    const { ok, json } = await fetchHistory(game)
    if (!ok) { setStatus(`Couldn't load history: ${json.error}`); return }
    apply(json)
  }, [game, setStatus, apply])

  // No synchronous setState: this doubles as the mount effect.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const { ok, json } = await fetchHistory(game)
      if (cancelled) return
      if (!ok) setStatus(`Couldn't load history: ${json.error}`)
      else apply(json)
    })()
    return () => { cancelled = true }
  }, [game, setStatus, apply])

  // One row per champion / legacy piece that has entries.
  const groups = useMemo(() => {
    const m = new Map<string, { key: string; name: string; type: string; pending: number; approved: number }>()
    for (const e of entries) {
      const key = `${e.entity_type}:${e.entity_id}`
      const g = m.get(key) ?? { key, name: e.entity_name, type: e.entity_type, pending: 0, approved: 0 }
      g[e.status === 'pending' ? 'pending' : 'approved']++
      m.set(key, g)
    }
    return [...m.values()]
      .filter((g) => (!onlyPending || g.pending > 0) && g.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.pending - a.pending || a.name.localeCompare(b.name))
  }, [entries, onlyPending, search])

  const current = entries.filter((e) => `${e.entity_type}:${e.entity_id}` === selected)
  const totalPending = entries.filter((e) => e.status === 'pending').length

  const patch = async (body: object, ok: string) => {
    const res = await fetch('/api/admin/history', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) { setStatus(`Save failed: ${json.error ?? res.status}`); return false }
    setStatus(ok)
    await load()
    return true
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this entry? This cannot be undone.')) return
    const res = await fetch(`/api/admin/history?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { setStatus('Delete failed.'); return }
    setStatus('Entry deleted.')
    await load()
  }

  const add = async () => {
    if (!adding) return
    const [entity_type, entity_id] = adding.key.split(':')
    const res = await fetch('/api/admin/history', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game, entity_type, entity_id, event_date: adding.event_date, kind: adding.kind, title: adding.title, body: '' }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) { setStatus(json.error ?? 'Could not add the entry.'); return }
    setStatus('Entry added as a draft.')
    setSelected(adding.key)
    setAdding(null)
    await load()
  }

  return (
    <div>
      <p style={{ ...hint, fontSize: '0.8rem', marginTop: 0 }}>
        Dated History entries on champion and legacy pages. Drafts stay hidden until you approve them; approved entries
        show on the page within a minute. {totalPending > 0 && <strong style={{ color: gold }}>{totalPending} waiting for review.</strong>}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(14rem, 18rem) 1fr', gap: '1.25rem', alignItems: 'start' }} className="ht-grid">
        {/* Left: who has entries */}
        <div>
          <input style={input} placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <label style={{ ...hint, display: 'flex', gap: '0.4rem', alignItems: 'center', margin: '0.5rem 0' }}>
            <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} /> Only show ones with drafts
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '32rem', overflowY: 'auto' }}>
            {groups.map((g) => (
              <button
                key={g.key} type="button" onClick={() => setSelected(g.key)}
                style={{
                  ...btnQuiet, textAlign: 'left', fontFamily: 'inherit', fontWeight: 600, display: 'flex', justifyContent: 'space-between', gap: '0.5rem',
                  borderColor: selected === g.key ? gold : 'rgba(255,255,255,0.12)', color: selected === g.key ? gold : '#ddd',
                }}
              >
                <span>{g.name} <span style={{ color: '#777', fontWeight: 400 }}>· {g.type}</span></span>
                <span style={{ color: g.pending ? gold : '#666' }}>{g.pending ? `${g.pending} draft${g.pending > 1 ? 's' : ''}` : `${g.approved} live`}</span>
              </button>
            ))}
            {groups.length === 0 && <p style={hint}>{onlyPending ? 'No drafts waiting.' : 'No entries yet.'}</p>}
          </div>
          <button type="button" style={{ ...btnQuiet, marginTop: '0.75rem', width: '100%' }}
            onClick={() => setAdding({ key: selected ?? '', event_date: new Date().toISOString().slice(0, 10), kind: 'change', title: '' })}>
            + Add an entry by hand
          </button>
        </div>

        {/* Right: the selected champion's entries */}
        <div>
          {adding && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <span style={label}>Champion or legacy piece</span>
              <select style={input} value={adding.key} onChange={(e) => setAdding({ ...adding, key: e.target.value })}>
                <option value="">Pick one…</option>
                {entities.map((x) => <option key={x.key} value={x.key}>{x.name} ({x.key.split(':')[0]})</option>)}
              </select>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}><span style={label}>Date</span><input type="date" style={input} value={adding.event_date} onChange={(e) => setAdding({ ...adding, event_date: e.target.value })} /></div>
                <div style={{ flex: 1 }}><span style={label}>Type</span>
                  <select style={input} value={adding.kind} onChange={(e) => setAdding({ ...adding, kind: e.target.value as HistoryKind })}>
                    {KIND_IDS.map((k) => <option key={k} value={k}>{HISTORY_KINDS[k].label}</option>)}
                  </select>
                </div>
              </div>
              <span style={label}>Title</span>
              <input style={input} value={adding.title} onChange={(e) => setAdding({ ...adding, title: e.target.value })} />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button type="button" style={btn} onClick={add}>Add draft</button>
                <button type="button" style={btnQuiet} onClick={() => setAdding(null)}>Cancel</button>
              </div>
            </div>
          )}

          {!selected && !adding && <p style={hint}>Pick a champion or legacy piece on the left.</p>}

          {selected && current.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0 }}>{current[0].entity_name}</h3>
              {current.some((e) => e.status === 'pending') && (
                <button type="button" style={btn}
                  onClick={() => patch({ ids: current.filter((e) => e.status === 'pending').map((e) => e.id), status: 'approved' }, `Published ${current[0].entity_name}'s history.`)}>
                  Approve all {current.filter((e) => e.status === 'pending').length}
                </button>
              )}
            </div>
          )}

          {current.map((e) => (
            <EntryEditor key={e.id + e.status} entry={e} posts={posts} onSave={(f) => patch({ id: e.id, ...f }, 'Saved.')}
              onStatus={(status) => patch({ ids: [e.id], status }, status === 'approved' ? 'Published.' : 'Moved back to drafts.')}
              onDelete={() => remove(e.id)} />
          ))}
        </div>
      </div>
      <style>{`@media (max-width: 800px) { .ht-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}

function EntryEditor({ entry, posts, onSave, onStatus, onDelete }: {
  entry: Entry
  posts: Record<string, Post>
  onSave: (fields: Partial<Entry>) => Promise<boolean>
  onStatus: (s: 'approved' | 'pending') => void
  onDelete: () => void
}) {
  const [f, setF] = useState({ event_date: entry.event_date, kind: entry.kind, title: entry.title, servers: entry.servers ?? '', body: entry.body, take: entry.take ?? '' })
  const dirty = f.event_date !== entry.event_date || f.kind !== entry.kind || f.title !== entry.title || f.servers !== (entry.servers ?? '') || f.body !== entry.body || f.take !== (entry.take ?? '')
  const k = HISTORY_KINDS[f.kind]

  return (
    <div className="card" style={{ marginBottom: '1rem', borderLeft: `3px solid ${k.color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: entry.status === 'approved' ? '#22c55e' : gold }}>
          {entry.status === 'approved' ? 'Live on the page' : 'Draft · not public'}
        </span>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {entry.status === 'pending'
            ? <button type="button" style={btnQuiet} disabled={dirty} title={dirty ? 'Save your edits first' : ''} onClick={() => onStatus('approved')}>Approve</button>
            : <button type="button" style={btnQuiet} onClick={() => onStatus('pending')}>Unpublish</button>}
          <button type="button" style={btnDanger} onClick={onDelete}>Delete</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 9rem' }}><span style={label}>Date</span><input type="date" style={input} value={f.event_date} onChange={(e) => setF({ ...f, event_date: e.target.value })} /></div>
        <div style={{ flex: '1 1 9rem' }}><span style={label}>Type</span>
          <select style={input} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as HistoryKind })}>
            {KIND_IDS.map((x) => <option key={x} value={x}>{HISTORY_KINDS[x].label}</option>)}
          </select>
        </div>
        <div style={{ flex: '2 1 14rem' }}><span style={label}>Servers (optional)</span><input style={input} placeholder="e.g. Earths 200–205 first" value={f.servers} onChange={(e) => setF({ ...f, servers: e.target.value })} /></div>
      </div>
      <span style={label}>Title</span>
      <input style={input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <span style={label}>What happened</span>
      <textarea style={area} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
      <span style={label}>Quantum&apos;s take</span>
      <textarea style={area} placeholder="Your take on this change (optional, shown in a gold box under the entry)" value={f.take} onChange={(e) => setF({ ...f, take: e.target.value })} />
      <p style={hint}>Blank line = new paragraph · **bold** · lines starting with &quot;- &quot; make a list.</p>

      {entry.source_post_ids.length > 0 && (
        <p style={{ ...hint, marginTop: '0.5rem' }}>
          Drafted from: {entry.source_post_ids.map((id) => posts[id] ? `${posts[id].title} (${posts[id].posted_at.slice(0, 10)})` : id).join(' · ')}
        </p>
      )}
      {dirty && <button type="button" style={{ ...btn, marginTop: '0.75rem' }} onClick={() => onSave({ ...f, servers: f.servers || null, take: f.take || null })}>Save changes</button>}
    </div>
  )
}
