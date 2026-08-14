'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ROLE_LABEL, type Role } from '@/src/lib/roles'

/**
 * Creator Program panel on the members page.
 *
 * Members apply here for creator or editor status; anyone who already holds a
 * role sees their badge and a link into the studio instead of the form.
 */

type Application = {
  id: string
  requested_role: 'creator' | 'editor'
  creator_name: string
  status: 'pending' | 'approved' | 'rejected'
  review_note: string | null
  created_at: string
}

const gold = 'var(--gold)'

const card: React.CSSProperties = {
  background: 'var(--light-bg)',
  border: '1px solid #333',
  borderRadius: '0.6rem',
  padding: '1.25rem 1.35rem',
}

const label: React.CSSProperties = {
  display: 'block', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: gold, marginBottom: '0.35rem', marginTop: '1rem',
}

const input: React.CSSProperties = {
  width: '100%', padding: '0.55rem 0.7rem', borderRadius: '0.4rem',
  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.35)',
  color: '#fff', fontSize: '0.9rem', fontFamily: 'inherit',
}

const btn: React.CSSProperties = {
  padding: '0.55rem 1.2rem', borderRadius: '0.4rem', border: `1px solid ${gold}`,
  background: gold, color: '#0a0a14', fontWeight: 700, fontSize: '0.8rem',
  cursor: 'pointer', fontFamily: 'Unbounded, sans-serif',
}

const PERKS: Record<'creator' | 'editor', string[]> = {
  creator: ['Build and publish your own champion and legacy piece tier lists'],
  editor: [
    'Everything a creator can do',
    'Write guides for the site (reviewed before publishing)',
    'Upload infographics (reviewed before publishing)',
  ],
}

export default function ApplyPanel() {
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<Role>('member')
  const [application, setApplication] = useState<Application | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [requestedRole, setRequestedRole] = useState<'creator' | 'editor'>('creator')
  const [creatorName, setCreatorName] = useState('')
  const [discordName, setDiscordName] = useState('')
  const [links, setLinks] = useState('')
  const [pitch, setPitch] = useState('')

  useEffect(() => {
    fetch('/api/roles/apply')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) { setRole(d.role as Role); setApplication(d.application) }
      })
      .finally(() => setLoading(false))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    const res = await fetch('/api/roles/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestedRole, creatorName, discordName, links, pitch }),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(json.error ?? 'Something went wrong. Try again.'); return }
    setOpen(false)
    setApplication({
      id: 'new', requested_role: requestedRole, creator_name: creatorName,
      status: 'pending', review_note: null, created_at: new Date().toISOString(),
    })
  }

  if (loading) return null

  // Already a creator/editor/admin — point them at their tools.
  if (role !== 'member') {
    return (
      <div style={{ ...card, borderColor: `${gold}55`, marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Creator Studio</h2>
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#0a0a14', background: gold, padding: '0.2rem 0.5rem', borderRadius: '999px',
            }}>{ROLE_LABEL[role]}</span>
          </div>
          <p style={{ color: '#aaa', margin: '0.4rem 0 0', fontSize: '0.85rem' }}>
            Build tier lists{role !== 'creator' ? ', write guides, and upload infographics' : ''} from any device.
          </p>
        </div>
        <Link href="/studio" style={{ ...btn, textDecoration: 'none' }}>Open Studio</Link>
      </div>
    )
  }

  if (application?.status === 'pending') {
    return (
      <div style={{ ...card, marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.05rem' }}>Application received</h2>
        <p style={{ color: '#aaa', margin: 0, fontSize: '0.85rem' }}>
          Your application for <strong style={{ color: gold }}>{ROLE_LABEL[application.requested_role]}</strong> as{' '}
          <strong style={{ color: '#fff' }}>{application.creator_name}</strong> is awaiting review. You&rsquo;ll see your
          new tools here once it&rsquo;s approved.
        </p>
      </div>
    )
  }

  return (
    <div style={{ ...card, marginBottom: '2rem' }}>
      <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.05rem' }}>Join the Creator Program</h2>
      <p style={{ color: '#aaa', margin: 0, fontSize: '0.85rem', lineHeight: 1.6 }}>
        Approved creators publish their own champion and legacy piece tier lists on the site, credited by name.
        Editors also write guides and upload infographics.
      </p>

      {application?.status === 'rejected' && (
        <p style={{ color: '#f87171', fontSize: '0.8rem', margin: '0.85rem 0 0' }}>
          Your previous application wasn&rsquo;t approved{application.review_note ? `: ${application.review_note}` : '.'} You&rsquo;re welcome to apply again.
        </p>
      )}

      {!open && (
        <button type="button" style={{ ...btn, marginTop: '1rem' }} onClick={() => setOpen(true)}>
          Apply for Creator Status
        </button>
      )}

      {open && (
        <form onSubmit={submit} style={{ marginTop: '0.5rem' }}>
          <span style={label}>What are you applying for?</span>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {(['creator', 'editor'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRequestedRole(r)}
                style={{
                  flex: '1 1 14rem', textAlign: 'left', cursor: 'pointer',
                  padding: '0.75rem 0.9rem', borderRadius: '0.45rem',
                  border: `1px solid ${requestedRole === r ? gold : 'rgba(255,255,255,0.15)'}`,
                  background: requestedRole === r ? 'rgba(201,160,30,0.12)' : 'rgba(0,0,0,0.25)',
                  color: '#fff',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: requestedRole === r ? gold : '#fff' }}>
                  {ROLE_LABEL[r]}
                </div>
                <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1rem', color: '#aaa', fontSize: '0.75rem', lineHeight: 1.5 }}>
                  {PERKS[r].map((p) => <li key={p}>{p}</li>)}
                </ul>
              </button>
            ))}
          </div>

          <label style={label} htmlFor="apply-name">Creator name (your public byline)</label>
          <input id="apply-name" style={input} value={creatorName} maxLength={40} required
            onChange={(e) => setCreatorName(e.target.value)} placeholder="e.g. Tyvokka" />
          <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.25rem' }}>
            Tier lists you publish will be titled &ldquo;{creatorName.trim() || 'Your Name'}&rsquo;s Champion Tier List&rdquo;.
          </p>

          <label style={label} htmlFor="apply-discord">Discord name</label>
          <input id="apply-discord" style={input} value={discordName} maxLength={60}
            onChange={(e) => setDiscordName(e.target.value)} placeholder="e.g. quantum" />

          <label style={label} htmlFor="apply-links">Links (YouTube, TikTok, Discord server, etc.)</label>
          <input id="apply-links" style={input} value={links} maxLength={1000}
            onChange={(e) => setLinks(e.target.value)} placeholder="One per line or comma separated" />

          <label style={label} htmlFor="apply-pitch">Why do you want to contribute?</label>
          <textarea id="apply-pitch" style={{ ...input, minHeight: '6rem', resize: 'vertical' }}
            value={pitch} maxLength={4000} onChange={(e) => setPitch(e.target.value)}
            placeholder="Tell Quantum about your experience with the game and what you'd like to create." />

          {error && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.75rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.1rem' }}>
            <button type="submit" style={btn} disabled={busy}>{busy ? 'Submitting…' : 'Submit Application'}</button>
            <button type="button" style={{ ...btn, background: 'transparent', color: '#ccc', borderColor: 'rgba(255,255,255,0.2)' }}
              onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}
