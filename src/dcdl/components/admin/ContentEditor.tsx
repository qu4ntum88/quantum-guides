'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * On-site content editor for DC: Dark Legion guides, patch notes / game info,
 * and infographics. Talks to the Clerk-gated /api/admin/content/* routes, which
 * re-verify admin server-side before writing to Supabase. Edits publish to the
 * live site within ~1 minute (pages revalidate every 60s).
 */

// ── Shared styles ────────────────────────────────────────────────────────────
const gold = 'var(--gold)'
const label: React.CSSProperties = {
  display: 'block', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: gold, marginBottom: '0.35rem', marginTop: '1rem',
}
const input: React.CSSProperties = {
  width: '100%', padding: '0.55rem 0.7rem', borderRadius: '0.4rem',
  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.35)',
  color: '#fff', fontSize: '0.9rem', fontFamily: 'inherit',
}
const hint: React.CSSProperties = { fontSize: '0.7rem', color: '#888', marginTop: '0.25rem' }
const btn: React.CSSProperties = {
  padding: '0.5rem 1.1rem', borderRadius: '0.4rem', border: `1px solid ${gold}`,
  background: gold, color: '#0a0a14', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
  fontFamily: 'Unbounded, sans-serif',
}
const btnQuiet: React.CSSProperties = {
  ...btn, background: 'transparent', color: '#ccc', borderColor: 'rgba(255,255,255,0.2)',
}
const btnDanger: React.CSSProperties = { ...btnQuiet, color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)' }

type Tab = 'guides' | 'patch' | 'infographics'

export default function ContentEditor() {
  const [tab, setTab] = useState<Tab>('guides')
  const [status, setStatus] = useState('')

  const tabBtn = (t: Tab, txt: string) => (
    <button
      onClick={() => { setTab(t); setStatus('') }}
      style={{
        ...btnQuiet,
        borderColor: tab === t ? gold : 'rgba(255,255,255,0.2)',
        color: tab === t ? gold : '#ccc',
      }}
    >
      {txt}
    </button>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {tabBtn('guides', 'Guides')}
        {tabBtn('patch', 'Patch Notes')}
        {tabBtn('infographics', 'Infographics')}
      </div>
      {status && (
        <p style={{ fontSize: '0.85rem', color: gold, marginBottom: '1rem' }}>{status}</p>
      )}
      {tab === 'guides' && <GuidesTab setStatus={setStatus} />}
      {tab === 'patch' && <PatchTab setStatus={setStatus} />}
      {tab === 'infographics' && <InfographicsTab setStatus={setStatus} />}
    </div>
  )
}

// ── Image upload helper ──────────────────────────────────────────────────────
function useImageUpload(setStatus: (s: string) => void) {
  return useCallback(async (file: File): Promise<string | null> => {
    setStatus('Uploading image…')
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/content/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) { setStatus(`Upload failed: ${json.error ?? res.status}`); return null }
    setStatus('Image uploaded.')
    return json.url as string
  }, [setStatus])
}

function ImageField({
  value, onChange, setStatus,
}: { value: string; onChange: (url: string) => void; setStatus: (s: string) => void }) {
  const upload = useImageUpload(setStatus)
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" style={{ maxHeight: '9rem', borderRadius: '0.4rem', border: '1px solid rgba(255,255,255,0.15)', marginBottom: '0.5rem', display: 'block' }} />
      ) : (
        <p style={{ ...hint, marginBottom: '0.5rem' }}>No image yet.</p>
      )}
      <input
        ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f) { const url = await upload(f); if (url) onChange(url) }
          if (ref.current) ref.current.value = ''
        }}
      />
      <button type="button" style={btnQuiet} onClick={() => ref.current?.click()}>
        {value ? 'Replace image' : 'Upload image'}
      </button>
      {value && (
        <button type="button" style={{ ...btnQuiet, marginLeft: '0.5rem' }} onClick={() => onChange('')}>
          Remove
        </button>
      )}
    </div>
  )
}

