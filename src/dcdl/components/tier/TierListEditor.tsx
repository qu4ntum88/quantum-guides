'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TIER_COLORS } from '@/src/dcdl/components/TierBadge'

/**
 * Drag-and-drop tier ranking board, shared by the official (admin) list and by
 * creator/editor lists.
 *
 * Grown from the local admin panel's TierRankingForm, with two changes that
 * matter for an on-site tool:
 *
 *  - Dragging uses Pointer Events rather than HTML5 drag-and-drop, so it works
 *    with touch on a phone or tablet as well as a mouse.
 *  - Tap-to-select then tap-a-row is supported as a no-drag fallback, which is
 *    also the fastest way to move a lot of items at once.
 *
 * Dropping onto another portrait inserts in front of it (re-rank within a
 * tier); dropping on empty row space appends.
 */

export const TIERS = ['S+', 'S', 'A+', 'A', 'B', 'C', 'D'] as const

export type EditorItem = { id: string; name: string; img: string | null; group?: string }

export type TierAssignment = Record<string, string>

const CHIP_W = 56
const CHIP_H = 70

export default function TierListEditor({
  items,
  assign,
  onChange,
  onReorder,
  unrankedLabel = 'Unranked',
}: {
  /** Ordered list — array order is the within-tier rank, as on the public site. */
  items: EditorItem[]
  assign: TierAssignment
  onChange: (next: TierAssignment) => void
  onReorder: (next: EditorItem[]) => void
  unrankedLabel?: string
}) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null)
  const [overTier, setOverTier] = useState<string | null>(null)
  const [overChip, setOverChip] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  // Live drag bookkeeping kept in a ref so the window listeners never close
  // over stale state.
  const drag = useRef<{ id: string; startX: number; startY: number; moved: boolean } | null>(null)

  const grouped = useMemo(() => {
    const acc: Record<string, EditorItem[]> = {}
    for (const t of TIERS) acc[t] = []
    const unranked: EditorItem[] = []
    for (const item of items) {
      const t = assign[item.id]
      if (t && acc[t]) acc[t].push(item)
      else unranked.push(item)
    }
    return { acc, unranked }
  }, [items, assign])

  /** Move `id` into `tier`, either before `beforeId` or at the end of the row. */
  const place = useCallback(
    (id: string, tier: string, beforeId?: string | null) => {
      onChange({ ...assign, [id]: tier })
      const dragged = items.find((i) => i.id === id)
      if (!dragged) return
      const without = items.filter((i) => i.id !== id)
      if (beforeId && beforeId !== id) {
        const idx = without.findIndex((i) => i.id === beforeId)
        if (idx !== -1) {
          onReorder([...without.slice(0, idx), dragged, ...without.slice(idx)])
          return
        }
      }
      onReorder([...without, dragged])
    },
    [assign, items, onChange, onReorder]
  )

  // ── Pointer drag ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!dragId) return

    function hitTest(x: number, y: number) {
      const el = document.elementFromPoint(x, y)
      const chip = el?.closest('[data-chip-id]')?.getAttribute('data-chip-id') ?? null
      const row = el?.closest('[data-tier-row]')?.getAttribute('data-tier-row') ?? null
      return { chip: chip === dragId ? null : chip, row }
    }

    function onMove(e: PointerEvent) {
      const d = drag.current
      if (!d) return
      if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 5) return
      d.moved = true
      e.preventDefault()
      setGhost({ x: e.clientX, y: e.clientY })
      const { chip, row } = hitTest(e.clientX, e.clientY)
      setOverChip(chip)
      setOverTier(row)
    }

    function onUp(e: PointerEvent) {
      const d = drag.current
      drag.current = null
      setGhost(null)
      setDragId(null)
      setOverChip(null)
      setOverTier(null)
      if (!d) return

      if (!d.moved) {
        // A tap: select (or deselect) for tap-to-place.
        setSelectedId((cur) => (cur === d.id ? null : d.id))
        return
      }
      const { chip, row } = hitTest(e.clientX, e.clientY)
      if (row !== null) place(d.id, row, chip)
    }

    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dragId, place])

  function startDrag(e: React.PointerEvent, id: string) {
    if (e.button !== undefined && e.button !== 0) return
    drag.current = { id, startX: e.clientX, startY: e.clientY, moved: false }
    setDragId(id)
  }

  /** Tap a row while an item is selected → place it there. */
  function rowTap(tier: string) {
    if (!selectedId || drag.current) return
    place(selectedId, tier, null)
    setSelectedId(null)
  }

  const dragItem = dragId ? items.find((i) => i.id === dragId) : null
  const visibleUnranked = filter
    ? grouped.unranked.filter((i) => i.name.toLowerCase().includes(filter.toLowerCase()))
    : grouped.unranked

  function Chip({ item }: { item: EditorItem }) {
    const isDragging = dragId === item.id
    const isSelected = selectedId === item.id
    const isTarget = overChip === item.id
    return (
      <div
        data-chip-id={item.id}
        onPointerDown={(e) => startDrag(e, item.id)}
        title={item.name}
        style={{
          width: CHIP_W, height: CHIP_H, background: '#1a1a1a',
          border: isSelected ? '2px solid #38bdf8' : isDragging ? '2px solid var(--gold)' : '1px solid #444',
          borderRadius: 4, cursor: 'grab', opacity: isDragging ? 0.3 : 1,
          overflow: 'hidden', flexShrink: 0, position: 'relative',
          userSelect: 'none', touchAction: 'none',
          boxShadow: isTarget ? '-3px 0 0 0 var(--gold)' : undefined,
          marginLeft: isTarget ? 3 : 0,
        }}
      >
        {item.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.img} alt="" draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block', pointerEvents: 'none' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#555' }}>
            {item.name.slice(0, 3)}
          </div>
        )}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(0,0,0,0.78)', padding: '2px 3px',
          fontSize: '0.5rem', lineHeight: 1.25, color: '#ddd', textAlign: 'center',
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', pointerEvents: 'none',
        }}>{item.name}</div>
      </div>
    )
  }

  function Row({ tier, rowItems }: { tier: string; rowItems: EditorItem[] }) {
    const isOver = overTier === tier && dragId !== null
    const armed = selectedId !== null
    const color = TIER_COLORS[tier] ?? '#888'
    return (
      <div
        data-tier-row={tier}
        onClick={() => rowTap(tier)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.5rem', minHeight: '5.25rem',
          border: `1px solid ${isOver ? color : armed ? 'rgba(56,189,248,0.35)' : '#2a2a2a'}`,
          borderRadius: '0.375rem',
          background: isOver ? 'rgba(255,255,255,0.05)' : '#111',
          padding: '0.5rem',
          cursor: armed ? 'pointer' : 'default',
          transition: 'border-color 0.1s, background 0.1s',
        }}
      >
        <div style={{
          width: 42, height: 42, minWidth: 42, borderRadius: '50%', background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          fontFamily: 'Unbounded, sans-serif', fontSize: tier.length > 1 ? '0.62rem' : '0.85rem',
          fontWeight: 700, flexShrink: 0, marginTop: 2,
          textShadow: '-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000',
        }}>{tier}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1, alignContent: 'flex-start', minHeight: 42 }}>
          {rowItems.map((item) => <Chip key={item.id} item={item} />)}
          {rowItems.length === 0 && (
            <div style={{ color: '#3a3a3a', fontSize: '0.78rem', alignSelf: 'center', paddingLeft: '0.25rem' }}>
              {armed ? 'Tap to place here' : 'Drop here'}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <p style={{ color: '#888', fontSize: '0.8rem', margin: '0 0 1rem', lineHeight: 1.6 }}>
        Drag a portrait into a tier row — drop it onto another portrait to slot in ahead of it, or on empty space to add
        at the end. On a phone or tablet you can also <strong style={{ color: '#38bdf8' }}>tap a portrait</strong> to
        select it, then tap the row you want it in. Unranked items sit in the bin at the bottom.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {TIERS.map((tier) => <Row key={tier} tier={tier} rowItems={grouped.acc[tier]} />)}

        {/* Unranked bin */}
        <div
          data-tier-row=""
          onClick={() => rowTap('')}
          style={{
            marginTop: '0.5rem', padding: '0.5rem', borderRadius: '0.375rem',
            border: overTier === '' && dragId ? '1px solid #888' : '1px dashed #2a2a2a',
            background: overTier === '' && dragId ? 'rgba(255,255,255,0.03)' : '#0a0a0a',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#666' }}>
              {unrankedLabel} · {grouped.unranked.length}
            </span>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Search…"
              style={{
                padding: '0.3rem 0.55rem', borderRadius: '0.3rem', border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.35)', color: '#fff', fontSize: '0.78rem', width: '10rem',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 42, alignContent: 'flex-start' }}>
            {visibleUnranked.map((item) => <Chip key={item.id} item={item} />)}
            {visibleUnranked.length === 0 && (
              <div style={{ color: '#3a3a3a', fontSize: '0.78rem', alignSelf: 'center', paddingLeft: '0.25rem' }}>
                {filter ? 'No matches.' : 'Everything is ranked.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drag ghost — follows the pointer so touch dragging is legible. */}
      {ghost && dragItem && (
        <div style={{
          position: 'fixed', left: ghost.x - CHIP_W / 2, top: ghost.y - CHIP_H / 2,
          width: CHIP_W, height: CHIP_H, pointerEvents: 'none', zIndex: 9999,
          borderRadius: 4, overflow: 'hidden', border: '2px solid var(--gold)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)', background: '#1a1a1a',
        }}>
          {dragItem.img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dragItem.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          )}
        </div>
      )}
    </div>
  )
}
