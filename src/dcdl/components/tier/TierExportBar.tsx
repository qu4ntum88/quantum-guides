'use client'

import ExportTierListButton from './ExportTierListButton'
import type { ExportItem } from '@/src/dcdl/lib/tier-export'
import type { TierColumn, TierRow } from '@/src/dcdl/lib/tier-rows'

/**
 * Export buttons for a <TierView>. Always offers the full list; while a filter
 * is active it also offers the board as currently highlighted — non-matching
 * entries drawn faded, and the active filters named under the title.
 *
 * `items` carry `tier` = the TierRow key and `dimmed` = filtered out.
 */
export default function TierExportBar({
  title,
  filename,
  dateLine,
  rows,
  columns,
  items,
  highlight,
  fit,
  watermark,
}: {
  title: string
  filename: string
  dateLine?: string
  rows: TierRow[]
  columns: TierColumn[]
  items: ExportItem[]
  /** Human summary of the active filters, or null when nothing is filtered. */
  highlight: string | null
  fit?: 'cover' | 'contain'
  watermark?: { src: string; side: 'left' | 'right' }
}) {
  const visibleRows = rows.filter((r) => !r.hideWhenEmpty || items.some((i) => i.tier === r.key))
  const shared = {
    title,
    dateLine,
    tiers: visibleRows.map((r) => r.key),
    tierLabels: Object.fromEntries(visibleRows.map((r) => [r.key, r.label])),
    tierColors: Object.fromEntries(visibleRows.map((r) => [r.key, r.color])),
    tierBadges: Object.fromEntries(visibleRows.map((r) => [r.key, r.badge])),
    layout: 'columns' as const,
    columns,
    boardTitle: title,
    fit,
    watermark,
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <ExportTierListButton
        {...shared}
        items={items.map((i) => ({ ...i, dimmed: false }))}
        filename={filename}
        label={highlight ? '⤓ Export Full List' : '⤓ Export PNG'}
      />
      {highlight && (
        <ExportTierListButton
          {...shared}
          subtitle={`Highlighted: ${highlight}`}
          items={items}
          filename={`${filename}-highlighted`}
          label="⤓ Export Highlighted"
          style={{ background: 'rgba(201,160,30,0.15)' }}
        />
      )}
    </div>
  )
}
