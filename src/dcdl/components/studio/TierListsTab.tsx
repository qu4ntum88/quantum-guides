'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import TierListEditor, { TIERS, type EditorItem, type TierAssignment } from '@/src/dcdl/components/tier/TierListEditor'
import ExportTierListButton from '@/src/dcdl/components/tier/ExportTierListButton'
import { btn, btnDanger, btnQuiet, gold, hint, input, label } from '@/src/dcdl/components/admin/editor-ui'

/**
 * "My Tier Lists" — the studio tab creators and editors use to build and
 * publish their own champion / legacy piece rankings.
 *
 * Everything is scoped server-side to the caller's own rows; this component
 * only decides what to show.
 */

type EntityType = 'champion' | 'legacy'

type SavedList = {
  id: string
  title: string
  entity_type: EntityType
  description: string | null
  creator_name: string
  published: boolean
  updated_at: string | null
  entries: { entityId: string; tier: string }[]
}

type CatalogItem = EditorItem & { tier: string }

export default function TierListsTab({ setStatus }: { setStatus: (s: string) => void }) {
  const [lists, setLists] = useState<SavedList[]>([])
  const [creatorName, setCreatorName] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<SavedList | null>(null)

  // No synchronous setState here — this also runs as the mount effect, and the
  // initial `loading` state already covers the first fetch.
  const load = useCallback(async () => {
    const res = await fetch('/api/tier-lists')
    if (res.ok) {
      const d = await res.json()
      setLists(d.lists ?? [])
      setCreatorName(d.creatorName ?? '')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await fetch('/api/tier-lists')
      if (cancelled || !res.ok) { if (!cancelled) setLoading(false); return }
      const d = await res.json()
      if (cancelled) return
      setLists(d.lists ?? [])
      setCreatorName(d.creatorName ?? '')
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  async function remove(id: string) {
    if (!confirm('Delete this tier list? This cannot be undone.')) return
    const res = await fetch(`/api/tier-lists?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    setStatus(res.ok ? 'Tier list deleted.' : 'Delete failed.')
    if (res.ok) { setEditing(null); load() }
  }

  if (loading) return <p style={{ color: '#888' }}>Loading…</p>

  if (editing) {
    return (
      <ListEditor
        list={editing}
        creatorName={creatorName}
        setStatus={setStatus}
        onDone={() => { setEditing(null); load() }}
        onCancel={() => setEditing(null)}
      />
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <button style={btn} onClick={() => setEditing(newList('champion', creatorName))}>+ New Champion Tier List</button>
        <button style={btnQuiet} onClick={() => setEditing(newList('legacy', creatorName))}>+ New Legacy Piece Tier List</button>
      </div>

      {lists.length === 0 && (
        <p style={{ color: '#888', fontSize: '0.88rem', lineHeight: 1.6 }}>
          You haven&rsquo;t published a tier list yet. Create one and it appears on the{' '}
          <Link href="/games/dc-dark-legion/tier-list" style={{ color: gold }}>DC: Dark Legion tier list page</Link> under
          Community Tier Lists, credited to you.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        {lists.map((l) => (
          <div key={l.id} style={{
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem',
            padding: '0.9rem 1rem', background: 'rgba(0,0,0,0.25)',
            display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: '12rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{l.title}</div>
              <div style={{ ...hint, marginTop: '0.2rem' }}>
                {l.entity_type === 'legacy' ? 'Legacy pieces' : 'Champions'} · {l.entries.length} ranked ·{' '}
                {l.published
                  ? <span style={{ color: '#22c55e' }}>Published</span>
                  : <span style={{ color: '#888' }}>Hidden</span>}
                {l.updated_at && ` · updated ${new Date(l.updated_at).toLocaleDateString()}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {l.published && (
                <Link href={`/games/dc-dark-legion/tier-list/${l.id}`} target="_blank" rel="noreferrer"
                  style={{ ...btnQuiet, textDecoration: 'none' }}>View</Link>
              )}
              <button style={btnQuiet} onClick={() => setEditing(l)}>Edit</button>
              <button style={btnDanger} onClick={() => remove(l.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function newList(entityType: EntityType, creatorName: string): SavedList {
  return {
    id: '',
    title: `${entityType === 'legacy' ? 'Legacy Piece' : 'Champion'} Tier List`,
    entity_type: entityType,
    description: '',
    creator_name: creatorName,
    published: true,
    updated_at: null,
    entries: [],
  }
}

// ── One list ─────────────────────────────────────────────────────────────────

function ListEditor({
  list, creatorName, setStatus, onDone, onCancel,
}: {
  list: SavedList
  creatorName: string
  setStatus: (s: string) => void
  onDone: () => void
  onCancel: () => void
}) {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [assign, setAssign] = useState<TierAssignment>({})
  const [title, setTitle] = useState(list.title)
  const [description, setDescription] = useState(list.description ?? '')
  const [name, setName] = useState(list.creator_name || creatorName)
  const [published, setPublished] = useState(list.published)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/tier-lists?catalog=${list.entity_type}`)
      .then((r) => r.json())
      .then((catalog: CatalogItem[]) => {
        // A saved list drives both the assignment and the ordering; anything it
        // never ranked falls into the unranked bin.
        const saved = new Map(list.entries.map((e, i) => [e.entityId, { tier: e.tier, pos: i }]))
        const ordered = catalog.slice().sort((a, b) =>
          (saved.get(a.id)?.pos ?? Number.MAX_SAFE_INTEGER) - (saved.get(b.id)?.pos ?? Number.MAX_SAFE_INTEGER)
        )
        setItems(ordered)
        setAssign(Object.fromEntries(ordered.map((c) => [c.id, saved.get(c.id)?.tier ?? ''])))
        setLoading(false)
      })
  }, [list])

  const publicTitle = `${name || 'Your name'}'s ${title}`.replace(/\s+/g, ' ').trim()
  const rankedCount = items.filter((i) => assign[i.id]).length

  async function save() {
    setSaving(true); setStatus('')
    const entries = items.filter((i) => assign[i.id]).map((i) => ({ entityId: i.id, tier: assign[i.id] }))
    const res = await fetch('/api/tier-lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: list.id || undefined,
        title, description, creatorName: name, published,
        entityType: list.entity_type, entries,
      }),
    })
    const json = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { setStatus(json.error ?? 'Save failed.'); return }
    setStatus(published ? 'Saved and published.' : 'Saved as hidden.')
    onDone()
  }

  return (
    <div>
      <button style={{ ...btnQuiet, marginBottom: '1.25rem' }} onClick={onCancel}>← Back to my lists</button>

      <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))' }}>
        <div>
          <label style={label} htmlFor="tl-name">Creator name</label>
          <input id="tl-name" style={input} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label style={label} htmlFor="tl-title">List title</label>
          <input id="tl-title" style={input} value={title} maxLength={90} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>
      <p style={{ ...hint, marginTop: '0.5rem' }}>
        Shown on the site as <strong style={{ color: gold }}>{publicTitle}</strong>
      </p>

      <label style={label} htmlFor="tl-desc">Short description (optional)</label>
      <input id="tl-desc" style={input} value={description} maxLength={600}
        onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Ranked for late-game PvP" />

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)}
          style={{ accentColor: gold, width: '1rem', height: '1rem' }} />
        <span style={{ fontSize: '0.85rem' }}>Visible on the public tier list page</span>
      </label>

      <div style={{ margin: '1.5rem 0 1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
        {loading ? <p style={{ color: '#888' }}>Loading champions…</p> : (
          <TierListEditor
            items={items}
            assign={assign}
            onChange={setAssign}
            onReorder={(next) => setItems(next as CatalogItem[])}
            unrankedLabel={list.entity_type === 'legacy' ? 'Unranked legacy pieces' : 'Unranked champions'}
          />
        )}
      </div>

      <div style={{
        display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center',
        position: 'sticky', bottom: 0, padding: '0.9rem 0',
        background: 'linear-gradient(to top, var(--bg, #0a0a14) 65%, transparent)',
      }}>
        <button style={btn} onClick={save} disabled={saving || rankedCount === 0}>
          {saving ? 'Saving…' : published ? 'Save & Publish' : 'Save'}
        </button>
        <ExportTierListButton
          title={publicTitle}
          subtitle={description || undefined}
          tiers={TIERS}
          fit={list.entity_type === 'legacy' ? 'contain' : 'cover'}
          items={items.filter((i) => assign[i.id]).map((i) => ({ id: i.id, name: i.name, img: i.img, tier: assign[i.id] }))}
        />
        <span style={hint}>{rankedCount} ranked</span>
      </div>
    </div>
  )
}
