'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import type { CSSProperties } from 'react'
import '../../godforge/game.css'
import './ship-combat.css'

// Zone boundaries in map space (0..256 SVG units, 1 tile = 2 SVG units)
const CZ = { x1: 92, y1: 92, x2: 164, y2: 164 }
const BZ = { x1: 30, y1: 30, x2: 226, y2: 226 }

const TILE = 2           // SVG units per grid tile
const BASE_SIZE = TILE * 2  // 2×2 tiles = 4 SVG units

// Sizes: 10×10 tiles = 20 SVG units, 6×6 tiles = 12 SVG units
const CITY_HALL = { x: 128, y: 128, size: 20 }

const PLAZA = [
  { x: 68,  y: 128, dir: 'West',      size: 12 },
  { x: 98,  y: 98,  dir: 'Northwest', size: 12 },
  { x: 128, y: 68,  dir: 'North',     size: 12 },
  { x: 158, y: 98,  dir: 'Northeast', size: 12 },
  { x: 188, y: 128, dir: 'East',      size: 12 },
  { x: 158, y: 158, dir: 'Southeast', size: 12 },
  { x: 128, y: 188, dir: 'South',     size: 12 },
  { x: 98,  y: 158, dir: 'Southwest', size: 12 },
]

const ARMORIES = [
  { x: 100, y: 122, size: 12, ultimateOnly: false },
  { x: 122, y: 98,  size: 12, ultimateOnly: false },
  { x: 135, y: 156, size: 12, ultimateOnly: false },
  { x: 157, y: 135, size: 12, ultimateOnly: false },
  { x: 108, y: 147, size: 12, ultimateOnly: true  },
  { x: 147, y: 108, size: 12, ultimateOnly: true  },
]

// Diamond viewport geometry
const MAP_MARGIN = Math.round(128 * Math.sqrt(2)) - 128  // ≈ 53
const ISO_SIZE   = 256 + MAP_MARGIN * 2                  // ≈ 362
const ISO_ORIGIN = -MAP_MARGIN                           // ≈ -53

const MIN_ZOOM = 1
const MAX_ZOOM = 12

// ─── Groups ──────────────────────────────────────────────────
type Group = { id: number; name: string; color: string; soft: string }
const GROUPS: Group[] = [
  { id: 1, name: 'Group 1', color: '#ef4444', soft: 'rgba(239,68,68,0.16)' },  // red
  { id: 2, name: 'Group 2', color: '#3b82f6', soft: 'rgba(59,130,246,0.16)' }, // blue
  { id: 3, name: 'Group 3', color: '#22c55e', soft: 'rgba(34,197,94,0.16)' },  // green
  { id: 4, name: 'Group 4', color: '#eab308', soft: 'rgba(234,179,8,0.16)' },  // yellow
]
const groupById = (id: number) => GROUPS.find(g => g.id === id) ?? GROUPS[0]

type Base = { id: string; name: string; group: number; x: number; y: number }
type MapMode = 'battle' | 'ultimate'

function clampZoom(z: number) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z))
}

function clampPan(x: number, y: number, viewSize: number) {
  return {
    x: Math.max(ISO_ORIGIN, Math.min(ISO_ORIGIN + ISO_SIZE - viewSize, x)),
    y: Math.max(ISO_ORIGIN, Math.min(ISO_ORIGIN + ISO_SIZE - viewSize, y)),
  }
}

function isInBuildable(bx: number, by: number) {
  const inOuter = bx >= BZ.x1 && bx + BASE_SIZE <= BZ.x2 && by >= BZ.y1 && by + BASE_SIZE <= BZ.y2
  const overlapsCenter = bx < CZ.x2 && bx + BASE_SIZE > CZ.x1 && by < CZ.y2 && by + BASE_SIZE > CZ.y1
  return inOuter && !overlapsCenter
}

function basesOverlap(ax: number, ay: number, bx: number, by: number) {
  return ax < bx + BASE_SIZE && ax + BASE_SIZE > bx && ay < by + BASE_SIZE && ay + BASE_SIZE > by
}

// All non-overlapping buildable grid slots (step = BASE_SIZE), ordered from the
// center outward so bases fill the four inner lines nearest City Hall first.
let _orderedSpots: { x: number; y: number }[] | null = null
function orderedBuildableSpots() {
  if (_orderedSpots) return _orderedSpots
  const all: { x: number; y: number }[] = []
  for (let y = BZ.y1; y + BASE_SIZE <= BZ.y2; y += BASE_SIZE) {
    for (let x = BZ.x1; x + BASE_SIZE <= BZ.x2; x += BASE_SIZE) {
      if (isInBuildable(x, y)) all.push({ x, y })
    }
  }
  const cheb = (s: { x: number; y: number }) =>
    Math.max(Math.abs(s.x + BASE_SIZE / 2 - 128), Math.abs(s.y + BASE_SIZE / 2 - 128))
  all.sort((a, b) => {
    const d = cheb(a) - cheb(b)
    if (d !== 0) return d // square rings hugging the center zone come first
    // within a ring, walk the perimeter so the four inner lines fill continuously
    return Math.atan2(a.y + BASE_SIZE / 2 - 128, a.x + BASE_SIZE / 2 - 128) -
           Math.atan2(b.y + BASE_SIZE / 2 - 128, b.x + BASE_SIZE / 2 - 128)
  })
  _orderedSpots = all
  return all
}

// First open buildable slot (center-out) that doesn't collide with existing bases
function findFreeSpot(bases: Base[]) {
  for (const s of orderedBuildableSpots()) {
    if (!bases.some(b => basesOverlap(s.x, s.y, b.x, b.y))) return s
  }
  return { x: BZ.x1, y: BZ.y1 }
}

// First `count` center-out slots (non-overlapping by construction)
function findFreeSpots(count: number) {
  return orderedBuildableSpots().slice(0, count)
}