// ── Guides ───────────────────────────────────────────────────────────────────
type GuideRow = {
  id: string; title: string; description: string; body: string; author: string | null
  pub_date: string | null; cover_image: string | null; tags: string[] | null
  event_type: string | null; event_dates: string | null; recommended_for: string | null
  key_rewards: string[] | null
}

const blankGuide: GuideRow = {
  id: '', title: '', description: '', body: '', author: '', pub_date: '', cover_image: '',
  tags: [], event_type: '', event_dates: '', recommended_for: '', key_rewards: [],
}

function GuidesTab({ setStatus }: { setStatus: (s: string) => void }) {
  const [rows, setRows] = useState<GuideRow[]>([])
  const [editing, setEditing] = useState<GuideRow | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/content/guides')
    if (!res.ok) { setStatus(`Load failed: ${res.status}`); return }
    setRows(await res.json())
  }, [setStatus])
  useEffect(() => { void (async () => { await load() })() }, [load])

  const save = async () => {
    if (!editing) return
    setStatus('Saving…')
    const res = await fetch('/api/admin/content/guides', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editing.id || undefined,
        title: editing.title,
        description: editing.description,
        body: editing.body,
        author: editing.author,
        pubDate: editing.pub_date,
        coverImage: editing.cover_image,
        tags: editing.tags,
        eventType: editing.event_type,
        eventDates: editing.event_dates,
        recommendedFor: editing.recommended_for,
        keyRewards: editing.key_rewards,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setStatus(`Save failed: ${json.error ?? res.status}`); return }
    setStatus('Saved. The live site updates within a minute.')
    setEditing(null)
    load()
  }

  const remove = async (row: GuideRow) => {
    if (!row.id || !window.confirm(`Delete guide “${row.title}”? This can't be undone.`)) return
    const res = await fetch(`/api/admin/content/guides?id=${encodeURIComponent(row.id)}`, { method: 'DELETE' })
    if (!res.ok) { setStatus(`Delete failed: ${res.status}`); return }
    setStatus('Deleted.')
    setEditing(null)
    load()
  }

  const set = (patch: Partial<GuideRow>) => setEditing((e) => (e ? { ...e, ...patch } : e))
  const csv = (a: string[] | null) => (a ?? []).join(', ')
  const toArr = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)

  if (editing) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); save() }} style={{ maxWidth: '760px' }}>
        <label style={label}>Title</label>
        <input style={input} value={editing.title} onChange={(e) => set({ title: e.target.value })} />

        <label style={label}>Slug (URL id)</label>
        <input style={input} value={editing.id} onChange={(e) => set({ id: e.target.value })} placeholder="auto-generated from title if left blank" />
        <p style={hint}>Leave blank on a new guide to derive it from the title. Changing it on an existing guide creates a new URL.</p>

        <label style={label}>Description (card teaser)</label>
        <textarea style={{ ...input, minHeight: '3.5rem' }} value={editing.description} onChange={(e) => set({ description: e.target.value })} />

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={label}>Author</label>
            <input style={input} value={editing.author ?? ''} onChange={(e) => set({ author: e.target.value })} />
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label style={label}>Publish date</label>
            <input style={input} type="date" value={editing.pub_date ?? ''} onChange={(e) => set({ pub_date: e.target.value })} />
          </div>
        </div>

        <label style={label}>Tags (comma-separated)</label>
        <input style={input} value={csv(editing.tags)} onChange={(e) => set({ tags: toArr(e.target.value) })} />

        <label style={label}>Cover image</label>
        <ImageField value={editing.cover_image ?? ''} onChange={(url) => set({ cover_image: url })} setStatus={setStatus} />

        <label style={label}>Body (Markdown)</label>
        <textarea
          style={{ ...input, minHeight: '22rem', fontFamily: 'ui-monospace, monospace', fontSize: '0.82rem', lineHeight: 1.55 }}
          value={editing.body}
          onChange={(e) => set({ body: e.target.value })}
          placeholder="Write in Markdown. Headings (##), lists, images, and callouts ([!TIP], [!NOTE], [!WARNING], [!IMPORTANT], [!F2P]) all render."
        />

        <details style={{ marginTop: '1.25rem' }}>
          <summary style={{ ...label, marginTop: 0, cursor: 'pointer' }}>Event summary box (optional)</summary>
          <div style={{ paddingLeft: '0.5rem' }}>
            <label style={label}>Event type</label>
            <input style={input} value={editing.event_type ?? ''} onChange={(e) => set({ event_type: e.target.value })} />
            <label style={label}>Event dates</label>
            <input style={input} value={editing.event_dates ?? ''} onChange={(e) => set({ event_dates: e.target.value })} />
            <label style={label}>Recommended for</label>
            <input style={input} value={editing.recommended_for ?? ''} onChange={(e) => set({ recommended_for: e.target.value })} />
            <label style={label}>Key rewards (comma-separated)</label>
            <input style={input} value={csv(editing.key_rewards)} onChange={(e) => set({ key_rewards: toArr(e.target.value) })} />
          </div>
        </details>

        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button type="submit" style={btn}>Save &amp; publish</button>
          <button type="button" style={btnQuiet} onClick={() => setEditing(null)}>Cancel</button>
          {editing.id && rows.some((r) => r.id === editing.id) && (
            <button type="button" style={{ ...btnDanger, marginLeft: 'auto' }} onClick={() => remove(editing)}>Delete</button>
          )}
        </div>
      </form>
    )
  }

  return (
    <div>
      <button style={btn} onClick={() => setEditing({ ...blankGuide })}>+ New guide</button>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '1.25rem' }}>
        {rows.map((r) => (
          <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#fff' }}>{r.title}</div>
              <div style={{ ...hint, marginTop: 0 }}>{r.pub_date ?? 'no date'} · {r.id}</div>
            </div>
            <button style={btnQuiet} onClick={() => setEditing(r)}>Edit</button>
          </li>
        ))}
        {rows.length === 0 && <p style={hint}>No guides yet.</p>}
      </ul>
    </div>
  )
}

