'use client'

import { useState } from 'react'
import { exportTierListPng, type ExportItem } from '@/src/dcdl/lib/tier-export'

/**
 * Download-as-PNG button. Shared by the official tier list, every creator list,
 * and the studio preview so all three produce an identical graphic.
 */
export default function ExportTierListButton({
  title,
  subtitle,
  items,
  tiers,
  fit = 'cover',
  filename,
  style,
}: {
  title: string
  subtitle?: string
  items: ExportItem[]
  tiers: readonly string[]
  fit?: 'cover' | 'contain'
  filename?: string
  style?: React.CSSProperties
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run() {
    setBusy(true); setError('')
    try {
      await exportTierListPng({ title, subtitle, items, tiers, fit, filename })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.')
    }
    setBusy(false)
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
      <button
        type="button"
        onClick={run}
        disabled={busy || items.length === 0}
        style={{
          padding: '0.5rem 1.05rem', borderRadius: '0.4rem',
          border: '1px solid var(--gold)', background: 'transparent', color: 'var(--gold)',
          fontWeight: 700, fontSize: '0.78rem', cursor: busy ? 'wait' : 'pointer',
          fontFamily: 'Unbounded, sans-serif', opacity: items.length === 0 ? 0.4 : 1,
          ...style,
        }}
      >
        {busy ? 'Rendering…' : '⤓ Export PNG'}
      </button>
      {error && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{error}</span>}
    </span>
  )
}