function nextPlayerName(bases: Base[]) {
  let max = 0
  for (const b of bases) {
    const m = /^Player (\d+)$/.exec(b.name)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `Player ${Math.max(max + 1, bases.length + 1)}`
}

// Rotate a point around (cx, cy) by angleDeg degrees
function rotatePoint(px: number, py: number, cx: number, cy: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  const dx = px - cx
  const dy = py - cy
  return {
    x: dx * Math.cos(rad) - dy * Math.sin(rad) + cx,
    y: dx * Math.sin(rad) + dy * Math.cos(rad) + cy,
  }
}

// Convert a map coordinate (0..256 space) to SVG root coordinates (diamond space)
function toSvg(mx: number, my: number) {
  return rotatePoint(mx, my, 128, 128, 45)
}

// ══════════════════════════════════════════════════════════════
//  MAP
// ══════════════════════════════════════════════════════════════
function GameMap({
  ultimate,
  bases,
  setBases,
  selectedIds,
  setSelectedIds,
  groupNames,
}: {
  ultimate: boolean
  bases: Base[]
  setBases: (updater: (prev: Base[]) => Base[]) => void
  selectedIds: string[]
  setSelectedIds: (next: string[]) => void
  groupNames: Record<number, string>
}) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: ISO_ORIGIN, y: ISO_ORIGIN })
  const [cursor, setCursor] = useState<'grab' | 'grabbing' | 'move'>('grab')

  const svgRef = useRef<SVGSVGElement>(null)

  const viewSize = ISO_SIZE / zoom

  // Keep the latest interaction-relevant state in a ref for native listeners
  const stateRef = useRef({ zoom, pan, viewSize, bases, selectedIds })
  useEffect(() => { stateRef.current = { zoom, pan, viewSize, bases, selectedIds } })

  // Active pointers + current gesture
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const gesture = useRef<
    | { kind: 'pan'; startClient: { x: number; y: number }; startPan: { x: number; y: number }; moved: boolean }
    | { kind: 'move'; baseId: string; ids: string[]; startPos: Record<string, { x: number; y: number }>; grabDX: number; grabDY: number; moved: boolean }
    | { kind: 'pinch'; startDist: number; startZoom: number; fracX: number; fracY: number; anchorSvg: { x: number; y: number } }
    | null
  >(null)

  // ─── coordinate helpers ───
  const clientToSvg = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const s = stateRef.current
    return {
      x: s.pan.x + ((clientX - rect.left) / rect.width) * s.viewSize,
      y: s.pan.y + ((clientY - rect.top) / rect.height) * s.viewSize,
    }
  }, [])

  const clientToMap = useCallback((clientX: number, clientY: number) => {
    const svgPt = clientToSvg(clientX, clientY)
    return rotatePoint(svgPt.x, svgPt.y, 128, 128, -45)
  }, [clientToSvg])

  const baseAt = useCallback((clientX: number, clientY: number) => {
    const m = clientToMap(clientX, clientY)
    // topmost first (last drawn wins)
    for (let i = stateRef.current.bases.length - 1; i >= 0; i--) {
      const b = stateRef.current.bases[i]
      if (m.x >= b.x && m.x <= b.x + BASE_SIZE && m.y >= b.y && m.y <= b.y + BASE_SIZE) return b
    }
    return null
  }, [clientToMap])

  // ─── zoom around a screen anchor ───
  const zoomAtFrac = useCallback((newZoom: number, anchorSvg: { x: number; y: number }, fracX: number, fracY: number) => {
    const z = clampZoom(newZoom)
    const newViewSize = ISO_SIZE / z
    const newPanX = anchorSvg.x - fracX * newViewSize
    const newPanY = anchorSvg.y - fracY * newViewSize
    setPan(clampPan(newPanX, newPanY, newViewSize))
    setZoom(z)
  }, [])

  const zoomButton = useCallback((factor: number) => {
    const s = stateRef.current
    const center = { x: s.pan.x + s.viewSize / 2, y: s.pan.y + s.viewSize / 2 }
    zoomAtFrac(s.zoom * factor, center, 0.5, 0.5)
  }, [zoomAtFrac])

  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: ISO_ORIGIN, y: ISO_ORIGIN })
  }, [])

  // ─── native wheel (passive:false so we can preventDefault) ───
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const fracX = (e.clientX - rect.left) / rect.width
      const fracY = (e.clientY - rect.top) / rect.height
      const anchor = clientToSvg(e.clientX, e.clientY)
      const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18
      zoomAtFrac(stateRef.current.zoom * factor, anchor, fracX, fracY)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [clientToSvg, zoomAtFrac])

  // ─── pointer interactions (mouse + touch unified) ───
  const midOf = () => {
    const pts = [...pointers.current.values()]
    return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
  }
  const distOf = () => {
    const pts = [...pointers.current.values()]
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
  }

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2) {
      const rect = svgRef.current!.getBoundingClientRect()
      const mid = midOf()
      gesture.current = {
        kind: 'pinch',
        startDist: distOf(),
        startZoom: stateRef.current.zoom,
        fracX: (mid.x - rect.left) / rect.width,
        fracY: (mid.y - rect.top) / rect.height,
        anchorSvg: clientToSvg(mid.x, mid.y),
      }
      return
    }

    const hit = baseAt(e.clientX, e.clientY)
    if (hit) {
      const sel = stateRef.current.selectedIds
      // Move the whole selection when the grabbed base is part of it; otherwise just this one
      const ids = sel.includes(hit.id) && sel.length > 0 ? sel.slice() : [hit.id]
      const startPos: Record<string, { x: number; y: number }> = {}
      for (const b of stateRef.current.bases) {
        if (ids.includes(b.id)) startPos[b.id] = { x: b.x, y: b.y }
      }
      const cm = clientToMap(e.clientX, e.clientY)
      gesture.current = {
        kind: 'move',
        baseId: hit.id,
        ids,
        startPos,
        grabDX: cm.x - hit.x,
        grabDY: cm.y - hit.y,
        moved: false,
      }
      setCursor('move')
    } else {
      gesture.current = { kind: 'pan', startClient: { x: e.clientX, y: e.clientY }, startPan: { ...stateRef.current.pan }, moved: false }
      setCursor('grabbing')
    }
  }

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (!g) return

    if (g.kind === 'pinch' && pointers.current.size >= 2) {
      const ratio = distOf() / (g.startDist || 1)
      zoomAtFrac(g.startZoom * ratio, g.anchorSvg, g.fracX, g.fracY)
      return
    }

    if (g.kind === 'move') {
      const m = clientToMap(e.clientX, e.clientY)
      // Snap the grabbed base to the cursor tile, derive the shared delta, apply to the whole set
      const snappedX = Math.round((m.x - g.grabDX) / TILE) * TILE
      const snappedY = Math.round((m.y - g.grabDY) / TILE) * TILE
      const dx = snappedX - g.startPos[g.baseId].x
      const dy = snappedY - g.startPos[g.baseId].y
      if (dx === 0 && dy === 0) return
      const movingSet = new Set(g.ids)
      const others = stateRef.current.bases.filter(b => !movingSet.has(b.id))
      const next: Record<string, { x: number; y: number }> = {}
      let ok = true
      for (const id of g.ids) {
        const nx = g.startPos[id].x + dx
        const ny = g.startPos[id].y + dy
        // must stay buildable and never land on top of a base outside the move set
        if (!isInBuildable(nx, ny)) { ok = false; break }
        if (others.some(o => basesOverlap(nx, ny, o.x, o.y))) { ok = false; break }
        next[id] = { x: nx, y: ny }
      }
      if (ok) {
        g.moved = true
        setBases(prev => prev.map(b => (next[b.id] ? { ...b, ...next[b.id] } : b)))
      }
      return
    }

    if (g.kind === 'pan') {
      const rect = svgRef.current!.getBoundingClientRect()
      const scale = stateRef.current.viewSize / rect.width
      const dx = (e.clientX - g.startClient.x) * scale
      const dy = (e.clientY - g.startClient.y) * scale
      if (Math.abs(e.clientX - g.startClient.x) > 3 || Math.abs(e.clientY - g.startClient.y) > 3) g.moved = true
      setPan(clampPan(g.startPan.x - dx, g.startPan.y - dy, stateRef.current.viewSize))
    }
  }

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const g = gesture.current
    pointers.current.delete(e.pointerId)

    // finished a tap (no drag) → single-select the tapped base (or clear)
    if (g && (g.kind === 'move' || g.kind === 'pan') && !g.moved) {
      const hit = baseAt(e.clientX, e.clientY)
      setSelectedIds(hit ? [hit.id] : [])
    }

    if (pointers.current.size === 1) {
      // dropped from pinch → resume panning with remaining finger
      const [remaining] = [...pointers.current.values()]
      gesture.current = { kind: 'pan', startClient: { ...remaining }, startPan: { ...stateRef.current.pan }, moved: true }
      setCursor('grabbing')
    } else if (pointers.current.size === 0) {
      gesture.current = null
      setCursor('grab')
    }
  }

  const activeArmories = ultimate ? ARMORIES : ARMORIES.filter(a => !a.ultimateOnly)
  const pfx = ultimate ? 'u' : 'b'
  const selectedSet = new Set(selectedIds)
  const selBases = bases.filter(b => selectedSet.has(b.id))

  // ─── Decide what labelling to draw so a crowded board stays readable ───
  //  none      → nothing (default)
  //  single    → dashed range circle + name plate for the one base
  //  group     → whole group selected: group-name pill + white tile highlight
  //  names     → 2–5 selected: non-overlapping name callouts w/ leader lines
  //  highlight → >5 selected: white tile highlight only, no names
  let displayMode: 'none' | 'single' | 'group' | 'names' | 'highlight' = 'none'
  let groupModeId = 0
  if (selBases.length === 1) {
    displayMode = 'single'
  } else if (selBases.length >= 2) {
    const groupsInSel = new Set(selBases.map(b => b.group))
    if (groupsInSel.size === 1) {
      const gid = selBases[0].group
      if (selBases.length === bases.filter(b => b.group === gid).length) {
        displayMode = 'group'
        groupModeId = gid
      }
    }
    if (displayMode === 'none') displayMode = selBases.length <= 5 ? 'names' : 'highlight'
  }
  const showHighlight = displayMode === 'group' || displayMode === 'names' || displayMode === 'highlight'

  // Callout layout for the 2–5 "names" case: a stacked column set well clear of the
  // selected bases so the plates never sit over a highlighted tile (px = plate left,
  // lx = where its leader line meets the plate).
  let callouts: { id: string; name: string; color: string; bx: number; by: number; px: number; py: number; lx: number; w: number }[] = []
  if (displayMode === 'names') {
    const items = selBases.map(b => ({ b, c: toSvg(b.x + BASE_SIZE / 2, b.y + BASE_SIZE / 2) }))
    const cy = items.reduce((s, i) => s + i.c.y, 0) / items.length
    items.sort((a, b) => a.c.y - b.c.y)
    const rowH = 8.5
    const gap = 12 // clearance between the bases and the plate column
    const maxW = Math.max(...items.map(i => i.b.name.length * 2.7 + 5))
    const rightMost = Math.max(...items.map(i => i.c.x))
    const leftMost = Math.min(...items.map(i => i.c.x))
    const n = items.length
    const startY = Math.max(ISO_ORIGIN + 6, Math.min(cy - ((n - 1) * rowH) / 2, ISO_ORIGIN + ISO_SIZE - 6 - (n - 1) * rowH))

    // Prefer plates to the right of every selected base; fall back to the left if there's no room
    const rightColLeft = rightMost + BASE_SIZE / 2 + gap
    const onRight = rightColLeft + maxW <= ISO_ORIGIN + ISO_SIZE - 4
    const colLeft = rightColLeft
    const colRight = Math.max(ISO_ORIGIN + 4 + maxW, leftMost - BASE_SIZE / 2 - gap)

    callouts = items.map((it, i) => {
      const w = it.b.name.length * 2.7 + 5
      return {
        id: it.b.id,
        name: it.b.name,
        color: groupById(it.b.group).color,
        bx: it.c.x,
        by: it.c.y,
        px: onRight ? colLeft : colRight - w,
        py: startY + i * rowH,
        lx: onRight ? colLeft : colRight,
        w,
      }
    })
  }

  // Group-name pill for the "group" case, floated above the cluster
  let groupLabel: { name: string; x: number; y: number; color: string } | null = null
  if (displayMode === 'group') {
    const pts = selBases.map(b => toSvg(b.x + BASE_SIZE / 2, b.y + BASE_SIZE / 2))
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length
    const minY = Math.min(...pts.map(p => p.y))
    groupLabel = { name: groupNames[groupModeId] || groupById(groupModeId).name, x: cx, y: minY - 8, color: groupById(groupModeId).color }
  }

  const diamondPoints = `128,${ISO_ORIGIN} ${ISO_ORIGIN + ISO_SIZE},128 128,${ISO_ORIGIN + ISO_SIZE} ${ISO_ORIGIN},128`
  const chPos = toSvg(CITY_HALL.x, CITY_HALL.y)

  return (
    <div className="sc-mapframe">
      <span className="sc-bracket tl" />
      <span className="sc-bracket tr" />
      <span className="sc-bracket bl" />
      <span className="sc-bracket br" />
      <span className="sc-mapbadge">{ultimate ? 'Ultimate Battle For Gotham' : 'Battle For Gotham'}</span>

      <svg
        ref={svgRef}
        viewBox={`${pan.x} ${pan.y} ${viewSize} ${viewSize}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ cursor, userSelect: 'none' }}
        onDragStart={e => e.preventDefault()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <defs>
          <filter id={`glow${pfx}`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id={`tile${pfx}`} x="0" y="0" width="2" height="2" patternUnits="userSpaceOnUse">
            <path d="M 2 0 L 0 0 0 2" fill="none" stroke="#16163c" strokeWidth="0.2" />
          </pattern>
          <pattern id={`chunk${pfx}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#21215a" strokeWidth="0.5" />
          </pattern>
          <filter id={`whiteGlow${pfx}`} x="-120%" y="-120%" width="340%" height="340%">
            <feDropShadow dx="0" dy="0" stdDeviation="0.9" floodColor="#ffffff" floodOpacity="0.95" />
          </filter>
        </defs>

        {/* Full-viewport background */}
        <rect x={ISO_ORIGIN} y={ISO_ORIGIN} width={ISO_SIZE} height={ISO_SIZE} fill="#09090f" />

        {/* ── LAYER 1: rotated map (grid + zones + building footprints) ── */}
        <g transform="rotate(45, 128, 128)">
          <rect width="256" height="256" fill="#09090f" />
          <rect width="256" height="256" fill={`url(#tile${pfx})`} />
          <rect width="256" height="256" fill={`url(#chunk${pfx})`} />

          {/* Outer non-buildable zone */}
          <rect x="0"   y="0"   width="256" height="30"  fill="rgba(220,38,38,0.10)" />
          <rect x="0"   y="226" width="256" height="30"  fill="rgba(220,38,38,0.10)" />
          <rect x="0"   y="30"  width="30"  height="196" fill="rgba(220,38,38,0.10)" />
          <rect x="226" y="30"  width="30"  height="196" fill="rgba(220,38,38,0.10)" />

          {/* Buildable zone */}
          <rect x="30"  y="30"  width="196" height="62"  fill="rgba(34,197,94,0.08)" />
          <rect x="30"  y="164" width="196" height="62"  fill="rgba(34,197,94,0.08)" />
          <rect x="30"  y="92"  width="62"  height="72"  fill="rgba(34,197,94,0.08)" />
          <rect x="164" y="92"  width="62"  height="72"  fill="rgba(34,197,94,0.08)" />

          {/* Center no-build zone */}
          <rect x="92" y="92" width="72" height="72" fill="rgba(220,38,38,0.10)" />

          {/* Zone boundary lines */}
          <rect x="30" y="30" width="196" height="196"
            fill="none" stroke="rgba(34,197,94,0.35)" strokeWidth="0.5" strokeDasharray="2,2" />
          <rect x="92" y="92" width="72" height="72"
            fill="none" stroke="rgba(220,38,38,0.45)" strokeWidth="0.5" strokeDasharray="2,2" />

          {/* City Hall footprint */}
          <rect x={CITY_HALL.x - CITY_HALL.size / 2} y={CITY_HALL.y - CITY_HALL.size / 2}
            width={CITY_HALL.size} height={CITY_HALL.size} fill="#92680c" fillOpacity="0.4" />

          {/* Plaza footprints */}
          {PLAZA.map((p) => (
            <rect key={p.dir} x={p.x - p.size / 2} y={p.y - p.size / 2} width={p.size} height={p.size}
              fill="#5b21b6" fillOpacity="0.6" />
          ))}

          {/* Armory footprints */}
          {activeArmories.map((a, i) => (
            <g key={i}>
              <rect x={a.x - a.size / 2} y={a.y - a.size / 2} width={a.size} height={a.size}
                fill={a.ultimateOnly ? '#9f1239' : '#c2410c'} fillOpacity="0.4" />
              {a.ultimateOnly && (
                <rect x={a.x - a.size / 2} y={a.y - a.size / 2} width={a.size} height={a.size}
                  fill="none" stroke="#f87171" strokeWidth="0.5" />
              )}
            </g>
          ))}

          {/* Player Base footprints (group-tinted) */}
          {bases.map((b) => {
            const g = groupById(b.group)
            return (
              <rect key={b.id} x={b.x} y={b.y} width={BASE_SIZE} height={BASE_SIZE}
                fill={g.color} fillOpacity={selectedSet.has(b.id) ? 0.5 : 0.32} />
            )
          })}
        </g>{/* end rotation group */}

        {/* ── LAYER 2: upright building images, placed at rotated map coords ── */}

        {/* City Hall image */}
        <g filter={`url(#glow${pfx})`}>
          <image
            href="/dcdl/resource_icons/Gotham_CityHall.png"
            x={chPos.x - CITY_HALL.size / 2}
            y={chPos.y - CITY_HALL.size / 2}
            width={CITY_HALL.size}
            height={CITY_HALL.size}
            preserveAspectRatio="xMidYMid meet"
          />
        </g>

        {/* Armory images */}
        {activeArmories.map((a, i) => {
          const pos = toSvg(a.x, a.y)
          const half = a.size / 2
          return (
            <image
              key={i}
              href="/dcdl/resource_icons/Gotham_Armory.png"
              x={pos.x - half}
              y={pos.y - half}
              width={a.size}
              height={a.size}
              preserveAspectRatio="xMidYMid meet"
            />
          )
        })}

        {/* Player Base images (always drawn) */}
        {bases.map((b) => {
          const c = toSvg(b.x + BASE_SIZE / 2, b.y + BASE_SIZE / 2)
          return (
            <image
              key={b.id}
              href="/dcdl/resource_icons/Gotham_PlayerBase.png"
              x={c.x - BASE_SIZE / 2}
              y={c.y - BASE_SIZE / 2}
              width={BASE_SIZE}
              height={BASE_SIZE}
              preserveAspectRatio="xMidYMid meet"
            />
          )
        })}

        {/* White highlight ring on selected bases (group / names / >5 cases) */}
        {showHighlight && selBases.map((b) => {
          const c = toSvg(b.x + BASE_SIZE / 2, b.y + BASE_SIZE / 2)
          return (
            <rect key={b.id}
              x={c.x - BASE_SIZE / 2 - 0.7} y={c.y - BASE_SIZE / 2 - 0.7}
              width={BASE_SIZE + 1.4} height={BASE_SIZE + 1.4} rx="0.9"
              fill="none" stroke="#ffffff" strokeOpacity="0.95" strokeWidth="0.5"
              filter={`url(#whiteGlow${pfx})`} />
          )
        })}

        {/* Single selection → dashed range circle + name plate */}
        {displayMode === 'single' && (() => {
          const b = selBases[0]
          const g = groupById(b.group)
          const c = toSvg(b.x + BASE_SIZE / 2, b.y + BASE_SIZE / 2)
          return (
            <g>
              <circle cx={c.x} cy={c.y} r="7" fill="none" stroke={g.color} strokeOpacity="0.9" strokeWidth="0.7" strokeDasharray="1.5,1.5" />
              <circle cx={c.x} cy={c.y} r="4.2" fill="none" stroke={g.color} strokeWidth="0.6" />
              <rect x={c.x - (b.name.length * 1.35 + 2)} y={c.y - BASE_SIZE / 2 - 9}
                width={b.name.length * 2.7 + 4} height="6" rx="1.5"
                fill="rgba(6,6,12,0.85)" stroke={g.color} strokeOpacity="0.75" strokeWidth="0.25" />
              <text x={c.x} y={c.y - BASE_SIZE / 2 - 4.7} fill="#fff" fontSize="3.6" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle">
                {b.name}
              </text>
            </g>
          )
        })()}

        {/* 2–5 selection → stacked name callouts with leader lines */}
        {callouts.map((co) => (
          <g key={co.id}>
            <line x1={co.bx} y1={co.by} x2={co.lx} y2={co.py} stroke={co.color} strokeOpacity="0.7" strokeWidth="0.3" />
            <circle cx={co.bx} cy={co.by} r="0.7" fill={co.color} />
            <rect x={co.px} y={co.py - 3} width={co.w} height="6" rx="1.5"
              fill="rgba(6,6,12,0.9)" stroke={co.color} strokeOpacity="0.8" strokeWidth="0.3" />
            <text x={co.px + 2} y={co.py + 0.4} fill="#fff" fontSize="3.6" fontFamily="Inter, sans-serif" fontWeight="600" dominantBaseline="middle">
              {co.name}
            </text>
          </g>
        ))}

        {/* Whole group selected → group-name pill above the cluster */}
        {groupLabel && (
          <g>
            <rect x={groupLabel.x - (groupLabel.name.length * 1.5 + 3)} y={groupLabel.y - 4}
              width={groupLabel.name.length * 3 + 6} height="7" rx="2"
              fill="rgba(6,6,12,0.9)" stroke={groupLabel.color} strokeWidth="0.4" />
            <text x={groupLabel.x} y={groupLabel.y - 0.3} fill="#fff" fontSize="4" fontFamily="Inter, sans-serif" fontWeight="700" textAnchor="middle" dominantBaseline="middle">
              {groupLabel.name}
            </text>
          </g>
        )}

        {/* Diamond border */}
        <polygon points={diamondPoints} fill="none" stroke="#2a2a6a" strokeWidth="1" />
      </svg>

      {/* Zoom controls */}
      <div className="sc-zoomctl">
        <button className="sc-zbtn" onClick={() => zoomButton(1.3)} aria-label="Zoom in" title="Zoom in">+</button>
        <button className="sc-zbtn" onClick={() => zoomButton(1 / 1.3)} aria-label="Zoom out" title="Zoom out">−</button>
        <button className="sc-zbtn" onClick={resetView} aria-label="Reset view" title="Reset view" style={{ fontSize: '0.85rem' }}>⤢</button>
        <div className="sc-zlevel">{zoom % 1 === 0 ? `${zoom}×` : `${zoom.toFixed(1)}×`}</div>
      </div>

      <span className="sc-hint">Scroll / pinch to zoom · drag to pan · select bases to reveal names</span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  ROSTER PANEL
// ══════════════════════════════════════════════════════════════
function Check({
  checked,
  indeterminate,
  onChange,
  title,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  title: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate && !checked
  }, [indeterminate, checked])
  return (
    <input
      ref={ref}
      type="checkbox"
      className="sc-check"
      checked={checked}
      title={title}
      onClick={e => e.stopPropagation()}
      onChange={e => onChange(e.target.checked)}
    />
  )
}

function RosterPanel({
  bases,
  setBases,
  selectedIds,
  setSelectedIds,
  league,
  setLeague,
  groupNames,
  setGroupName,
  onAdd,
  onImport,
  onExport,
  onReset,
  exporting,
}: {
  bases: Base[]
  setBases: (updater: (prev: Base[]) => Base[]) => void
  selectedIds: string[]
  setSelectedIds: (next: string[]) => void
  league: string
  setLeague: (name: string) => void
  groupNames: Record<number, string>
  setGroupName: (id: number, name: string) => void
  onAdd: () => void
  onImport: () => void
  onExport: () => void
  onReset: () => void
  exporting: boolean
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [editingGroup, setEditingGroup] = useState<number | null>(null)
  const [groupDraft, setGroupDraft] = useState('')
  const selSet = new Set(selectedIds)

  const startEdit = (b: Base) => {
    setEditingId(b.id)
    setDraft(b.name)
  }
  const commitEdit = () => {
    if (editingId) {
      const name = draft.trim() || 'Player'
      setBases(prev => prev.map(b => (b.id === editingId ? { ...b, name } : b)))
    }
    setEditingId(null)
  }

  const startEditGroup = (id: number, name: string) => {
    setEditingGroup(id)
    setGroupDraft(name)
  }
  const commitGroup = () => {
    if (editingGroup != null) {
      setGroupName(editingGroup, groupDraft.trim() || `Group ${editingGroup}`)
    }
    setEditingGroup(null)
  }

  const remove = (id: string) => {
    setBases(prev => prev.filter(b => b.id !== id))
    setSelectedIds(selectedIds.filter(x => x !== id))
  }
  const setGroup = (id: string, group: number) => {
    setBases(prev => prev.map(b => (b.id === id ? { ...b, group } : b)))
  }

  const selectOnly = (id: string) => setSelectedIds([id])
  const toggle = (id: string) =>
    setSelectedIds(selSet.has(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id])
  const setMembersSelected = (memberIds: string[], on: boolean) => {
    if (on) setSelectedIds([...new Set([...selectedIds, ...memberIds])])
    else setSelectedIds(selectedIds.filter(id => !memberIds.includes(id)))
  }

  return (
    <div className="sc-panel">
      <div className="sc-panel-head">
        <span className="sc-panel-title">Deployment Roster</span>
        <span className="sc-count">{bases.length} {bases.length === 1 ? 'base' : 'bases'}</span>
      </div>

      <div className="sc-league">
        <label className="sc-league-label" htmlFor="sc-league-input">League Name</label>
        <input
          id="sc-league-input"
          className="sc-league-input"
          value={league}
          onChange={e => setLeague(e.target.value)}
          placeholder="Your league name"
          maxLength={40}
        />
      </div>

      <div className="sc-actions">
        <button className="sc-btn" onClick={onAdd} disabled={bases.length >= 100}>+ Add Base</button>
      </div>
      <div className="sc-actions">
        <button className="sc-btn sc-btn-ghost" onClick={onImport}>⬆ Import</button>
        <button className="sc-btn sc-btn-ghost" onClick={onExport} disabled={exporting || bases.length === 0}>
          {exporting ? 'Rendering…' : '⤓ Export'}
        </button>
      </div>

      <button
        className="sc-btn sc-btn-danger sc-reset-btn"
        onClick={onReset}
        disabled={bases.length === 0}
      >
        ⟲ Reset Map
      </button>

      {selectedIds.length > 0 && (
        <div className="sc-selbar">
          <span className="sc-selcount">{selectedIds.length} selected</span>
          <span className="sc-selhint">drag any selected base to move them together</span>
          <button className="sc-selclear" onClick={() => setSelectedIds([])}>Clear</button>
        </div>
      )}

      {bases.length === 0 ? (
        <div className="sc-empty">
          <strong>No bases placed yet</strong>
          Add a base, then drag it onto the green buildable ring. Group and rename each one below.
        </div>
      ) : (
        <div className="sc-groups">
          {GROUPS.map((grp) => {
            const members = bases.filter(b => b.group === grp.id)
            const memberIds = members.map(b => b.id)
            const allSel = members.length > 0 && members.every(b => selSet.has(b.id))
            const someSel = members.some(b => selSet.has(b.id))
            return (
              <div className="sc-group" key={grp.id}>
                <div className="sc-group-head">
                  {members.length > 0 ? (
                    <Check
                      checked={allSel}
                      indeterminate={someSel}
                      onChange={on => setMembersSelected(memberIds, on)}
                      title={`Select all in ${groupNames[grp.id] || grp.name}`}
                    />
                  ) : (
                    <span className="sc-check-spacer" />
                  )}
                  <span className="sc-group-swatch" style={{ background: grp.color }} />
                  {editingGroup === grp.id ? (
                    <input
                      className="sc-group-name-input"
                      value={groupDraft}
                      autoFocus
                      onChange={e => setGroupDraft(e.target.value)}
                      onBlur={commitGroup}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitGroup()
                        if (e.key === 'Escape') setEditingGroup(null)
                      }}
                      maxLength={24}
                    />
                  ) : (
                    <button
                      className="sc-group-name"
                      title="Click to rename group"
                      onClick={() => startEditGroup(grp.id, groupNames[grp.id] || grp.name)}
                    >
                      {groupNames[grp.id] || grp.name}
                    </button>
                  )}
                  <span className="sc-group-count">{members.length}</span>
                </div>
                {members.length === 0 ? (
                  <div className="sc-group-empty">empty</div>
                ) : (
                  members.map((b) => (
                    <div
                      key={b.id}
                      className={`sc-base${selSet.has(b.id) ? ' is-selected' : ''}`}
                      onClick={() => selectOnly(b.id)}
                    >
                      <Check checked={selSet.has(b.id)} onChange={() => toggle(b.id)} title="Select base" />
                      <span className="sc-base-marker" style={{ color: grp.color, background: grp.color }} />
                      {editingId === b.id ? (
                        <input
                          className="sc-base-name-input"
                          value={draft}
                          autoFocus
                          onClick={e => e.stopPropagation()}
                          onChange={e => setDraft(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitEdit()
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          maxLength={20}
                        />
                      ) : (
                        <button
                          className="sc-base-name"
                          onClick={e => { e.stopPropagation(); startEdit(b) }}
                          title="Click to rename"
                        >
                          {b.name}
                        </button>
                      )}
                      <div className="sc-swatches" onClick={e => e.stopPropagation()}>
                        {GROUPS.map(g => (
                          <button
                            key={g.id}
                            className={`sc-swatch${g.id === b.group ? ' is-current' : ''}`}
                            style={{ background: g.color, color: g.color }}
                            title={`Move to ${groupNames[g.id] || g.name}`}
                            onClick={() => setGroup(b.id, g.id)}
                          />
                        ))}
                      </div>
                      <button className="sc-del" title="Remove base" onClick={e => { e.stopPropagation(); remove(b.id) }}>✕</button>
                    </div>
                  ))
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  EXPORT — rasterize map + roster to a PNG
// ══════════════════════════════════════════════════════════════
const imgCache: Record<string, string> = {}
async function toDataUrl(url: string): Promise<string> {
  if (imgCache[url]) return imgCache[url]
  const res = await fetch(url)
  const blob = await res.blob()
  const dataUrl: string = await new Promise((resolve) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result as string)
    fr.readAsDataURL(blob)
  })
  imgCache[url] = dataUrl
  return dataUrl
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildMapSvg(ultimate: boolean, bases: Base[], imgs: Record<string, string>) {
  const activeArmories = ultimate ? ARMORIES : ARMORIES.filter(a => !a.ultimateOnly)
  const chPos = toSvg(CITY_HALL.x, CITY_HALL.y)
  const diamondPoints = `128,${ISO_ORIGIN} ${ISO_ORIGIN + ISO_SIZE},128 128,${ISO_ORIGIN + ISO_SIZE} ${ISO_ORIGIN},128`

  const armoryFootprints = activeArmories.map(a =>
    `<rect x="${a.x - a.size / 2}" y="${a.y - a.size / 2}" width="${a.size}" height="${a.size}" fill="${a.ultimateOnly ? '#9f1239' : '#c2410c'}" fill-opacity="0.4"/>`
  ).join('')

  const plazaFootprints = PLAZA.map(p =>
    `<rect x="${p.x - p.size / 2}" y="${p.y - p.size / 2}" width="${p.size}" height="${p.size}" fill="#5b21b6" fill-opacity="0.6"/>`
  ).join('')

  const baseFootprints = bases.map(b => {
    const g = groupById(b.group)
    return `<rect x="${b.x}" y="${b.y}" width="${BASE_SIZE}" height="${BASE_SIZE}" fill="${g.color}" fill-opacity="0.34"/>`
  }).join('')

  const armoryImgs = activeArmories.map(a => {
    const pos = toSvg(a.x, a.y)
    return `<image href="${imgs.armory}" x="${pos.x - a.size / 2}" y="${pos.y - a.size / 2}" width="${a.size}" height="${a.size}" preserveAspectRatio="xMidYMid meet"/>`
  }).join('')

  // Mirror the on-screen "hide when crowded" rule: only label the map when few bases
  const showNames = bases.length <= 5
  const baseImgs = bases.map(b => {
    const g = groupById(b.group)
    const c = toSvg(b.x + BASE_SIZE / 2, b.y + BASE_SIZE / 2)
    const img = `<image href="${imgs.base}" x="${c.x - BASE_SIZE / 2}" y="${c.y - BASE_SIZE / 2}" width="${BASE_SIZE}" height="${BASE_SIZE}" preserveAspectRatio="xMidYMid meet"/>`
    if (!showNames) return img
    const w = b.name.length * 2.7 + 4
    return `
      <circle cx="${c.x}" cy="${c.y}" r="7" fill="none" stroke="${g.color}" stroke-opacity="0.6" stroke-width="0.5" stroke-dasharray="1.5,1.5"/>
      ${img}
      <rect x="${c.x - w / 2}" y="${c.y - BASE_SIZE / 2 - 9}" width="${w}" height="6" rx="1.5" fill="rgba(6,6,12,0.85)" stroke="${g.color}" stroke-opacity="0.7" stroke-width="0.25"/>
      <text x="${c.x}" y="${c.y - BASE_SIZE / 2 - 4.7}" fill="#fff" font-size="3.6" font-family="Inter, sans-serif" font-weight="600" text-anchor="middle">${esc(b.name)}</text>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ISO_ORIGIN} ${ISO_ORIGIN} ${ISO_SIZE} ${ISO_SIZE}" width="1000" height="1000">
    <rect x="${ISO_ORIGIN}" y="${ISO_ORIGIN}" width="${ISO_SIZE}" height="${ISO_SIZE}" fill="#09090f"/>
    <defs>
      <pattern id="etile" x="0" y="0" width="2" height="2" patternUnits="userSpaceOnUse"><path d="M 2 0 L 0 0 0 2" fill="none" stroke="#16163c" stroke-width="0.2"/></pattern>
      <pattern id="echunk" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M 16 0 L 0 0 0 16" fill="none" stroke="#21215a" stroke-width="0.5"/></pattern>
    </defs>
    <g transform="rotate(45, 128, 128)">
      <rect width="256" height="256" fill="#09090f"/>
      <rect width="256" height="256" fill="url(#etile)"/>
      <rect width="256" height="256" fill="url(#echunk)"/>
      <rect x="0" y="0" width="256" height="30" fill="rgba(220,38,38,0.10)"/>
      <rect x="0" y="226" width="256" height="30" fill="rgba(220,38,38,0.10)"/>
      <rect x="0" y="30" width="30" height="196" fill="rgba(220,38,38,0.10)"/>
      <rect x="226" y="30" width="30" height="196" fill="rgba(220,38,38,0.10)"/>
      <rect x="30" y="30" width="196" height="196" fill="none" stroke="rgba(34,197,94,0.35)" stroke-width="0.5" stroke-dasharray="2,2"/>
      <rect x="92" y="92" width="72" height="72" fill="rgba(220,38,38,0.10)"/>
      <rect x="92" y="92" width="72" height="72" fill="none" stroke="rgba(220,38,38,0.45)" stroke-width="0.5" stroke-dasharray="2,2"/>
      <rect x="${CITY_HALL.x - CITY_HALL.size / 2}" y="${CITY_HALL.y - CITY_HALL.size / 2}" width="${CITY_HALL.size}" height="${CITY_HALL.size}" fill="#92680c" fill-opacity="0.4"/>
      ${plazaFootprints}
      ${armoryFootprints}
      ${baseFootprints}
    </g>
    <image href="${imgs.cityHall}" x="${chPos.x - CITY_HALL.size / 2}" y="${chPos.y - CITY_HALL.size / 2}" width="${CITY_HALL.size}" height="${CITY_HALL.size}" preserveAspectRatio="xMidYMid meet"/>
    ${armoryImgs}
    ${baseImgs}
    <polygon points="${diamondPoints}" fill="none" stroke="#2a2a6a" stroke-width="1"/>
  </svg>`
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

type LegendType = 'cityhall' | 'plaza' | 'armory' | 'armoryU' | 'base' | 'buildable' | 'restricted'

function drawLegendSwatch(ctx: CanvasRenderingContext2D, type: LegendType, x: number, y: number) {
  const S = 15
  const ry = y - S / 2
  ctx.save()
  ctx.setLineDash([])
  switch (type) {
    case 'cityhall':
      ctx.fillStyle = 'rgba(146,104,12,0.8)'; ctx.fillRect(x, ry, S, S)
      ctx.strokeStyle = '#f0c040'; ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(x + 3, ry + S / 2); ctx.lineTo(x + S - 3, ry + S / 2)
      ctx.moveTo(x + S / 2, ry + 3); ctx.lineTo(x + S / 2, ry + S - 3)
      ctx.stroke()
      break
    case 'plaza':
      ctx.fillStyle = 'rgba(91,33,182,0.85)'; ctx.fillRect(x, ry, S, S); break
    case 'armory':
      ctx.fillStyle = 'rgba(194,65,12,0.85)'; ctx.fillRect(x, ry, S, S); break
    case 'armoryU':
      ctx.fillStyle = 'rgba(159,18,57,0.85)'; ctx.fillRect(x, ry, S, S)
      ctx.strokeStyle = '#f87171'; ctx.lineWidth = 1.3; ctx.strokeRect(x + 0.5, ry + 0.5, S - 1, S - 1); break
    case 'base':
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 2, ry + 2, S - 4, S - 4)
      ctx.strokeStyle = '#999'; ctx.lineWidth = 1.2; ctx.strokeRect(x + 2, ry + 2, S - 4, S - 4); break
    case 'buildable':
      ctx.fillStyle = 'rgba(34,197,94,0.22)'; ctx.fillRect(x, ry, S, S)
      ctx.strokeStyle = 'rgba(34,197,94,0.6)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 2]); ctx.strokeRect(x + 0.5, ry + 0.5, S - 1, S - 1); break
    case 'restricted':
      ctx.fillStyle = 'rgba(220,38,38,0.22)'; ctx.fillRect(x, ry, S, S)
      ctx.strokeStyle = 'rgba(220,38,38,0.6)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 2]); ctx.strokeRect(x + 0.5, ry + 0.5, S - 1, S - 1); break
  }
  ctx.restore()
}

async function exportConfig(ultimate: boolean, bases: Base[], league: string, groupNames: Record<number, string>) {
  const [cityHall, armory, base] = await Promise.all([
    toDataUrl('/dcdl/resource_icons/Gotham_CityHall.png'),
    toDataUrl('/dcdl/resource_icons/Gotham_Armory.png'),
    toDataUrl('/dcdl/resource_icons/Gotham_PlayerBase.png'),
  ])

  const svg = buildMapSvg(ultimate, bases, { cityHall, armory, base })
  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  const mapImg = await loadImage(svgUrl)

  const trimmedLeague = league.trim()
  const modeName = ultimate ? 'ULTIMATE BATTLE FOR GOTHAM' : 'BATTLE FOR GOTHAM'

  const legendItems: [LegendType, string][] = [
    ['cityhall', 'Gotham City Hall'],
    ['plaza', 'Gotham Plaza (×8)'],
    ['armory', ultimate ? 'Armory (both modes)' : 'Armory'],
    ...(ultimate ? ([['armoryU', 'Armory (Ultimate only)']] as [LegendType, string][]) : []),
    ['base', 'Player Base'],
    ['buildable', 'Buildable Zone'],
    ['restricted', 'Restricted Zone'],
  ]
  const legendRows = Math.ceil(legendItems.length / 2)

  const W = 1000
  const HEADER = trimmedLeague ? 108 : 92
  const MAP = 1000
  const LEGEND = 20 + 30 + legendRows * 28 + 12
  const populatedGroups = GROUPS.filter(g => bases.some(b => b.group === g.id))
  const rosterRows = Math.max(...populatedGroups.map(g => bases.filter(b => b.group === g.id).length), 1)
  const ROSTER = populatedGroups.length > 0 ? 20 + 30 + 26 + rosterRows * 26 + 16 : 24
  const H = HEADER + MAP + LEGEND + ROSTER

  const canvas = document.createElement('canvas')
  const scale = 2
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#0c0c16')
  bg.addColorStop(1, '#07070b')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Header
  ctx.textBaseline = 'middle'
  if (trimmedLeague) {
    ctx.fillStyle = '#CCA453'
    ctx.font = '700 16px Unbounded, sans-serif'
    ctx.fillText(trimmedLeague.toUpperCase(), 34, 30)
    ctx.fillStyle = '#ffffff'
    ctx.font = '800 28px Unbounded, sans-serif'
    ctx.fillText(modeName, 34, 62)
    ctx.fillStyle = 'rgba(79,142,247,0.9)'
    ctx.font = '600 12px Inter, sans-serif'
    ctx.fillText('QUANTUM GAME GUIDES', 34, 88)
  } else {
    ctx.fillStyle = '#CCA453'
    ctx.font = '700 15px Unbounded, sans-serif'
    ctx.fillText('QUANTUM GAME GUIDES', 34, 32)
    ctx.fillStyle = '#ffffff'
    ctx.font = '800 30px Unbounded, sans-serif'
    ctx.fillText(modeName, 34, 66)
  }
  ctx.strokeStyle = 'rgba(79,142,247,0.5)'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(34, HEADER - 2); ctx.lineTo(W - 34, HEADER - 2); ctx.stroke()

  // Map
  ctx.drawImage(mapImg, 0, HEADER, MAP, MAP)

  // Map legend
  {
    const lTop = HEADER + MAP + 20
    ctx.fillStyle = '#CCA453'
    ctx.font = '700 13px Unbounded, sans-serif'
    ctx.fillText('MAP LEGEND', 34, lTop)
    const colW = (W - 68) / 2
    legendItems.forEach(([type, label], i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = 34 + col * colW
      const y = lTop + 32 + row * 28
      drawLegendSwatch(ctx, type, x, y)
      ctx.fillStyle = 'rgba(255,255,255,0.82)'
      ctx.font = '400 14px Inter, sans-serif'
      ctx.fillText(label, x + 24, y)
    })
  }

  // Roster
  if (populatedGroups.length > 0) {
    const top = HEADER + MAP + LEGEND + 20
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(34, top - 16); ctx.lineTo(W - 34, top - 16); ctx.stroke()
    ctx.fillStyle = '#CCA453'
    ctx.font = '700 13px Unbounded, sans-serif'
    ctx.fillText('DEPLOYMENT ROSTER', 34, top)
    const colW = (W - 68) / populatedGroups.length
    populatedGroups.forEach((g, i) => {
      const x = 34 + i * colW
      let y = top + 34
      ctx.fillStyle = g.color
      ctx.beginPath(); ctx.roundRect(x, y - 6, 11, 11, 2); ctx.fill()
      ctx.font = '700 12px Unbounded, sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.fillText((groupNames[g.id] || g.name).toUpperCase(), x + 18, y)
      y += 26
      ctx.font = '400 14px Inter, sans-serif'
      bases.filter(b => b.group === g.id).forEach(b => {
        ctx.fillStyle = g.color
        ctx.beginPath(); ctx.arc(x + 4, y, 3, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.82)'
        ctx.fillText(b.name, x + 14, y)
        y += 26
      })
    })
  }

  const blob: Blob = await new Promise((resolve) => canvas.toBlob(b => resolve(b!), 'image/png'))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gotham-${ultimate ? 'ultimate' : 'battle'}-layout.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ══════════════════════════════════════════════════════════════
//  IMPORT — read Column A (rows 1–100) of a CSV/XLSX file
// ══════════════════════════════════════════════════════════════
async function parseNamesFile(file: File): Promise<string[]> {
  const XLSX = await import('xlsx')
  const data = new Uint8Array(await file.arrayBuffer())
  let wb
  try {
    wb = XLSX.read(data, { type: 'array' })
  } catch {
    throw new Error('Could not read that file. Please upload a .csv or .xlsx spreadsheet.')
  }
  const sheetName = wb.SheetNames[0]
  if (!sheetName) throw new Error('The spreadsheet has no sheets.')
  const ws = wb.Sheets[sheetName]
  if (!ws || !ws['!ref']) throw new Error('The spreadsheet appears to be empty.')

  const rowMap: Record<number, string> = {}
  for (const addr of Object.keys(ws)) {
    if (addr[0] === '!') continue
    const cell = ws[addr]
    if (cell == null || cell.v == null) continue
    const val = String(cell.v).trim()
    if (!val) continue
    const { c, r } = XLSX.utils.decode_cell(addr)
    if (c > 0) throw new Error(`Only Column A may contain names — found data in column ${XLSX.utils.encode_col(c)}. Remove it and try again.`)
    if (r > 99) throw new Error('Too many names — only rows 1–100 of Column A are allowed.')
    rowMap[r] = val
  }

  const names = Object.keys(rowMap)
    .map(Number)
    .sort((a, b) => a - b)
    .map(r => rowMap[r].slice(0, 24))
  if (names.length === 0) throw new Error('No names found in Column A, starting at Row 1.')
  return names
}

function makeImportedBases(names: string[]): Base[] {
  const spots = findFreeSpots(names.length)
  const fallback = { x: BZ.x1, y: BZ.y1 }
  return names.map((name, i) => {
    const spot = spots[i] ?? fallback
    return {
      id: `b${Date.now().toString(36)}${i.toString(36)}${Math.random().toString(36).slice(2, 4)}`,
      name,
      group: 1,
      x: spot.x,
      y: spot.y,
    }
  })
}

// ══════════════════════════════════════════════════════════════
//  PAGE
// ══════════════════════════════════════════════════════════════
const secTitle: CSSProperties = {
  fontFamily: 'Unbounded, sans-serif', fontSize: '0.75rem', fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)',
  borderBottom: '1px solid rgba(204,164,83,0.3)', paddingBottom: '0.5rem', marginBottom: '0.75rem',
}

function Swatch({ children }: { children: React.ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
      {children}
    </svg>
  )
}

const STORAGE_KEY = 'sc-gotham-bases-v1'
const LEAGUE_KEY = 'sc-gotham-league-v1'
const GROUPNAMES_KEY = 'sc-gotham-groups-v1'
const DEFAULT_GROUP_NAMES: Record<number, string> = { 1: 'Group 1', 2: 'Group 2', 3: 'Group 3', 4: 'Group 4' }

export default function ShipCombatGuidesPage() {
  const [mode, setMode] = useState<MapMode>('battle')
  const [basesByMode, setBasesByMode] = useState<Record<MapMode, Base[]>>({ battle: [], ultimate: [] })
  const [selectedByMode, setSelectedByMode] = useState<Record<MapMode, string[]>>({ battle: [], ultimate: [] })
  const [league, setLeague] = useState('')
  const [groupNames, setGroupNames] = useState<Record<number, string>>(DEFAULT_GROUP_NAMES)
  const [exporting, setExporting] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const firstPersist = useRef(true)
  const firstLeaguePersist = useRef(true)
  const firstGroupPersist = useRef(true)

  // Load persisted state once on mount (client only, so hydration stays consistent)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && Array.isArray(parsed.battle) && Array.isArray(parsed.ultimate)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
          setBasesByMode(parsed)
        }
      }
      const savedLeague = localStorage.getItem(LEAGUE_KEY)
      if (savedLeague) setLeague(savedLeague)
      const savedGroups = localStorage.getItem(GROUPNAMES_KEY)
      if (savedGroups) {
        const parsed = JSON.parse(savedGroups)
        if (parsed && typeof parsed === 'object') setGroupNames({ ...DEFAULT_GROUP_NAMES, ...parsed })
      }
    } catch {}
  }, [])

  // Persist bases; skip the initial mount so we never clobber stored data before it loads
  useEffect(() => {
    if (firstPersist.current) { firstPersist.current = false; return }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(basesByMode)) } catch {}
  }, [basesByMode])

  useEffect(() => {
    if (firstLeaguePersist.current) { firstLeaguePersist.current = false; return }
    try { localStorage.setItem(LEAGUE_KEY, league) } catch {}
  }, [league])

  useEffect(() => {
    if (firstGroupPersist.current) { firstGroupPersist.current = false; return }
    try { localStorage.setItem(GROUPNAMES_KEY, JSON.stringify(groupNames)) } catch {}
  }, [groupNames])

  const bases = basesByMode[mode]
  const selectedIds = selectedByMode[mode]

  const setBases = useCallback((updater: (prev: Base[]) => Base[]) => {
    setBasesByMode(prev => ({ ...prev, [mode]: updater(prev[mode]) }))
  }, [mode])

  const setSelectedIds = useCallback((next: string[]) => {
    setSelectedByMode(prev => ({ ...prev, [mode]: next }))
  }, [mode])

  const addBase = useCallback(() => {
    setBasesByMode(prev => {
      const current = prev[mode]
      const spot = findFreeSpot(current)
      const id = `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
      const nb: Base = { id, name: nextPlayerName(current), group: 1, x: spot.x, y: spot.y }
      setSelectedByMode(s => ({ ...s, [mode]: [id] }))
      return { ...prev, [mode]: [...current, nb] }
    })
  }, [mode])

  const resetMap = useCallback(() => {
    setBasesByMode(prev => ({ ...prev, [mode]: [] }))
    setSelectedByMode(prev => ({ ...prev, [mode]: [] }))
    setConfirmReset(false)
  }, [mode])

  const setGroupName = useCallback((id: number, name: string) => {
    setGroupNames(prev => ({ ...prev, [id]: name }))
  }, [])

  const openImport = useCallback(() => {
    setImportError(null)
    setImportOpen(true)
  }, [])

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    setImporting(true)
    setImportError(null)
    try {
      const names = await parseNamesFile(file)
      const imported = makeImportedBases(names)
      setBasesByMode(prev => ({ ...prev, [mode]: imported }))
      setSelectedByMode(prev => ({ ...prev, [mode]: [] }))
      setImportOpen(false)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }, [mode])

  const handleExport = useCallback(async () => {
    setExporting(true)
    try {
      await exportConfig(mode === 'ultimate', basesByMode[mode], league, groupNames)
    } catch (e) {
      console.error('Export failed', e)
      alert('Export failed — please try again.')
    } finally {
      setExporting(false)
    }
  }, [mode, basesByMode, league, groupNames])

  return (
    <main className="sc-root" style={{ '--game-accent': '#4f8ef7' } as CSSProperties}>
      <section className="gh-hero">
        <div className="container">
          <p className="gh-overline">Ship Combat</p>
          <h1 className="gh-hero-title">DC: Dark Legion</h1>
          <p className="gh-hero-sub">Plan your Gotham deployment — place league bases, group them by squad, and export a battle-ready layout.</p>
          <div className="gh-hero-divider" />
          <div className="gh-hero-back">
            <a href="/games/dc-dark-legion" style={{ fontSize: '0.78rem', color: 'var(--gold)', opacity: 0.85, textDecoration: 'none' }}>← Champion List</a>
          </div>
        </div>
      </section>

      <section style={{ padding: '2rem 0' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Mode switcher */}
          <div className="sc-modes" role="tablist" aria-label="Map mode">
            <button
              role="tab"
              aria-selected={mode === 'battle'}
              className={`sc-mode${mode === 'battle' ? ' is-active' : ''}`}
              onClick={() => setMode('battle')}
            >
              <span className="sc-dot" />Battle For Gotham
            </button>
            <button
              role="tab"
              aria-selected={mode === 'ultimate'}
              className={`sc-mode${mode === 'ultimate' ? ' is-active' : ''}`}
              onClick={() => setMode('ultimate')}
            >
              <span className="sc-dot" />Ultimate Battle For Gotham
            </button>
          </div>

          {/* Map + roster */}
          <div className="sc-workspace">
            <GameMap
              key={mode}
              ultimate={mode === 'ultimate'}
              bases={bases}
              setBases={setBases}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              groupNames={groupNames}
            />
            <RosterPanel
              bases={bases}
              setBases={setBases}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              league={league}
              setLeague={setLeague}
              groupNames={groupNames}
              setGroupName={setGroupName}
              onAdd={addBase}
              onImport={openImport}
              onExport={handleExport}
              onReset={() => setConfirmReset(true)}
              exporting={exporting}
            />
          </div>

          {/* Legend */}
          <div className="card">
            <div style={secTitle}>Map Legend</div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Swatch>
                  <rect x="1" y="1" width="14" height="14" fill="#92680c" fillOpacity="0.7" />
                  <line x1="4" y1="8" x2="12" y2="8" stroke="#f0c040" strokeWidth="1.2" />
                  <line x1="8" y1="4" x2="8" y2="12" stroke="#f0c040" strokeWidth="1.2" />
                </Swatch>
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>Gotham City Hall</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Swatch>
                  <rect x="2" y="2" width="12" height="12" fill="#5b21b6" fillOpacity="0.7" />
                </Swatch>
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>Gotham Plaza (×8)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Swatch>
                  <rect x="2" y="2" width="12" height="12" fill="#c2410c" fillOpacity="0.7" />
                </Swatch>
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>Armory (both modes)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Swatch>
                  <rect x="2" y="2" width="12" height="12" fill="#9f1239" fillOpacity="0.7" stroke="#f87171" strokeWidth="1" />
                </Swatch>
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>Armory (Ultimate only)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Swatch>
                  <rect x="4" y="4" width="8" height="8" fill="white" stroke="#999" strokeWidth="1" />
                </Swatch>
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>Player Base (add from roster, drag to place)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Swatch>
                  <rect width="16" height="16" fill="rgba(34,197,94,0.2)" />
                  <rect width="16" height="16" fill="none" stroke="rgba(34,197,94,0.5)" strokeWidth="0.8" strokeDasharray="2,1.5" />
                </Swatch>
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>Buildable Zone</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Swatch>
                  <rect width="16" height="16" fill="rgba(220,38,38,0.2)" />
                  <rect width="16" height="16" fill="none" stroke="rgba(220,38,38,0.5)" strokeWidth="0.8" strokeDasharray="2,1.5" />
                </Swatch>
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>Restricted Zone</span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Logos Footer */}
      <section style={{ padding: '2.5rem 0 3rem' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
            <img
              src="/images/site/Q%20GOLD%20FULL%20ICON.png"
              alt="Quantum Game Guides"
              style={{ height: '6rem', objectFit: 'contain' }}
            />
            <img
              src="/dcdl/logos/Game_logo_-_blue_white.png"
              alt="DC: Dark Legion"
              style={{ height: '6rem', objectFit: 'contain' }}
            />
          </div>
        </div>
      </section>

      {confirmReset && (
        <div className="sc-modal-backdrop" onClick={() => setConfirmReset(false)}>
          <div className="sc-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="sc-modal-title">Reset Map?</div>
            <p className="sc-modal-text">
              This removes every base on the{' '}
              <strong style={{ color: '#fff' }}>{mode === 'ultimate' ? 'Ultimate Battle For Gotham' : 'Battle For Gotham'}</strong>
              {' '}map. This can&apos;t be undone.
            </p>
            <div className="sc-modal-actions">
              <button className="sc-btn sc-btn-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
              <button className="sc-btn sc-btn-danger" onClick={resetMap}>Reset Map</button>
            </div>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="sc-modal-backdrop" onClick={() => setImportOpen(false)}>
          <div className="sc-modal sc-modal-info" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="sc-modal-title">Import Player Names</div>
            <p className="sc-modal-text">
              You may upload a simple spreadsheet file to pre-fill your player names for your league. The file MUST only use the first column of the spreadsheet. Start with the first player on Column A, Row 1. You may add up to 100 names. Anything outside of Column A or past row 100 will throw an error.
            </p>
            {bases.length > 0 && (
              <p className="sc-modal-warn">Heads up: this replaces the {bases.length} base{bases.length === 1 ? '' : 's'} currently on this map.</p>
            )}
            {importError && <p className="sc-modal-error">{importError}</p>}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
            <div className="sc-modal-actions">
              <button className="sc-btn sc-btn-ghost" onClick={() => setImportOpen(false)}>Cancel</button>
              <button className="sc-btn" onClick={() => fileRef.current?.click()} disabled={importing}>
                {importing ? 'Reading…' : 'Choose File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