// ── Patch notes / game info ──────────────────────────────────────────────────
function PatchTab({ setStatus }: { setStatus: (s: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: '760px' }}>
      <GameInfoForm setStatus={setStatus} />
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} />
      <PatchNotesManager setStatus={setStatus} />
    </div>
  )
}

// Latest server + active game codes (patch notes live in their own table now).
function GameInfoForm({ setStatus }: { setStatus: (s: string) => void }) {
  const [latestServer, setLatestServer] = useState('')
  const [gameCodes, setGameCodes] = useState('')

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/admin/content/game-info')
      if (!res.ok) { setStatus(`Load failed: ${res.status}`); return }
      const j = await res.json()
      setLatestServer(j.latest_server ?? '')
      setGameCodes((j.game_codes ?? []).join(', '))
    })()
  }, [setStatus])

  const save = async () => {
    setStatus('Saving…')
    const res = await fetch('/api/admin/content/game-info', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latestServer,
        gameCodes: gameCodes.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    })
    const json = await res.json()
    if (!res.ok) { setStatus(`Save failed: ${json.error ?? res.status}`); return }
    setStatus('Saved. The live site updates within a minute.')
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); save() }}>
      <h3 style={{ marginTop: 0 }}>Server &amp; codes</h3>
      <label style={label}>Latest server</label>
      <input style={{ ...input, maxWidth: '160px' }} value={latestServer} onChange={(e) => setLatestServer(e.target.value)} />
      <label style={label}>Active game codes (comma-separated)</label>
      <input style={input} value={gameCodes} onChange={(e) => setGameCodes(e.target.value)} />
      <div style={{ marginTop: '1rem' }}>
        <button type="submit" style={btn}>Save server &amp; codes</button>
      </div>
    </form>
  )
}

type PatchRow = { id: string; title: string; body: string; published_at: string | null }
const blankPatch = (): PatchRow => ({ id: '', title: 'Patch Notes', body: '', published_at: new Date().toISOString().slice(0, 10) })

