'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Start / stop the Void Hunters fight recorder from the Site Admin (Game Data tab and the
 * Void Hunters Status Effects tab). The recorder saves every battle's log so the real numbers
 * behind status effects and skills can be read later (see /api/admin/vh/fight-recorder).
 * Local dev only: on the live site the route answers 403 and this card renders nothing.
 */

type State = {
  installed: boolean
  running: boolean
  stopping: boolean
  startedAt: string | null
  savedThisSession: number
  lastSaved: string | null
  totalSaved: number
  reportUpdated: string | null
  folder: string
}

const API = '/api/admin/vh/fight-recorder'
const card: React.CSSProperties = { background: '#16121f', border: '1px solid #2e2640', borderRadius: '0.5rem', padding: '1rem 1.25rem' }
const quiet: React.CSSProperties = { background: 'none', border: '1px solid #3a3150', borderRadius: '0.375rem', color: '#c9bfe0', cursor: 'pointer', fontSize: '0.8rem', padding: '0.35rem 0.8rem' }
const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

async function fetchState(): Promise<State | null> {
  const res = await fetch(API).catch(() => null)
  return res?.ok ? res.json() : null
}

export default function FightRecorderCard() {
  const [state, setState] = useState<State | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState<string | null>(null)

  const refresh = useCallback(async () => setState(await fetchState()), [])

  // Poll while the card is on screen; no synchronous setState in the effect itself.
  useEffect(() => {
    let cancelled = false
    const tick = async () => { const s = await fetchState(); if (!cancelled) setState(s) }
    void tick()
    const id = setInterval(tick, 3000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  const act = async (action: 'start' | 'stop') => {
    setBusy(true); setError('')
    const res = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action }) })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) setError(d.error || `Couldn't ${action} the recorder`)
    // The recorder takes a second or two to start or notice Stop.
    setTimeout(async () => { await refresh(); setBusy(false) }, 2500)
  }

  const toggleReport = async () => {
    if (report != null) { setReport(null); return }
    const res = await fetch(`${API}?report=1`)
    const d = await res.json().catch(() => ({}))
    if (!res.ok) setError(d.error || 'No report yet'); else setReport(d.text)
  }

  if (!state || !state.installed) return null
  const on = state.running && !state.stopping

  return (
    <section style={{ ...card, borderColor: on ? 'rgba(74,222,128,0.45)' : '#2e2640' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--gold)', flex: '1 1 auto' }}>Void Hunters fight recorder</h3>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: on ? '#4ade80' : '#9a90ad' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: on ? '#4ade80' : '#555', boxShadow: on ? '0 0 8px #4ade80' : 'none' }} />
          {state.stopping ? 'Stopping…' : on ? `Recording since ${time(state.startedAt!)}` : 'Off'}
        </span>
        <button type="button" className="btn" disabled={busy || state.stopping} onClick={() => act(on ? 'stop' : 'start')}
          style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', opacity: busy ? 0.6 : 1 }}>
          {busy ? '…' : on ? 'Stop recording' : 'Start recording'}
        </button>
      </div>
      <p style={{ color: '#9a90ad', fontSize: '0.8rem', margin: '0.6rem 0 0' }}>
        {on
          ? <>Play normally: each battle is saved a few seconds after it ends{state.savedThisSession ? ` (${state.savedThisSession} so far${state.lastSaved ? `, last: ${state.lastSaved}` : ''})` : ''}. It runs in its own window, so it keeps going if you close this page.</>
          : <>Press Start before you play Void Hunters. It saves every battle&apos;s log, which holds the real numbers behind the X / Y on the status effects page and each boss&apos;s skills. The game keeps only the last battle, so anything played while this is off is lost.</>}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.6rem', fontSize: '0.8rem', color: '#9a90ad' }}>
        <span>{state.totalSaved} fight{state.totalSaved === 1 ? '' : 's'} saved{state.reportUpdated ? ` · report updated ${new Date(state.reportUpdated).toLocaleString()}` : ''}</span>
        {state.reportUpdated && <button type="button" style={quiet} onClick={toggleReport}>{report != null ? 'Hide report' : 'View report'}</button>}
      </div>
      {error && <p style={{ color: '#f87171', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>{error}</p>}
      {report != null && (
        <pre style={{ maxHeight: '28rem', overflow: 'auto', background: '#0c0a12', borderRadius: '0.375rem', padding: '0.75rem', fontSize: '0.75rem', whiteSpace: 'pre-wrap', margin: '0.75rem 0 0' }}>
          {report}
        </pre>
      )}
    </section>
  )
}
