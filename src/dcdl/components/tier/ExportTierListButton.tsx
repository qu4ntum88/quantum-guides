'use client'

import { useState } from 'react'
import {
  exportTierListPng,
  type ExportColumn,
  type ExportItem,
  type ExportShowcase,
} from '@/src/dcdl/lib/tier-export'

/**
 * Download-as-PNG button. Shared by the official tier list, every creator list,
 * and the studio preview.
 *
 * `layout` picks which of the two body renderings the PNG uses so the download
 * matches the page it was taken from: 'columns' for the official role-group
 * table, the default 'rows' for <TierBoard>-style lists.
 */
export default function ExportTierListButton({
  title,
  subtitle,
  dateLine,
  items,
  tiers,
  fit = 'cover',
  filename,
  layout,
  columns,
  tierLabels,
  tierColors,
  tierBadges,
  boardTitle,
  showcases,
  watermark,
  style,
  label = '⤓ Export PNG',
}: {
  title: string
  subtitle?: string
  dateLine?: string
  items: ExportItem[]
  tiers: readonly string[]
  fit?: 'cover' | 'contain'
  filename?: string
  layout?: 'rows' | 'columns'
  columns?: ExportColumn[]
  tierLabels?: Record<string, string>
  tierColors?: Record<string, string>
  tierBadges?: Record<string, string>
  boardTitle?: string
  showcases?: ExportShowcase[]
  watermark?: { src: string; side: 'left' | 'right' }
  style?: React.CSSProperties
  label?: string
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run() {
    setBusy(true); setError('')
    try {
      await exportTierListPng({
        title, subtitle, dateLine, items, tiers, fit, filename,
        layout, columns, tierLabels, tierColors, tierBadges, boardTitle, showcases, watermark,
      })
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
        {busy ? 'Rendering…' : label}
      </button>
      {error && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{error}</span>}
    </span>
  )
}