// Dated patch-note entries: publishing a new one archives the previous (the
// newest-dated entry is the one shown on the guides hub).
function PatchNotesManager({ setStatus }: { setStatus: (s: string) => void }) {
  const [rows, setRows] = useState<PatchRow[]>([])
  const [editing, setEditing] = useState<PatchRow | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/content/patch-notes')
    if (!res.ok) { setStatus(`Load failed: ${res.status}`); return }
    setRows(await res.json())
  }, [setStatus])
  useEffect(() => { void (async () => { await load() })() }, [load])

  const set = (patch: Partial<PatchRow>) => setEditing((e) => (e ? { ...e, ...patch } : e))

  const save = async () => {
    if (!editing) return
    if (!editing.body.trim()) { setStatus('Patch notes body is required'); return }
    setStatus('Saving…')
    const res = await fetch('/api/admin/content/patch-notes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editing.id || undefined, title: editing.title, body: editing.body, publishedAt: editing.published_at }),
    })
    const json = await res.json()
    if (!res.ok) { setStatus(`Save failed: ${json.error ?? res.status}`); return }
    setStatus('Published. The live site updates within a minute.')
    setEditing(null)
    load()
  }

  const remove = async (row: PatchRow) => {
    if (!row.id || !window.confirm('Delete this patch-notes entry? This can\'t be undone.')) return
    const res = await fetch(`/api/admin/content/patch-notes?id=${encodeURIComponent(row.id)}`, { method: 'DELETE' })
    if (!res.ok) { setStatus(`Delete failed: ${res.status}`); return }
    setStatus('Deleted.')
    setEditing(null)
    load()
  }

  if (editing) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); save() }}>
        <h3 style={{ marginTop: 0 }}>{editing.id ? 'Edit patch notes' : 'New patch notes'}</h3>
        <label style={label}>Title</label>
        <input style={input} value={editing.title} onChange={(e) => set({ title: e.target.value })} />
        <label style={label}>Publish date</label>
        <input style={{ ...input, maxWidth: '180px' }} type="date" value={editing.published_at ?? ''} onChange={(e) => set({ published_at: e.target.value })} />
        <p style={hint}>The newest-dated entry shows on the guides hub; older entries move to the archive automatically.</p>
        <label style={label}>Patch notes</label>
        <textarea style={{ ...input, minHeight: '18rem', lineHeight: 1.55 }} value={editing.body} onChange={(e) => set({ body: e.target.value })} />
        <p style={hint}>Line breaks and commas split sections, matching the patch-notes card rendering.</p>
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button type="submit" style={btn}>{editing.id ? 'Save' : 'Publish'}</button>
          <button type="button" style={btnQuiet} onClick={() => setEditing(null)}>Cancel</button>
          {editing.id && rows.some((r) => r.id === editing.id) && (
            <button type="button" style={{ ...btnDanger, marginLeft: 'auto' }} onClick={() => remove(editing)}>Delete</button>
          )}
        </div>
      </form>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0 }}>Patch notes</h3>
        <button style={btn} onClick={() => setEditing(blankPatch())}>+ New patch notes</button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
        {rows.map((r, i) => (
          <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#fff' }}>
                {r.title || 'Patch Notes'}
                {i === 0 && (
                  <span style={{ marginLeft: '0.6rem', fontSize: '0.6rem', color: gold, border: '1px solid rgba(204,164,83,0.4)', borderRadius: '0.3rem', padding: '0.1rem 0.4rem', verticalAlign: 'middle' }}>CURRENT</span>
                )}
              </div>
              <div style={{ ...hint, marginTop: 0 }}>{r.published_at ?? 'no date'}</div>
            </div>
            <button style={btnQuiet} onClick={() => setEditing(r)}>Edit</button>
          </li>
        ))}
        {rows.length === 0 && <p style={hint}>No patch notes yet.</p>}
      </ul>
    </div>
  )
}

