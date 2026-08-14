'use client'

import { useCallback, useEffect, useState } from 'react'
import { ROLE_LABEL, type Role } from '@/src/lib/roles'
import { btn, btnDanger, btnQuiet, gold, hint } from '@/src/dcdl/components/admin/editor-ui'

/**
 * Admin tab for reviewing creator/editor applications and managing who
 * currently holds a role. Email and username come from Clerk through the
 * admin-gated API — they are never exposed to the public site.
 */

type Application = {
  id: string
  user_id: string
  requested_role: 'creator' | 'editor'
  creator_name: string
  email: string | null
  username: string | null
  discord_name: string | null
  links: string | null
  pitch: string | null
  status: 'pending' | 'approved' | 'rejected'
  review_note: string | null
  created_at: string
  currentRole: Role
}

type Staff = {
  userId: string
  email: string | null
  username: string | null
  role: Role
  creatorName: string | null
}

const box: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem',
  padding: '1rem 1.1rem', background: 'rgba(0,0,0,0.25)',
}

export default function ApplicationsTab({ setStatus }: { setStatus: (s: string) => void }) {
  const [applications, setApplications] = useState<Application[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [showHandled, setShowHandled] = useState(false)

  // No synchronous setState — this doubles as the mount effect.
  const load = useCallback(async () => {
    const res = await fetch('/api/admin/roles')
    if (res.ok) {
      const d = await res.json()
      setApplications(d.applications ?? [])
      setStaff(d.staff ?? [])
    } else {
      setStatus('Could not load applications.')
    }
    setLoading(false)
  }, [setStatus])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await fetch('/api/admin/roles')
      if (cancelled) return
      if (!res.ok) { setStatus('Could not load applications.'); setLoading(false); return }
      const d = await res.json()
      if (cancelled) return
      setApplications(d.applications ?? [])
      setStaff(d.staff ?? [])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [setStatus])

  async function act(id: string, action: 'approve' | 'reject', grantRole?: Role) {
    setBusy(id)
    const res = await fetch('/api/admin/roles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, grantRole }),
    })
    setBusy(null)
    setStatus(res.ok
      ? action === 'approve' ? 'Approved — their tools unlock on their next page load.' : 'Application rejected.'
      : 'That did not go through.')
    if (res.ok) load()
  }

  async function setRole(userId: string, role: Role) {
    setBusy(userId)
    const res = await fetch('/api/admin/roles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, setRole: role }),
    })
    setBusy(null)
    setStatus(res.ok ? `Role updated to ${ROLE_LABEL[role]}.` : 'Role change failed.')
    if (res.ok) load()
  }

  if (loading) return <p style={{ color: '#888' }}>Loading…</p>

  const pending = applications.filter((a) => a.status === 'pending')
  const handled = applications.filter((a) => a.status !== 'pending')

  return (
    <div>
      <h3 style={{ margin: '0 0 0.85rem', fontSize: '1rem' }}>
        Pending applications {pending.length > 0 && <span style={{ color: gold }}>({pending.length})</span>}
      </h3>

      {pending.length === 0 && <p style={{ ...hint, marginBottom: '2rem' }}>Nothing waiting for review.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
        {pending.map((a) => (
          <div key={a.id} style={box}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '1rem', color: gold }}>{a.creator_name}</strong>
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#0a0a14', background: gold, padding: '0.15rem 0.45rem', borderRadius: '999px',
              }}>applying: {ROLE_LABEL[a.requested_role]}</span>
              <span style={hint}>{new Date(a.created_at).toLocaleDateString()}</span>
            </div>

            <dl style={{ margin: '0.75rem 0 0', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.3rem 0.85rem', fontSize: '0.82rem' }}>
              <dt style={{ color: '#777' }}>Email</dt>
              <dd style={{ margin: 0, color: '#ddd', wordBreak: 'break-all' }}>{a.email ?? '—'}</dd>
              <dt style={{ color: '#777' }}>Username</dt>
              <dd style={{ margin: 0, color: '#ddd' }}>{a.username ?? '—'}</dd>
              {a.discord_name && (<>
                <dt style={{ color: '#777' }}>Discord</dt>
                <dd style={{ margin: 0, color: '#ddd' }}>{a.discord_name}</dd>
              </>)}
              {a.links && (<>
                <dt style={{ color: '#777' }}>Links</dt>
                <dd style={{ margin: 0, color: '#ddd', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{a.links}</dd>
              </>)}
            </dl>

            {a.pitch && (
              <p style={{ margin: '0.85rem 0 0', color: '#bbb', fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {a.pitch}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button style={btn} disabled={busy === a.id}
                onClick={() => act(a.id, 'approve')}>
                Approve as {ROLE_LABEL[a.requested_role]}
              </button>
              {a.requested_role === 'editor' && (
                <button style={btnQuiet} disabled={busy === a.id}
                  onClick={() => act(a.id, 'approve', 'creator')}>
                  Approve as Creator instead
                </button>
              )}
              <button style={btnDanger} disabled={busy === a.id} onClick={() => act(a.id, 'reject')}>Reject</button>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ margin: '0 0 0.85rem', fontSize: '1rem' }}>Current creators &amp; editors</h3>
      {staff.length === 0 && <p style={hint}>Nobody holds a role yet.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {staff.map((s) => (
          <div key={s.userId} style={{ ...box, display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', padding: '0.7rem 1rem' }}>
            <div style={{ flex: 1, minWidth: '12rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {s.creatorName ?? s.username ?? s.email ?? s.userId}
                <span style={{ color: gold, fontSize: '0.72rem', marginLeft: '0.6rem' }}>{ROLE_LABEL[s.role]}</span>
              </div>
              <div style={{ ...hint, wordBreak: 'break-all' }}>{s.email ?? '—'}</div>
            </div>
            {s.role !== 'admin' && (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {s.role !== 'editor' && (
                  <button style={btnQuiet} disabled={busy === s.userId} onClick={() => setRole(s.userId, 'editor')}>
                    Promote to Editor
                  </button>
                )}
                {s.role !== 'creator' && (
                  <button style={btnQuiet} disabled={busy === s.userId} onClick={() => setRole(s.userId, 'creator')}>
                    Set to Creator
                  </button>
                )}
                <button style={btnDanger} disabled={busy === s.userId}
                  onClick={() => { if (confirm('Remove this person’s role? Their published work stays up.')) setRole(s.userId, 'member') }}>
                  Revoke
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {handled.length > 0 && (
        <div style={{ marginTop: '2.5rem' }}>
          <button style={btnQuiet} onClick={() => setShowHandled((v) => !v)}>
            {showHandled ? 'Hide' : 'Show'} past applications ({handled.length})
          </button>
          {showHandled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.85rem' }}>
              {handled.map((a) => (
                <div key={a.id} style={{ ...box, padding: '0.7rem 1rem' }}>
                  <div style={{ fontSize: '0.85rem' }}>
                    <strong>{a.creator_name}</strong>{' '}
                    <span style={{ color: a.status === 'approved' ? '#22c55e' : '#f87171' }}>{a.status}</span>
                    <span style={{ color: '#777' }}> · {ROLE_LABEL[a.requested_role]} · {a.email ?? '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
