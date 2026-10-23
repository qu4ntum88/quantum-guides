'use client'

// A research tree laid out like the game's: nodes in columns (x) and three rows (y), joined to
// the nodes they need. Tap a node to mark it researched; a node unlocks once everything before
// it is researched, and clearing a node clears everything that depends on it.

import { treeOpen, type TreeNode } from '@/src/dcdl/lib/account-bonuses'

const COL = 128
const ROW = 104
const NODE = 96

export type TreeItem = TreeNode & { top: number; value: string; tag?: string }

export default function ResearchTree({ nodes, picked, onToggle, label }: {
  nodes: TreeItem[]
  picked: Record<string, number>
  onToggle: (node: TreeItem) => void
  label: string
}) {
  const maxX = Math.max(1, ...nodes.map((n) => n.x))
  const maxY = Math.max(1, ...nodes.map((n) => n.y))
  const w = maxX * COL
  const h = maxY * ROW
  const pos = (n: TreeNode) => ({ cx: (n.x - 0.5) * COL, cy: (n.y - 0.5) * ROW })
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const on = (id: number) => (picked[id] ?? 0) > 0

  return (
    <div className="rtree" role="group" aria-label={label}>
      <div className="rtree__canvas" style={{ width: w, height: h }}>
        <svg className="rtree__lines" width={w} height={h} aria-hidden="true">
          {nodes.flatMap((n) => n.pre.map((pid) => {
            const p = byId.get(pid)
            if (!p) return null
            const a = pos(p), b = pos(n)
            const midX = (a.cx + b.cx) / 2
            return (
              <path
                key={`${pid}-${n.id}`}
                d={`M${a.cx},${a.cy} C${midX},${a.cy} ${midX},${b.cy} ${b.cx},${b.cy}`}
                className={on(pid) && on(n.id) ? 'is-on' : on(pid) ? 'is-open' : ''}
              />
            )
          }))}
        </svg>
        {nodes.map((n) => {
          const { cx, cy } = pos(n)
          const isOn = on(n.id)
          const open = isOn || treeOpen(n, picked)
          const partial = isOn && (picked[n.id] ?? 0) < n.top
          return (
            <button
              key={n.id}
              type="button"
              className={'rtree__node' + (isOn ? ' is-on' : open ? ' is-open' : ' is-locked')}
              style={{ left: cx - NODE / 2, top: cy - (ROW - 12) / 2, width: NODE }}
              aria-pressed={isOn}
              aria-disabled={!open}
              title={open ? `${n.name}: ${n.value}` : `${n.name}: research what comes before it first`}
              onClick={() => open && onToggle(n)}
            >
              <span className="rtree__icon">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {n.icon ? <img src={n.icon} alt="" loading="lazy" /> : null}
                {!open && <span className="rtree__lock" aria-hidden="true">🔒</span>}
              </span>
              <span className="rtree__name">{n.name}</span>
              <span className="rtree__val">{n.value}{partial ? ` (Lv ${picked[n.id]}/${n.top})` : ''}</span>
              {n.tag && <span className="rtree__tag">{n.tag}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
