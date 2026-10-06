'use client'

import type { ReactNode } from 'react'
import { inColumn, type TierColumn, type TierRow } from '@/src/dcdl/lib/tier-rows'
import './tier-view.css'

/**
 * The Tier List view of a database page: rows of tiers, one column per role
 * group, with the page's own tiles in the cells.
 *
 * Filters never remove anything here — entries that don't match are dimmed
 * (`dim`), so the board keeps its shape and you can still see where everything
 * sits. On phones the table stacks: each tier becomes a full-width band and
 * its role groups sit one under another (see tier-view.css).
 *
 * Game-agnostic on purpose: rows, columns and the tile markup all come in as
 * props.
 */

export type TierViewEntry = {
  id: string
  /** Which row (TierRow.key) the entry sits in. */
  row: string
  /** Class/role string, bucketed into columns via inColumn(). */
  group: string
  dim: boolean
  node: ReactNode
}

function RoleIcons({ col }: { col: TierColumn }) {
  return (
    <span className="tv-icons">
      {col.classes.map((cls) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={cls} src={`/dcdl/role_images/${cls}.png`} alt={cls} title={cls} />
      ))}
    </span>
  )
}

export default function TierView({
  title,
  rows,
  columns,
  entries,
  watermark,
}: {
  title: string
  rows: TierRow[]
  columns: TierColumn[]
  entries: TierViewEntry[]
  watermark?: { src: string; side: 'left' | 'right' }
}) {
  const visibleRows = rows.filter((r) => !r.hideWhenEmpty || entries.some((e) => e.row === r.key))

  return (
    <div className="tv-board" style={{ '--tv-cols': columns.length } as React.CSSProperties}>
      <div className="tv-title">{title}</div>

      <div className="tv-head">
        <div />
        {columns.map((col) => (
          <div key={col.label} className="tv-colhead">
            <RoleIcons col={col} />
            <span className="tv-colhead-label">{col.label}</span>
          </div>
        ))}
      </div>

      {visibleRows.map((row) => {
        const inRow = entries.filter((e) => e.row === row.key)
        const allDim = inRow.length > 0 && inRow.every((e) => e.dim)
        return (
          <section
            key={row.key}
            className={`tv-row${allDim ? ' is-dim' : ''}`}
            style={{ '--tv-color': row.color } as React.CSSProperties}
          >
            <div className="tv-badgecell">
              <span className={`tv-badge${row.badge.length > 2 ? ' is-long' : ''}`}>{row.badge}</span>
              <span className="tv-caption">{row.label}</span>
            </div>
            {columns.map((col) => {
              const cell = inRow.filter((e) => inColumn(col, e.group))
              return (
                <div key={col.label} className={`tv-cell${cell.length === 0 ? ' is-empty' : ''}`}>
                  <div className="tv-cellhead">
                    <RoleIcons col={col} />
                    <span>{col.label}</span>
                  </div>
                  {cell.length === 0 ? (
                    <span className="tv-dash">—</span>
                  ) : (
                    <div className="tv-tiles">
                      {cell.map((e) => (
                        <div key={e.id} className={`tv-tile${e.dim ? ' is-dim' : ''}`}>{e.node}</div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </section>
        )
      })}

      {watermark && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={watermark.src} alt="" aria-hidden="true" className={`tv-watermark is-${watermark.side}`} />
      )}
    </div>
  )
}