// ── Infographics ─────────────────────────────────────────────────────────────
type InfoRow = {
  id: string; title: string; description: string; image: string | null
  builtin: string | null; credit: string; sort: number | null
}
const blankInfo: InfoRow = { id: '', title: '', description: '', image: '', builtin: null, credit: '', sort: 0 }

function InfographicsTab({ setStatus }: { setStatus: (s: string) => void }) {
  const [rows, setRows] = useState<InfoRow[]>([])
  const [editing, setEditing] = useState<InfoRow | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/content/infographics')
    if (!res.ok) { setStatus(`Load failed: ${res.status}`); return }
    setRows(await res.json())
  }, [setStatus])
  useEffect(() => { void (async () => { await load() })() }, [load])

  const set = (patch: Partial<InfoRow>) => setEditing((e) => (e ? { ...e, ...patch } : e))

  const save = async () => {
    if (!editing) return
    setStatus('Saving…')
    const res = await fetch('/api/admin/content/infographics', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editing.id || undefined,
        title: editing.title,
        description: editing.description,
        image: editing.image,
        builtin: editing.builtin,
        credit: editing.credit,
        sort: editing.sort ?? 0,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setStatus(`Save failed: ${json.error ?? res.status}`); return }
    setStatus('Saved. The live site updates within a minute.')
    setEditing(null)
    load()
  }

  const remove = async (row: InfoRow) => {
    if (!row.id || !window.confirm(`Delete “${row.title}”?`)) return
    const res = await fetch(`/api/admin/content/infographics?id=${encodeURIComponent(row.id)}`, { method: 'DELETE' })
    if (!res.ok) { setStatus(`Delete failed: ${res.status}`); return }
    setStatus('Deleted.')
    setEditing(null)
    load()
  }

  if (editing) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); save() }} style={{ maxWidth: '620px' }}>
        <label style={label}>Title</label>
        <input style={input} value={editing.title} onChange={(e) => set({ title: e.target.value })} />

        <label style={label}>Description (optional)</label>
        <textarea style={{ ...input, minHeight: '3.5rem' }} value={editing.description} onChange={(e) => set({ description: e.target.value })} />

        <label style={label}>Credit</label>
        <input style={input} value={editing.credit} onChange={(e) => set({ credit: e.target.value })} placeholder="e.g. Quantum" />

        <label style={label}>Sort order</label>
        <input style={{ ...input, maxWidth: '120px' }} type="number" value={editing.sort ?? 0} onChange={(e) => set({ sort: Number(e.target.value) })} />

        {editing.builtin ? (
          <p style={{ ...hint, marginTop: '1rem' }}>This is a built-in interactive infographic ({editing.builtin}); it has no uploaded image.</p>
        ) : (
          <>
            <label style={label}>Image</label>
            <ImageField value={editing.image ?? ''} onChange={(url) => set({ image: url })} setStatus={setStatus} />
          </>
        )}

        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button type="submit" style={btn}>Save &amp; publish</button>
          <button type="button" style={btnQuiet} onClick={() => setEditing(null)}>Cancel</button>
          {editing.id && rows.some((r) => r.id === editing.id) && (
            <button type="button" style={{ ...btnDanger, marginLeft: 'auto' }} onClick={() => remove(editing)}>Delete</button>
          )}
        </div>
      </form>
    )
  }

  return (
    <div>
      <button style={btn} onClick={() => setEditing({ ...blankInfo })}>+ New infographic</button>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '1.25rem' }}>
        {rows.map((r) => (
          <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
              {r.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.image} alt="" style={{ width: '3rem', height: '3rem', objectFit: 'cover', borderRadius: '0.35rem', border: '1px solid rgba(255,255,255,0.12)' }} />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: '#fff' }}>{r.title}</div>
                <div style={{ ...hint, marginTop: 0 }}>{r.credit || '—'}{r.builtin ? ` · builtin: ${r.builtin}` : ''}</div>
              </div>
            </div>
            <button style={btnQuiet} onClick={() => setEditing(r)}>Edit</button>
          </li>
        ))}
        {rows.length === 0 && <p style={hint}>No infographics yet.</p>}
      </ul>
    </div>
  )
}
