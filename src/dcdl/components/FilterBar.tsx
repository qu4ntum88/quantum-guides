'use client'

import { useEffect, useRef, useState, type ReactNode } from "react"

/**
 * Compact filter controls for the database pages.
 *
 * Every filter group collapses into a chip ("Class ▾ 2"); tapping one opens
 * its full set of buttons in a panel under the chip row. Whatever is selected
 * shows as removable pills, so the active filters stay visible without the
 * groups taking up the screen. Panels close on outside click or Escape.
 *
 */

export type FilterGroup = {
  id: string
  label: string
  /** Number of selected values; shown as a badge on the chip. */
  count?: number
  /** Overrides the badge with text, e.g. the current sort. */
  value?: string
  content: ReactNode
  onClear?: () => void
}

export type FilterPill = { key: string; label: string; icon?: string; onRemove: () => void }

export default function FilterBar({ groups, pills, after }: {
  groups: FilterGroup[]
  pills: FilterPill[]
  /** Extra content at the end of the pill row (e.g. a match count). */
  after?: ReactNode
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const open = groups.find((g) => g.id === openId) ?? null

  useEffect(() => {
    if (!openId) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenId(null)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenId(null) }
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [openId])

  return (
    <div ref={ref} className="qfb">
      <div className="qfb-anchor">
      <div className="qfb-chips" role="toolbar" aria-label="Filters">
        {groups.map((g) => {
          const active = (g.count ?? 0) > 0
          const isOpen = g.id === openId
          return (
            <button
              key={g.id}
              type="button"
              className={`qfb-chip${active ? " is-active" : ""}${isOpen ? " is-open" : ""}`}
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : g.id)}
            >
              {g.label}
              {g.value ? <span className="qfb-value">{g.value}</span> : active && <span className="qfb-count">{g.count}</span>}
              <span className="qfb-caret" aria-hidden="true">▾</span>
            </button>
          )
        })}
      </div>

      {open && (
        <div className="qfb-panel" role="dialog" aria-label={open.label}>
          <div className="qfb-panel-head">
            <span>{open.label}</span>
            <span style={{ display: "flex", gap: "0.4rem" }}>
              {open.onClear && (open.count ?? 0) > 0 && (
                <button type="button" className="qfb-link" onClick={open.onClear}>Clear</button>
              )}
              <button type="button" className="qfb-link" onClick={() => setOpenId(null)}>Done</button>
            </span>
          </div>
          <div className="qfb-panel-body">{open.content}</div>
        </div>
      )}
      </div>

      {(pills.length > 0 || after) && (
        <div className="qfb-pills">
          {pills.map((p) => (
            <button key={p.key} type="button" className="qfb-pill" onClick={p.onRemove} title={`Remove ${p.label}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.icon && <img src={p.icon} alt="" />}
              {p.label}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          {after}
        </div>
      )}

      <style>{`
        .qfb { display: flex; flex-direction: column; gap: 0.5rem; }
        .qfb-anchor { position: relative; }
        .qfb-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .qfb-chip {
          display: inline-flex; align-items: center; gap: 0.4rem; flex-shrink: 0;
          padding: 0.4rem 0.75rem; border-radius: 999px; cursor: pointer;
          border: 2px solid #444; background: transparent; color: #aaa;
          font-family: Unbounded, sans-serif; font-size: 0.62rem; font-weight: 700;
          letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap;
          transition: all 0.15s;
        }
        .qfb-chip:hover { color: #ddd; border-color: #666; }
        .qfb-chip.is-active { color: var(--gold); border-color: var(--gold); background: rgba(124,58,237,0.25); }
        .qfb-chip.is-open { border-color: var(--gold); color: var(--gold); }
        .qfb-caret { font-size: 0.7rem; opacity: 0.7; transition: transform 0.15s; }
        .qfb-chip.is-open .qfb-caret { transform: rotate(180deg); }
        .qfb-count {
          min-width: 1.15rem; height: 1.15rem; padding: 0 0.3rem; border-radius: 999px;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--gold); color: #120834; font-size: 0.6rem;
        }
        .qfb-value { color: var(--gold); text-transform: none; letter-spacing: 0; font-family: inherit; }
        .qfb-panel {
          position: absolute; top: calc(100% + 0.4rem); left: 0; right: 0; z-index: 60;
          background: #120834; border: 2px solid rgba(201,160,30,0.55); border-radius: 0.75rem;
          box-shadow: 0 18px 48px rgba(0,0,0,0.7); padding: 0.65rem 0.75rem 0.8rem;
        }
        .qfb-panel-head {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;
          font-family: Unbounded, sans-serif; font-size: 0.7rem; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase; color: var(--gold);
        }
        .qfb-link {
          background: none; border: 1px solid #555; border-radius: 0.35rem; color: #ccc;
          font-size: 0.7rem; padding: 0.2rem 0.6rem; cursor: pointer;
        }
        .qfb-link:hover { border-color: var(--gold); color: var(--gold); }
        .qfb-panel-body { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; max-height: 60vh; overflow-y: auto; }
        .qfb-pills { display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center; }
        .qfb-pill {
          display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer;
          padding: 0.2rem 0.55rem; border-radius: 999px; font-size: 0.72rem;
          border: 1px solid rgba(201,160,30,0.6); background: rgba(201,160,30,0.12); color: #eee;
        }
        .qfb-pill img { width: 1rem; height: 1rem; object-fit: contain; }
        .qfb-pill span { color: var(--gold); font-weight: 700; }
        .qfb-pill:hover { background: rgba(201,160,30,0.25); }
        @media (max-width: 767px) {
          .qfb-chip { padding: 0.35rem 0.6rem; font-size: 0.58rem; }
        }
      `}</style>
    </div>
  )
}
