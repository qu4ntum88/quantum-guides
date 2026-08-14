'use client'

import { useCallback, useEffect, useState } from 'react'
import { btn, btnDanger, btnQuiet, gold, hint } from '@/src/dcdl/components/admin/editor-ui'
import { blocksToHtml, parseGuideBody } from '@/src/dcdl/lib/guide-blocks'

/**
 * Admin review queue for editor submissions — guides and infographics saved by
 * editors are held as `pending` and stay off the public site until approved
 * here. Rejecting keeps the row so the author can revise and resubmit.
 */

type PendingGuide = {
  id: string; title: string; description: string | null; body: string | null
  author: string | null; cover_image: string | null; updated_at: string | null
}
type PendingInfographic = {
  id: string; title: string; description: string | null
  image: string | null; credit: string | null; author_name: string | null
}

const box: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem',
  padding: '0.9rem 1rem', background: 'rgba(0,0,0,0.25)',
}

/**
 * Inline read-through of a pending draft. Block guides render as HTML —
 * blocksToHtml escapes author text and rich paragraphs were already run through
 * sanitizeGuideBody on save — while legacy Markdown drafts are shown as plain
 * text rather than pulling a Markdown renderer into the admin bundle.
 */
function GuidePreview({ body }: { body: string | null }) {
  const parsed = parseGuideBody(body)
  const frame: React.CSSProperties = {
    marginTop: '0.85rem', padding: '1rem', borderRadius: '0.45rem',
    background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)',
    maxHeight: '28rem', overflowY: 'auto', fontSize: '0.86rem', lineHeight: 1.7, color: '#ddd',
  }
  if (parsed.format === 'blocks') {
    return <div style={frame} className="guide-prose" dangerouslySetInnerHTML={{ __html: blocksToHtml(parsed.blocks) }} />
  }
  return <pre style={{ ...frame, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{parsed.markdown || 'This draft is empty.'}</pre>
}

export default function ReviewQueueTab({ setStatus }: { setStatus: (s: string) => void }) {
  const [guides, setGuides] = useState<PendingGuide[]>([])
  const [infographics, setInfographics] = useState<PendingInfographic[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [openGuide, setOpenGuide] = useState<string | null>(null)

  // No synchronous setState — this doubles as the mount effect.
  const load = useCallback(async () => {
    const res = await fetch('/api/admin/content/moderation')
    if (res.ok) {
      const d = await res.json()
      setGuides(d.guides ?? [])
      setInfographics(d.infographics ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await fetch('/api/admin/content/moderation')
      if (cancelled) return
      if (res.ok) {
        const d = await res.json()
        if (cancelled) return
        setGuides(d.guides ?? [])
        setInfographics(d.infographics ?? [])
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  async function act(kind: 'guide' | 'infographic', id: string, action: 'approve' | 'reject') {
    setBusy(id)
    const res = await fetch('/api/admin/content/moderation', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, id, action }),
    })
    setBusy(null)
    setStatus(res.ok
      ? action === 'approve' ? 'Approved — live within about a minute.' : 'Sent back to the author.'
      : 'That did not go through.')
    if (res.ok) load()
  }

  if (loading) return <p style={{ color: '#888' }}>Loading…</p>

  const total = guides.length + infographics.length
  if (total === 0) {
    return <p style={hint}>Nothing waiting for review. Editor submissions land here before they go live.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {guides.length > 0 && (
        <section>
          <h3 style={{ margin: '0 0 0.85rem', fontSize: '1rem' }}>
            Guides <span style={{ color: gold }}>({guides.length})</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {guides.map((g) => (
              <div key={g.id} style={box}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{g.title}</div>
                <div style={hint}>
                  by {g.author ?? 'unknown'}{g.updated_at && ` · ${new Date(g.updated_at).toLocaleDateString()}`}
                </div>
                {g.description && (
                  <p style={{ color: '#bbb', fontSize: '0.84rem', margin: '0.5rem 0 0', lineHeight: 1.6 }}>{g.description}</p>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
                  <button style={btnQuiet} onClick={() => setOpenGuide((cur) => (cur === g.id ? null : g.id))}>
                    {openGuide === g.id ? 'Hide draft' : 'Read draft'}
                  </button>
                  <button style={btn} disabled={busy === g.id} onClick={() => act('guide', g.id, 'approve')}>Approve &amp; publish</button>
                  <button style={btnDanger} disabled={busy === g.id} onClick={() => act('guide', g.id, 'reject')}>Send back</button>
                </div>
                {openGuide === g.id && <GuidePreview body={g.body} />}
              </div>
            ))}
          </div>
        </section>
      )}

      {infographics.length > 0 && (
        <section>
          <h3 style={{ margin: '0 0 0.85rem', fontSize: '1rem' }}>
            Infographics <span style={{ color: gold }}>({infographics.length})</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {infographics.map((i) => (
              <div key={i.id} style={{ ...box, display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {i.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.image} alt="" style={{ width: '9rem', borderRadius: '0.4rem', border: '1px solid rgba(255,255,255,0.15)' }} />
                )}
                <div style={{ flex: 1, minWidth: '12rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{i.title}</div>
                  <div style={hint}>by {i.author_name ?? i.credit ?? 'unknown'}</div>
                  {i.description && (
                    <p style={{ color: '#bbb', fontSize: '0.84rem', margin: '0.5rem 0 0', lineHeight: 1.6 }}>{i.description}</p>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
                    <button style={btn} disabled={busy === i.id} onClick={() => act('infographic', i.id, 'approve')}>Approve &amp; publish</button>
                    <button style={btnDanger} disabled={busy === i.id} onClick={() => act('infographic', i.id, 'reject')}>Send back</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
