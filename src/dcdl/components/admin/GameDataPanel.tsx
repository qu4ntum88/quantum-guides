'use client'

// Admin "Game Data" tab: buttons for the game-data pipeline (AssetStudio extraction,
// change reports) and the scripts that sync extracted data into the site's JSON.
// Talks to /api/admin/pipeline, which only runs a fixed list of jobs and is local-only.

import { useCallback, useEffect, useRef, useState } from 'react'

type Job = { id: string; group: string; label: string; note?: string; report?: string }
type Run = { id: string; job: string; startedAt: number; endedAt?: number; code?: number | null; log?: string; logTail?: string; elapsed?: number }

const card: React.CSSProperties = { background: '#16121f', border: '1px solid #2e2640', borderRadius: '0.5rem', padding: '1rem 1.25rem' }

export default function GameDataPanel() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [exportsDir, setExportsDir] = useState('')
  const [active, setActive] = useState<Run | null>(null)
  const [error, setError] = useState('')
  const [report, setReport] = useState<{ file: string; text: string } | null>(null)
  const poll = useRef<ReturnType<typeof setInterval> | null>(null)
  const logRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    fetch('/api/admin/pipeline').then((r) => r.json()).then((d) => { setJobs(d.jobs || []); setExportsDir(d.exportsDir || '') })
    return () => { if (poll.current) clearInterval(poll.current) }
  }, [])

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [active?.log])

  const watch = useCallback((id: string) => {
    if (poll.current) clearInterval(poll.current)
    const tick = async () => {
      const r: Run = await fetch(`/api/admin/pipeline?run=${encodeURIComponent(id)}`).then((x) => x.json())
      setActive({ ...r, elapsed: Math.round(((r.endedAt ?? Date.now()) - r.startedAt) / 1000) })
      if (r.endedAt && poll.current) { clearInterval(poll.current); poll.current = null }
    }
    tick()
    poll.current = setInterval(tick, 1500)
  }, [])

  const start = async (job: Job) => {
    setError('')
    if (/apply/i.test(job.label) && !confirm(`${job.label}?\n\n${job.note ?? ''}`)) return
    const res = await fetch('/api/admin/pipeline', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ job: job.id }) })
    const d = await res.json()
    if (!res.ok) { setError(d.error || 'Failed to start'); return }
    watch(d.id)
  }

  const showReport = async (game: string) => {
    setReport(await fetch(`/api/admin/pipeline?report=${game}`).then((r) => r.json()))
  }

  const running = active && !active.endedAt
  const groups = [...new Set(jobs.map((j) => j.group))]

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
        Pulls data straight from the game installs on this PC into <code>{exportsDir || 'E:\\GameAssets\\Exports'}</code>, then syncs
        selected parts into the site. Nothing here publishes anything: review the changes, then commit.
      </p>

      {groups.map((group) => (
        <section key={group} style={card}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: 'var(--gold)' }}>{group}</h3>
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {jobs.filter((j) => j.group === group).map((j) => (
              <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn" disabled={!!running} onClick={() => start(j)}
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', minWidth: '15rem', opacity: running ? 0.5 : 1 }}>
                  {j.label}
                </button>
                <span style={{ color: '#9a90ad', fontSize: '0.8rem', flex: 1, minWidth: '12rem' }}>{j.note}</span>
              </div>
            ))}
            {jobs.some((j) => j.group === group && j.report) && (
              <button type="button" onClick={() => showReport(jobs.find((j) => j.group === group && j.report)!.report!)}
                style={{ alignSelf: 'flex-start', background: 'none', border: '1px solid #3a3150', borderRadius: '0.375rem', color: '#c9bfe0', cursor: 'pointer', fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}>
                View latest review report
              </button>
            )}
          </div>
        </section>
      ))}

      {error && <p style={{ color: '#f87171', margin: 0 }}>{error}</p>}

      {active && (
        <section style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <strong>{jobs.find((j) => j.id === active.job)?.label ?? active.job}</strong>
            <span style={{ color: running ? 'var(--gold)' : active.code === 0 ? '#4ade80' : '#f87171' }}>
              {running ? `Running… ${active.elapsed ?? 0}s` : active.code === 0 ? 'Finished' : `Exited with code ${active.code}`}
            </span>
          </div>
          <pre ref={logRef} style={{ maxHeight: '22rem', overflow: 'auto', background: '#0c0a12', borderRadius: '0.375rem', padding: '0.75rem', fontSize: '0.75rem', whiteSpace: 'pre-wrap', margin: 0 }}>
            {active.log || '…'}
          </pre>
        </section>
      )}

      {report && (
        <section style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <strong>{report.file}</strong>
            <button type="button" onClick={() => setReport(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>Close</button>
          </div>
          <pre style={{ maxHeight: '28rem', overflow: 'auto', background: '#0c0a12', borderRadius: '0.375rem', padding: '0.75rem', fontSize: '0.75rem', whiteSpace: 'pre-wrap', margin: 0 }}>
            {report.text}
          </pre>
        </section>
      )}
    </div>
  )
}
