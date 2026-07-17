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

// On-map display numbers — bottom-left tile is 1, then counter-clockwise (screen
// space, after the 45° rotation). Armories: the four always-present ones take 1–4,
// the two Ultimate-only ones continue as 5–6. Maps keyed by array index.
const ARMORY_NUMBER: Record<number, number> = { 0: 4, 1: 3, 2: 1, 3: 2, 4: 5, 5: 6 }
const PLAZA_NUMBER: Record<number, number> = { 0: 7, 1: 6, 2: 5, 3: 4, 4: 3, 5: 2, 6: 1, 7: 8 }
const armoryNumber = (i: number) => ARMORY_NUMBER[i] ?? i + 1
const plazaNumber = (i: number) => PLAZA_NUMBER[i] ?? i + 1

// Diamond viewport geometry
const MAP_MARGIN = Math.round(128 * Math.sqrt(2)) - 128  // ≈ 53
const ISO_SIZE   = 256 + MAP_MARGIN * 2                  // ≈ 362
const ISO_ORIGIN = -MAP_MARGIN                           // ≈ -53

const MIN_ZOOM = 1
const MAX_ZOOM = 12

// ─── Groups ──────────────────────────────────────────────────
type Group = { id: number; name: string; color: string; soft: string }
const GROUPS: Group[] = [
  { id: 1, name: 'Group 1', color: '#ef4444', soft: 'rgba(239,68,68,0.16)' },   // red
  { id: 2, name: 'Group 2', color: '#3b82f6', soft: 'rgba(59,130,246,0.16)' },  // blue
  { id: 3, name: 'Group 3', color: '#22c55e', soft: 'rgba(34,197,94,0.16)' },   // green
  { id: 4, name: 'Group 4', color: '#eab308', soft: 'rgba(234,179,8,0.16)' },   // yellow
  { id: 5, name: 'Group 5', color: '#f97316', soft: 'rgba(249,115,22,0.16)' },  // orange
  { id: 6, name: 'Group 6', color: '#a855f7', soft: 'rgba(168,85,247,0.16)' },  // purple
  { id: 7, name: 'Group 7', color: '#06b6d4', soft: 'rgba(6,182,212,0.16)' },   // cyan
  { id: 8, name: 'Group 8', color: '#ec4899', soft: 'rgba(236,72,153,0.16)' },  // pink
]
const groupById = (id: number) => GROUPS.find(g => g.id === id) ?? GROUPS[0]

type Base = { id: string; name: string; group: number; x: number; y: number }
type MapMode = 'battle' | 'ultimate'

// ─── Building links ──────────────────────────────────────────
// A base or a whole group can be tied to a building; a thick white line is drawn
// from each involved base to the building. 'city' = City Hall, a number = index
// into ARMORIES.
type BuildingId = 'city' | number
type Link =
  | { kind: 'base'; baseId: string; building: BuildingId }
  | { kind: 'group'; group: number; building: BuildingId }

function buildingMapPos(b: BuildingId) {
  if (b === 'city') return { x: CITY_HALL.x, y: CITY_HALL.y }
  const a = ARMORIES[b]
  return { x: a.x, y: a.y }
}
function buildingLabel(b: BuildingId) {
  return b === 'city' ? 'City Hall' : `Armory ${armoryNumber(b)}`
}
// Buildings available to link in a given mode (ultimate exposes the extra armories),
// armories ordered by their on-map number so the picker reads 1, 2, 3…
function buildingsForMode(ultimate: boolean): BuildingId[] {
  const armories = ARMORIES
    .map((a, i) => ({ a, i }))
    .filter(({ a }) => ultimate || !a.ultimateOnly)
    .map(({ i }) => i)
    .sort((x, y) => armoryNumber(x) - armoryNumber(y))
  return ['city', ...armories]
}
function sameBuilding(a: BuildingId, b: BuildingId) { return a === b }
function linkMatchesTarget(l: Link, t: { kind: 'base'; baseId: string } | { kind: 'group'; group: number }) {
  return l.kind === t.kind && (l.kind === 'base'
    ? l.baseId === (t as { baseId: string }).baseId
    : l.group === (t as { group: number }).group)
}

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

// ─── Solo-group label layout ─────────────────────────────────
// For each group with exactly one member, the GROUP name is floated beside the
// base. Plates stack outward toward the side of the map the base sits on
// (left half → a column to the left, right half → to the right) so they sit in
// the dark edge space instead of covering the middle of the board. Within a
// side, plates hug their base's row and nudge down only as needed to avoid
// overlapping each other. Used by both GameMap and the PNG export.
type SoloLabel = { id: string; name: string; color: string; cx: number; cy: number; px: number; py: number; lx: number; w: number }

// Screen-space extent of the plaza ring: label columns sit just outside the
// outermost plazas so they clear all the buildings, not just the bases.
const PLAZA_HALF_DIAG = (PLAZA[0].size / 2) * Math.SQRT2 // rotated square's half-diagonal
const PLAZA_SCREEN_X = PLAZA.map(p => rotatePoint(p.x, p.y, 128, 128, 45).x)
const SOLO_COL_LEFT = Math.min(...PLAZA_SCREEN_X) - PLAZA_HALF_DIAG
const SOLO_COL_RIGHT = Math.max(...PLAZA_SCREEN_X) + PLAZA_HALF_DIAG

function layoutSoloLabels(bases: Base[], groupNames: Record<number, string>): SoloLabel[] {
  const solos = GROUPS
    .map(g => bases.filter(b => b.group === g.id))
    .filter(m => m.length === 1)
    .map(m => {
      const b = m[0]
      const c = toSvg(b.x + BASE_SIZE / 2, b.y + BASE_SIZE / 2)
      const name = groupNames[b.group] || groupById(b.group).name
      return {
        id: b.id,
        name,
        color: groupById(b.group).color,
        cx: c.x,
        cy: c.y,
        w: name.length * 3 + 6,
      }
    })

  const out: SoloLabel[] = []
  const rowH = 8    // vertical footprint of a plate row (plate is 7 tall)
  const gap = 3.5   // clearance between a base and its plate column
  for (const side of ['left', 'right'] as const) {
    const arr = solos
      .filter(s => (side === 'left' ? s.cx < 128 : s.cx >= 128))
      .sort((a, b) => a.cy - b.cy)
    if (arr.length === 0) continue
    // One clean column outside the outermost plazas — pushed further out only
    // when a base on this side sits even wider than the plaza ring.
    const edge = side === 'left'
      ? Math.min(SOLO_COL_LEFT, Math.min(...arr.map(s => s.cx)) - BASE_SIZE / 2) - gap
      : Math.max(SOLO_COL_RIGHT, Math.max(...arr.map(s => s.cx)) + BASE_SIZE / 2) + gap
    let prevBottom = ISO_ORIGIN + 2
    for (const s of arr) {
      let py = s.cy - 3.5 // center the plate on the base's row when there's room
      if (py < prevBottom) py = prevBottom
      py = Math.min(py, ISO_ORIGIN + ISO_SIZE - 9)
      prevBottom = py + rowH
      let px = side === 'left' ? edge - s.w : edge
      px = Math.max(ISO_ORIGIN + 2, Math.min(px, ISO_ORIGIN + ISO_SIZE - 2 - s.w))
      const lx = side === 'left' ? px + s.w : px // leader line meets the near plate edge
      out.push({ ...s, px, py, lx })
    }
  }
  return out
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
  links,
  soloLabels,
  onRemoveBase,
}: {
  ultimate: boolean
  bases: Base[]
  setBases: (updater: (prev: Base[]) => Base[]) => void
  selectedIds: string[]
  setSelectedIds: (next: string[]) => void
  groupNames: Record<number, string>
  links: Link[]
  soloLabels: boolean
  onRemoveBase: (id: string) => void
}) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: ISO_ORIGIN, y: ISO_ORIGIN })
  const [cursor, setCursor] = useState<'grab' | 'grabbing' | 'move'>('grab')

  // Quick-action context menu (right-click, or press-and-hold on touch)
  const [ctxMenu, setCtxMenu] = useState<{ baseId: string; x: number; y: number } | null>(null)
  const [ctxRename, setCtxRename] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const longPress = useRef<number | null>(null)

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

  // ─── context menu ───
  const clearLongPress = () => {
    if (longPress.current != null) {
      clearTimeout(longPress.current)
      longPress.current = null
    }
  }
  useEffect(() => () => { if (longPress.current != null) clearTimeout(longPress.current) }, [])

  const openMenu = useCallback((baseId: string, clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const x = Math.max(8, Math.min(clientX - rect.left, rect.width - 196))
    const y = Math.max(8, Math.min(clientY - rect.top, rect.height - 200))
    setCtxRename(null)
    setCtxMenu({ baseId, x, y })
    setSelectedIds([baseId])
  }, [setSelectedIds])

  // Close on any press outside the menu (capture phase so map presses count too)
  useEffect(() => {
    if (!ctxMenu) return
    const onDown = (e: PointerEvent) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) return
      setCtxMenu(null)
    }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setCtxMenu(null) }
    document.addEventListener('pointerdown', onDown, true)
    window.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('keydown', onEsc)
    }
  }, [ctxMenu])

  const commitCtxRename = (id: string) => {
    if (ctxRename != null) {
      const name = ctxRename.trim() || 'Player'
      setBases(prev => prev.map(x => (x.id === id ? { ...x, name } : x)))
    }
    setCtxRename(null)
    setCtxMenu(null)
  }

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
    if (e.pointerType === 'mouse' && e.button !== 0) return // right-click is handled by onContextMenu
    e.currentTarget.setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2) {
      clearLongPress()
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
      // Touch/pen: press-and-hold (without dragging) opens the quick-action menu
      if (e.pointerType !== 'mouse') {
        const px = e.clientX, py = e.clientY, hid = hit.id
        clearLongPress()
        longPress.current = window.setTimeout(() => {
          const g = gesture.current
          if (g && g.kind === 'move' && g.baseId === hid && !g.moved) {
            gesture.current = null
            setCursor('grab')
            openMenu(hid, px, py)
          }
        }, 500)
      }
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
      clearLongPress() // real drag started — no long-press menu
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
    clearLongPress()
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

  // ─── Building link lines (thick white base→building connectors) ───
  const linkLines: { key: string; x1: number; y1: number; x2: number; y2: number }[] = []
  for (let li = 0; li < links.length; li++) {
    const ln = links[li]
    const bp = buildingMapPos(ln.building)
    const bpos = toSvg(bp.x, bp.y)
    const targets = ln.kind === 'base'
      ? bases.filter(b => b.id === ln.baseId)
      : bases.filter(b => b.group === ln.group)
    for (const b of targets) {
      const c = toSvg(b.x + BASE_SIZE / 2, b.y + BASE_SIZE / 2)
      linkLines.push({ key: `${li}-${b.id}`, x1: c.x, y1: c.y, x2: bpos.x, y2: bpos.y })
    }
  }

  // ─── Solo-group labels (ultimate only, toggle on) ───
  // Plates stack outward to the side of the map their base is on (see
  // layoutSoloLabels) so they never obscure the middle of the board.
  const soloLabelData = (ultimate && soloLabels) ? layoutSoloLabels(bases, groupNames) : []
  const soloIds = new Set(soloLabelData.map(s => s.id))
  // When a solo-group base is single-selected, its group label already names it —
  // suppress the player-name plate so the name never shows.
  const suppressSinglePlate = displayMode === 'single' && soloIds.has(selBases[0].id)

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
        onContextMenu={e => {
          e.preventDefault()
          const hit = baseAt(e.clientX, e.clientY)
          if (hit) openMenu(hit.id, e.clientX, e.clientY)
        }}
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
          <filter id={`softsh${pfx}`} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0.35" dy="0.6" stdDeviation="0.55" floodColor="#000000" floodOpacity="0.6" />
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

        {/* Building link lines (dark casing under a thick white line) */}
        {linkLines.map((l) => (
          <g key={l.key}>
            <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#06060c" strokeOpacity="0.75" strokeWidth="2.1" strokeLinecap="round" />
            <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#ffffff" strokeOpacity="0.95" strokeWidth="1.1" strokeLinecap="round" />
          </g>
        ))}

        {/* ── LAYER 2: upright building images, placed at rotated map coords ── */}

        {/* City Hall image */}
        <g filter={`url(#softsh${pfx})`}>
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
        </g>

        {/* Armory images */}
        <g filter={`url(#softsh${pfx})`}>
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
        </g>

        {/* Player Base images (always drawn) */}
        <g filter={`url(#softsh${pfx})`}>
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
        </g>

        {/* Plaza + armory number badges (upright, over the buildings) */}
        {PLAZA.map((p, i) => {
          const pos = toSvg(p.x, p.y)
          return (
            <g key={`pz${i}`}>
              <circle cx={pos.x} cy={pos.y} r="2.7" fill="rgba(6,6,12,0.82)" stroke="#7c3aed" strokeWidth="0.5" />
              <text x={pos.x} y={pos.y} fill="#fff" fontSize="3.4" fontFamily="Inter, sans-serif" fontWeight="700" textAnchor="middle" dominantBaseline="central">{plazaNumber(i)}</text>
            </g>
          )
        })}
        {ARMORIES.map((a, i) => {
          if (!ultimate && a.ultimateOnly) return null
          const pos = toSvg(a.x, a.y)
          return (
            <g key={`am${i}`}>
              <circle cx={pos.x} cy={pos.y} r="2.7" fill="rgba(6,6,12,0.82)" stroke="#f59e0b" strokeWidth="0.5" />
              <text x={pos.x} y={pos.y} fill="#fff" fontSize="3.4" fontFamily="Inter, sans-serif" fontWeight="700" textAnchor="middle" dominantBaseline="central">{armoryNumber(i)}</text>
            </g>
          )
        })}

        {/* White highlight ring on selected bases (group / names / >5 cases) */}
        {showHighlight && selBases.map((b) => {
          const c = toSvg(b.x + BASE_SIZE / 2, b.y + BASE_SIZE / 2)
          return (
            <rect key={b.id}
              className="sc-anim-pulse"
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
              <circle className="sc-anim-dash" cx={c.x} cy={c.y} r="7" fill="none" stroke={g.color} strokeOpacity="0.9" strokeWidth="0.7" strokeDasharray="1.5,1.5" />
              <circle cx={c.x} cy={c.y} r="4.2" fill="none" stroke={g.color} strokeWidth="0.6" />
              {!suppressSinglePlate && (
                <>
                  <rect x={c.x - (b.name.length * 1.35 + 2)} y={c.y - BASE_SIZE / 2 - 9}
                    width={b.name.length * 2.7 + 4} height="6" rx="1.5"
                    fill="rgba(6,6,12,0.85)" stroke={g.color} strokeOpacity="0.75" strokeWidth="0.25" />
                  <text x={c.x} y={c.y - BASE_SIZE / 2 - 4.7} fill="#fff" fontSize="3.6" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle">
                    {b.name}
                  </text>
                </>
              )}
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

        {/* Solo-group labels (ultimate + toggle): group name pill stacked to the base's side */}
        {soloLabelData.map((s) => (
          <g key={s.id}>
            <line x1={s.cx} y1={s.cy} x2={s.lx} y2={s.py + 3.5} stroke={s.color} strokeOpacity="0.8" strokeWidth="0.3" />
            <circle cx={s.cx} cy={s.cy} r="0.7" fill={s.color} />
            <rect x={s.px} y={s.py} width={s.w} height="7" rx="2"
              fill="rgba(6,6,12,0.9)" stroke={s.color} strokeWidth="0.4" />
            <text x={s.px + s.w / 2} y={s.py + 3.7} fill="#fff" fontSize="4" fontFamily="Inter, sans-serif" fontWeight="700" textAnchor="middle" dominantBaseline="middle">
              {s.name}
            </text>
          </g>
        ))}

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

      {/* Quick-action context menu */}
      {ctxMenu && (() => {
        const b = bases.find(x => x.id === ctxMenu.baseId)
        if (!b) return null
        const g = groupById(b.group)
        return (
          <div ref={menuRef} className="sc-ctxmenu" style={{ left: ctxMenu.x, top: ctxMenu.y }}>
            <div className="sc-ctx-head">
              <span className="sc-base-marker" style={{ color: g.color, background: g.color }} />
              {ctxRename == null ? (
                <span className="sc-ctx-name">{b.name}</span>
              ) : (
                <input
                  className="sc-base-name-input"
                  value={ctxRename}
                  autoFocus
                  maxLength={20}
                  onChange={e => setCtxRename(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commitCtxRename(b.id) }}
                  onBlur={() => commitCtxRename(b.id)}
                />
              )}
            </div>
            {ctxRename == null && (
              <>
                <button className="sc-ctx-item" onClick={() => setCtxRename(b.name)}>✎ Rename</button>
                <div className="sc-ctx-groups">
                  {GROUPS.map(gr => (
                    <button
                      key={gr.id}
                      className={`sc-swatch${gr.id === b.group ? ' is-current' : ''}`}
                      style={{ background: gr.color, color: gr.color }}
                      title={`Move to ${groupNames[gr.id] || gr.name}`}
                      onClick={() => {
                        setBases(prev => prev.map(x => (x.id === b.id ? { ...x, group: gr.id } : x)))
                        setCtxMenu(null)
                      }}
                    />
                  ))}
                </div>
                <button className="sc-ctx-item sc-ctx-danger" onClick={() => { onRemoveBase(b.id); setCtxMenu(null) }}>
                  ✕ Delete Base
                </button>
              </>
            )}
          </div>
        )
      })()}

      <span className="sc-hint">Scroll / pinch to zoom · drag to pan · right-click / hold a base for options</span>
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
  ultimate,
  bases,
  setBases,
  selectedIds,
  setSelectedIds,
  league,
  setLeague,
  groupNames,
  setGroupName,
  links,
  setLinks,
  soloLabels,
  setSoloLabels,
  onAdd,
  onImport,
  onExport,
  onReset,
  onRemove,
  onShare,
  onCopyMode,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  exporting,
}: {
  ultimate: boolean
  bases: Base[]
  setBases: (updater: (prev: Base[]) => Base[]) => void
  selectedIds: string[]
  setSelectedIds: (next: string[]) => void
  league: string
  setLeague: (name: string) => void
  groupNames: Record<number, string>
  setGroupName: (id: number, name: string) => void
  links: Link[]
  setLinks: (updater: (prev: Link[]) => Link[]) => void
  soloLabels: boolean
  setSoloLabels: (on: boolean) => void
  onAdd: () => void
  onImport: () => void
  onExport: () => void
  onReset: () => void
  onRemove: (id: string) => void
  onShare: () => void
  onCopyMode: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
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

  const setGroup = (id: string, group: number) => {
    setBases(prev => prev.map(b => (b.id === id ? { ...b, group } : b)))
  }

  // ─── Building links ───
  // What the current selection can be tied to: a single base, or a whole group.
  const selBases = bases.filter(b => selSet.has(b.id))
  let linkTarget:
    | { kind: 'base'; baseId: string; label: string; color: string }
    | { kind: 'group'; group: number; label: string; color: string }
    | null = null
  if (selBases.length === 1) {
    const b = selBases[0]
    linkTarget = { kind: 'base', baseId: b.id, label: b.name, color: groupById(b.group).color }
  } else if (selBases.length > 1) {
    const gids = new Set(selBases.map(b => b.group))
    if (gids.size === 1) {
      const gid = selBases[0].group
      if (selBases.length === bases.filter(b => b.group === gid).length) {
        linkTarget = { kind: 'group', group: gid, label: groupNames[gid] || groupById(gid).name, color: groupById(gid).color }
      }
    }
  }
  const targetKey = linkTarget && (linkTarget.kind === 'base'
    ? { kind: 'base' as const, baseId: linkTarget.baseId }
    : { kind: 'group' as const, group: linkTarget.group })
  const isLinkedTo = (building: BuildingId) =>
    !!targetKey && links.some(l => linkMatchesTarget(l, targetKey) && sameBuilding(l.building, building))

  // Click a building: toggle just that building for the current target.
  // A target can be tied to several buildings at once.
  const chooseBuilding = (building: BuildingId) => {
    if (!targetKey) return
    setLinks(prev => {
      const exists = prev.some(l => linkMatchesTarget(l, targetKey) && sameBuilding(l.building, building))
      if (exists) return prev.filter(l => !(linkMatchesTarget(l, targetKey) && sameBuilding(l.building, building)))
      const nl: Link = targetKey.kind === 'base'
        ? { kind: 'base', baseId: targetKey.baseId, building }
        : { kind: 'group', group: targetKey.group, building }
      return [...prev, nl]
    })
  }

  const linkRowLabel = (l: Link) =>
    l.kind === 'base'
      ? (bases.find(b => b.id === l.baseId)?.name ?? 'Base')
      : (groupNames[l.group] || groupById(l.group).name)
  const linkRowColor = (l: Link) =>
    l.kind === 'base'
      ? groupById(bases.find(b => b.id === l.baseId)?.group ?? 1).color
      : groupById(l.group).color
  const removeLink = (l: Link) => setLinks(prev => prev.filter(x => x !== l))

  const buildings = buildingsForMode(ultimate)

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
      <div className="sc-actions">
        <button className="sc-btn sc-btn-ghost" onClick={onShare} title="Share this layout as a code or link — or load one">⤴ Share</button>
        <button
          className="sc-btn sc-btn-ghost"
          onClick={onCopyMode}
          disabled={bases.length === 0}
          title={ultimate ? 'Copy this layout to the Battle map' : 'Copy this layout to the Ultimate map'}
        >
          ⧉ {ultimate ? 'To Battle' : 'To Ultimate'}
        </button>
      </div>
      <div className="sc-actions">
        <button className="sc-btn sc-btn-ghost" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">↶ Undo</button>
        <button className="sc-btn sc-btn-ghost" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">↷ Redo</button>
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

      {/* Solo-group name labels — Ultimate map only */}
      {ultimate && (
        <label className="sc-toggle" title="For any group with a single member, show the group name on the map instead of the player name.">
          <input
            type="checkbox"
            className="sc-toggle-input"
            checked={soloLabels}
            onChange={e => setSoloLabels(e.target.checked)}
          />
          <span className="sc-toggle-track"><span className="sc-toggle-thumb" /></span>
          <span className="sc-toggle-text">Label solo groups by group name</span>
        </label>
      )}

      {/* Building links */}
      {bases.length > 0 && (
        <div className="sc-links">
          <div className="sc-links-head">Building Links</div>
          {linkTarget ? (
            <>
              <div className="sc-link-target">
                <span className="sc-base-marker" style={{ color: linkTarget.color, background: linkTarget.color }} />
                Tie <strong>{linkTarget.label}</strong> to:
              </div>
              <div className="sc-link-btns">
                {buildings.map(b => {
                  const active = isLinkedTo(b)
                  return (
                    <button
                      key={String(b)}
                      className={`sc-link-btn${active ? ' is-active' : ''}`}
                      onClick={() => chooseBuilding(b)}
                    >
                      {buildingLabel(b)}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="sc-links-hint">Select a single base, or a whole group, to tie it to a building.</div>
          )}

          {links.length > 0 && (
            <div className="sc-link-list">
              {links.map((l, i) => (
                <div className="sc-link-row" key={i}>
                  <span className="sc-base-marker" style={{ color: linkRowColor(l), background: linkRowColor(l) }} />
                  <span className="sc-link-row-label">{linkRowLabel(l)}</span>
                  <span className="sc-link-row-arrow">→</span>
                  <span className="sc-link-row-bldg">{buildingLabel(l.building)}</span>
                  <button className="sc-del" title="Remove link" onClick={() => removeLink(l)}>✕</button>
                </div>
              ))}
            </div>
          )}
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
                      <button className="sc-del" title="Remove base" onClick={e => { e.stopPropagation(); onRemove(b.id) }}>✕</button>
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

function buildMapSvg(ultimate: boolean, bases: Base[], imgs: Record<string, string>, links: Link[], soloLabels: boolean, groupNames: Record<number, string>) {
  const activeArmories = ultimate ? ARMORIES : ARMORIES.filter(a => !a.ultimateOnly)
  const chPos = toSvg(CITY_HALL.x, CITY_HALL.y)
  const diamondPoints = `128,${ISO_ORIGIN} ${ISO_ORIGIN + ISO_SIZE},128 128,${ISO_ORIGIN + ISO_SIZE} ${ISO_ORIGIN},128`

  // Building link lines (dark casing + thick white line)
  const linkSvg = links.map(ln => {
    const bp = buildingMapPos(ln.building)
    const bpos = toSvg(bp.x, bp.y)
    const targets = ln.kind === 'base'
      ? bases.filter(b => b.id === ln.baseId)
      : bases.filter(b => b.group === ln.group)
    return targets.map(b => {
      const c = toSvg(b.x + BASE_SIZE / 2, b.y + BASE_SIZE / 2)
      return `<line x1="${c.x}" y1="${c.y}" x2="${bpos.x}" y2="${bpos.y}" stroke="#06060c" stroke-opacity="0.75" stroke-width="2.1" stroke-linecap="round"/><line x1="${c.x}" y1="${c.y}" x2="${bpos.x}" y2="${bpos.y}" stroke="#ffffff" stroke-opacity="0.95" stroke-width="1.1" stroke-linecap="round"/>`
    }).join('')
  }).join('')

  // Plaza + armory number badges (upright)
  const plazaBadges = PLAZA.map((p, i) => {
    const pos = toSvg(p.x, p.y)
    return `<circle cx="${pos.x}" cy="${pos.y}" r="2.7" fill="rgba(6,6,12,0.82)" stroke="#7c3aed" stroke-width="0.5"/><text x="${pos.x}" y="${pos.y}" fill="#fff" font-size="3.4" font-family="Inter, sans-serif" font-weight="700" text-anchor="middle" dominant-baseline="central">${plazaNumber(i)}</text>`
  }).join('')
  const armoryBadges = ARMORIES.map((a, i) => {
    if (!ultimate && a.ultimateOnly) return ''
    const pos = toSvg(a.x, a.y)
    return `<circle cx="${pos.x}" cy="${pos.y}" r="2.7" fill="rgba(6,6,12,0.82)" stroke="#f59e0b" stroke-width="0.5"/><text x="${pos.x}" y="${pos.y}" fill="#fff" font-size="3.4" font-family="Inter, sans-serif" font-weight="700" text-anchor="middle" dominant-baseline="central">${armoryNumber(i)}</text>`
  }).join('')

  // Solo-group name labels (ultimate + toggle) — same side-stacked layout as on screen
  const soloSvg = (ultimate && soloLabels)
    ? layoutSoloLabels(bases, groupNames).map(s =>
        `<line x1="${s.cx}" y1="${s.cy}" x2="${s.lx}" y2="${s.py + 3.5}" stroke="${s.color}" stroke-opacity="0.8" stroke-width="0.3"/><circle cx="${s.cx}" cy="${s.cy}" r="0.7" fill="${s.color}"/><rect x="${s.px}" y="${s.py}" width="${s.w}" height="7" rx="2" fill="rgba(6,6,12,0.9)" stroke="${s.color}" stroke-width="0.4"/><text x="${s.px + s.w / 2}" y="${s.py + 3.7}" fill="#fff" font-size="4" font-family="Inter, sans-serif" font-weight="700" text-anchor="middle" dominant-baseline="middle">${esc(s.name)}</text>`
      ).join('')
    : ''

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
      <filter id="esh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0.35" dy="0.6" stdDeviation="0.55" flood-color="#000000" flood-opacity="0.6"/></filter>
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
    ${linkSvg}
    <g filter="url(#esh)"><image href="${imgs.cityHall}" x="${chPos.x - CITY_HALL.size / 2}" y="${chPos.y - CITY_HALL.size / 2}" width="${CITY_HALL.size}" height="${CITY_HALL.size}" preserveAspectRatio="xMidYMid meet"/></g>
    <g filter="url(#esh)">${armoryImgs}</g>
    <g filter="url(#esh)">${baseImgs}</g>
    ${plazaBadges}
    ${armoryBadges}
    ${soloSvg}
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

async function exportConfig(ultimate: boolean, bases: Base[], league: string, groupNames: Record<number, string>, links: Link[], soloLabels: boolean) {
  const [cityHall, armory, base] = await Promise.all([
    toDataUrl('/dcdl/resource_icons/Gotham_CityHall.png'),
    toDataUrl('/dcdl/resource_icons/Gotham_Armory.png'),
    toDataUrl('/dcdl/resource_icons/Gotham_PlayerBase.png'),
  ])

  const svg = buildMapSvg(ultimate, bases, { cityHall, armory, base }, links, soloLabels, groupNames)
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
//  SHARE CODES — layout ⇆ compact base64url string
// ══════════════════════════════════════════════════════════════
// Format: "G1.<base64url deflate-raw JSON>", or "G0.<base64url JSON>" when
// CompressionStream isn't available. Base links are stored by base index so
// codes stay short; base ids are regenerated on load.
type SharePayload = {
  v: 1
  m: 'b' | 'u'
  b: [string, number, number, number][] // name, group, x, y
  l?: [0 | 1, number, 'c' | number][]   // [kind (0=base, 1=group), baseIndex|groupId, building]
  g?: Record<string, string>            // renamed groups only
  n?: string                            // league name
  s?: 1                                 // solo labels on
}
type DecodedShare = {
  mode: MapMode
  bases: Base[]
  links: Link[]
  groupNames: Record<number, string>
  league?: string
  solo?: boolean
}

function bytesToB64url(bytes: Uint8Array) {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlToBytes(s: string) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function pipeBytes(bytes: Uint8Array, ts: GenericTransformStream): Promise<Uint8Array> {
  const res = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(ts))
  return new Uint8Array(await res.arrayBuffer())
}

async function encodeShare(
  mode: MapMode, bases: Base[], links: Link[],
  groupNames: Record<number, string>, league: string, soloLabels: boolean,
): Promise<string> {
  const idx = new Map(bases.map((b, i) => [b.id, i]))
  const payload: SharePayload = {
    v: 1,
    m: mode === 'ultimate' ? 'u' : 'b',
    b: bases.map(b => [b.name, b.group, b.x, b.y]),
  }
  const l: NonNullable<SharePayload['l']> = []
  for (const ln of links) {
    const bld: 'c' | number = ln.building === 'city' ? 'c' : ln.building
    if (ln.kind === 'base') {
      const i = idx.get(ln.baseId)
      if (i != null) l.push([0, i, bld])
    } else {
      l.push([1, ln.group, bld])
    }
  }
  if (l.length) payload.l = l
  const g: Record<string, string> = {}
  for (const grp of GROUPS) {
    const name = groupNames[grp.id]
    if (name && name !== grp.name) g[grp.id] = name
  }
  if (Object.keys(g).length) payload.g = g
  if (league.trim()) payload.n = league.trim()
  if (soloLabels) payload.s = 1

  const raw = new TextEncoder().encode(JSON.stringify(payload))
  if (typeof CompressionStream !== 'undefined') {
    try {
      return 'G1.' + bytesToB64url(await pipeBytes(raw, new CompressionStream('deflate-raw')))
    } catch { /* fall back to uncompressed */ }
  }
  return 'G0.' + bytesToB64url(raw)
}

async function decodeShare(codeRaw: string): Promise<DecodedShare> {
  // Accept a bare code or a full share URL
  let code = codeRaw.trim()
  if (/^https?:\/\//i.test(code)) {
    try { code = new URL(code).searchParams.get('layout') ?? '' } catch { code = '' }
  }
  const m = /^G([01])\.([A-Za-z0-9_-]+)$/.exec(code)
  if (!m) throw new Error('That doesn’t look like a layout code — paste the full code (it starts with "G").')
  let raw: Uint8Array
  try {
    raw = b64urlToBytes(m[2])
    if (m[1] === '1') {
      if (typeof DecompressionStream === 'undefined') throw new Error('unsupported')
      raw = await pipeBytes(raw, new DecompressionStream('deflate-raw'))
    }
  } catch {
    throw new Error('Could not read that layout code — it may be incomplete or corrupted.')
  }
  let p: SharePayload
  try {
    p = JSON.parse(new TextDecoder().decode(raw))
  } catch {
    throw new Error('Could not read that layout code — it may be incomplete or corrupted.')
  }
  if (!p || p.v !== 1 || (p.m !== 'b' && p.m !== 'u') || !Array.isArray(p.b)) {
    throw new Error('That layout code isn’t compatible with this version of the tool.')
  }
  if (p.b.length > 100) throw new Error('That layout has more than 100 bases.')

  // Sanitize bases; anything with a bad or colliding position is re-placed center-out
  const byIndex: (Base | null)[] = p.b.map(() => null)
  const placed: Base[] = []
  const newId = (i: number) => `b${Date.now().toString(36)}${i.toString(36)}${Math.random().toString(36).slice(2, 4)}`
  const rows = p.b.map((row, i) => {
    if (!Array.isArray(row)) return null
    return {
      i,
      name: (String(row[0] ?? '').trim() || `Player ${i + 1}`).slice(0, 24),
      group: GROUPS.some(g => g.id === row[1]) ? (row[1] as number) : 1,
      x: Math.round(Number(row[2]) / TILE) * TILE,
      y: Math.round(Number(row[3]) / TILE) * TILE,
    }
  })
  for (const r of rows) {
    if (!r) continue
    if (Number.isFinite(r.x) && Number.isFinite(r.y) && isInBuildable(r.x, r.y) && !placed.some(b => basesOverlap(r.x, r.y, b.x, b.y))) {
      const b: Base = { id: newId(r.i), name: r.name, group: r.group, x: r.x, y: r.y }
      byIndex[r.i] = b
      placed.push(b)
    }
  }
  for (const r of rows) {
    if (!r || byIndex[r.i]) continue
    const s = findFreeSpot(placed)
    const b: Base = { id: newId(r.i), name: r.name, group: r.group, x: s.x, y: s.y }
    byIndex[r.i] = b
    placed.push(b)
  }
  if (placed.length === 0) throw new Error('That layout code contains no bases.')

  const ultimate = p.m === 'u'
  const links: Link[] = []
  if (Array.isArray(p.l)) {
    for (const row of p.l.slice(0, 400)) {
      if (!Array.isArray(row)) continue
      const [kind, ref, bld] = row
      let building: BuildingId | null = null
      if (bld === 'c') building = 'city'
      else if (typeof bld === 'number' && ARMORIES[bld] && (ultimate || !ARMORIES[bld].ultimateOnly)) building = bld
      if (building == null) continue
      if (kind === 0 && typeof ref === 'number' && byIndex[ref]) {
        links.push({ kind: 'base', baseId: byIndex[ref]!.id, building })
      } else if (kind === 1 && GROUPS.some(g => g.id === ref)) {
        links.push({ kind: 'group', group: ref as number, building })
      }
    }
  }

  const groupNames: Record<number, string> = {}
  if (p.g && typeof p.g === 'object') {
    for (const grp of GROUPS) {
      const v = (p.g as Record<string, unknown>)[String(grp.id)]
      if (typeof v === 'string' && v.trim()) groupNames[grp.id] = v.trim().slice(0, 24)
    }
  }

  return {
    mode: ultimate ? 'ultimate' : 'battle',
    bases: byIndex.filter((b): b is Base => b != null),
    links,
    groupNames,
    league: typeof p.n === 'string' && p.n.trim() ? p.n.trim().slice(0, 40) : undefined,
    solo: p.s === 1 ? true : undefined,
  }
}

// Undo/redo snapshot — everything a map edit can touch
type HistSnap = {
  basesByMode: Record<MapMode, Base[]>
  linksByMode: Record<MapMode, Link[]>
  groupNames: Record<number, string>
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
const LINKS_KEY = 'sc-gotham-links-v1'
const SOLO_KEY = 'sc-gotham-solo-v1'
const DEFAULT_GROUP_NAMES: Record<number, string> = {
  1: 'Group 1', 2: 'Group 2', 3: 'Group 3', 4: 'Group 4',
  5: 'Group 5', 6: 'Group 6', 7: 'Group 7', 8: 'Group 8',
}

export default function ShipCombatGuidesPage() {
  const [mode, setMode] = useState<MapMode>('battle')
  const [basesByMode, setBasesByMode] = useState<Record<MapMode, Base[]>>({ battle: [], ultimate: [] })
  const [selectedByMode, setSelectedByMode] = useState<Record<MapMode, string[]>>({ battle: [], ultimate: [] })
  const [league, setLeague] = useState('')
  const [groupNames, setGroupNames] = useState<Record<number, string>>(DEFAULT_GROUP_NAMES)
  const [linksByMode, setLinksByMode] = useState<Record<MapMode, Link[]>>({ battle: [], ultimate: [] })
  const [soloLabels, setSoloLabels] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareCode, setShareCode] = useState<string | null>(null)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const [loadDraft, setLoadDraft] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadBusy, setLoadBusy] = useState(false)
  const [pendingShare, setPendingShare] = useState<DecodedShare | 'error' | null>(null)
  const [confirmCopy, setConfirmCopy] = useState(false)
  const [histSizes, setHistSizes] = useState({ undo: 0, redo: 0 })
  const copiedTimer = useRef<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const firstPersist = useRef(true)
  const firstLeaguePersist = useRef(true)
  const firstGroupPersist = useRef(true)
  const firstLinksPersist = useRef(true)
  const firstSoloPersist = useRef(true)

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
      const savedLinks = localStorage.getItem(LINKS_KEY)
      if (savedLinks) {
        const parsed = JSON.parse(savedLinks)
        if (parsed && Array.isArray(parsed.battle) && Array.isArray(parsed.ultimate)) setLinksByMode(parsed)
      }
      const savedSolo = localStorage.getItem(SOLO_KEY)
      if (savedSolo === '1') setSoloLabels(true)
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

  useEffect(() => {
    if (firstLinksPersist.current) { firstLinksPersist.current = false; return }
    try { localStorage.setItem(LINKS_KEY, JSON.stringify(linksByMode)) } catch {}
  }, [linksByMode])

  useEffect(() => {
    if (firstSoloPersist.current) { firstSoloPersist.current = false; return }
    try { localStorage.setItem(SOLO_KEY, soloLabels ? '1' : '0') } catch {}
  }, [soloLabels])

  const bases = basesByMode[mode]
  const selectedIds = selectedByMode[mode]
  const links = linksByMode[mode]

  // ─── Undo / redo ───
  // Snapshots are pushed lazily before a change; rapid-fire updates (drag
  // frames) within 600ms coalesce into a single history entry.
  const histRef = useRef<{ past: HistSnap[]; future: HistSnap[]; last: number }>({ past: [], future: [], last: 0 })
  const presentRef = useRef<HistSnap>({ basesByMode, linksByMode, groupNames })
  useEffect(() => { presentRef.current = { basesByMode, linksByMode, groupNames } })

  const recordChange = useCallback(() => {
    const h = histRef.current
    const now = Date.now()
    if (now - h.last > 600) {
      h.past.push(structuredClone(presentRef.current))
      if (h.past.length > 50) h.past.shift()
      h.future = []
      setHistSizes({ undo: h.past.length, redo: 0 })
    }
    h.last = now
  }, [])

  const undo = useCallback(() => {
    const h = histRef.current
    const prev = h.past.pop()
    if (!prev) return
    h.future.push(structuredClone(presentRef.current))
    h.last = 0
    setBasesByMode(prev.basesByMode)
    setLinksByMode(prev.linksByMode)
    setGroupNames(prev.groupNames)
    setSelectedByMode({ battle: [], ultimate: [] })
    setHistSizes({ undo: h.past.length, redo: h.future.length })
  }, [])

  const redo = useCallback(() => {
    const h = histRef.current
    const next = h.future.pop()
    if (!next) return
    h.past.push(structuredClone(presentRef.current))
    h.last = 0
    setBasesByMode(next.basesByMode)
    setLinksByMode(next.linksByMode)
    setGroupNames(next.groupNames)
    setSelectedByMode({ battle: [], ultimate: [] })
    setHistSizes({ undo: h.past.length, redo: h.future.length })
  }, [])

  const setBases = useCallback((updater: (prev: Base[]) => Base[]) => {
    recordChange()
    setBasesByMode(prev => ({ ...prev, [mode]: updater(prev[mode]) }))
  }, [mode, recordChange])

  const setSelectedIds = useCallback((next: string[]) => {
    setSelectedByMode(prev => ({ ...prev, [mode]: next }))
  }, [mode])

  const setLinks = useCallback((updater: (prev: Link[]) => Link[]) => {
    recordChange()
    setLinksByMode(prev => ({ ...prev, [mode]: updater(prev[mode]) }))
  }, [mode, recordChange])

  const addBase = useCallback(() => {
    recordChange()
    setBasesByMode(prev => {
      const current = prev[mode]
      const spot = findFreeSpot(current)
      const id = `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
      const nb: Base = { id, name: nextPlayerName(current), group: 1, x: spot.x, y: spot.y }
      setSelectedByMode(s => ({ ...s, [mode]: [id] }))
      return { ...prev, [mode]: [...current, nb] }
    })
  }, [mode, recordChange])

  const removeBase = useCallback((id: string) => {
    recordChange()
    setBasesByMode(prev => ({ ...prev, [mode]: prev[mode].filter(b => b.id !== id) }))
    setSelectedByMode(prev => ({ ...prev, [mode]: prev[mode].filter(x => x !== id) }))
    setLinksByMode(prev => ({ ...prev, [mode]: prev[mode].filter(l => !(l.kind === 'base' && l.baseId === id)) }))
  }, [mode, recordChange])

  const resetMap = useCallback(() => {
    recordChange()
    setBasesByMode(prev => ({ ...prev, [mode]: [] }))
    setSelectedByMode(prev => ({ ...prev, [mode]: [] }))
    setLinksByMode(prev => ({ ...prev, [mode]: [] }))
    setConfirmReset(false)
  }, [mode, recordChange])

  const setGroupName = useCallback((id: number, name: string) => {
    recordChange()
    setGroupNames(prev => ({ ...prev, [id]: name }))
  }, [recordChange])

  // ─── Copy layout to the other map ───
  const otherMode: MapMode = mode === 'battle' ? 'ultimate' : 'battle'
  const doCopyToOther = useCallback(() => {
    recordChange()
    const srcBases = structuredClone(basesByMode[mode])
    // Ultimate-only armory links can't exist on the battle map
    const srcLinks = structuredClone(linksByMode[mode].filter(l =>
      otherMode === 'ultimate' || l.building === 'city' || !ARMORIES[l.building].ultimateOnly
    ))
    setBasesByMode(prev => ({ ...prev, [otherMode]: srcBases }))
    setLinksByMode(prev => ({ ...prev, [otherMode]: srcLinks }))
    setSelectedByMode(prev => ({ ...prev, [otherMode]: [] }))
    setMode(otherMode)
    setConfirmCopy(false)
  }, [mode, otherMode, basesByMode, linksByMode, recordChange])

  const requestCopyToOther = useCallback(() => {
    if (basesByMode[otherMode].length > 0) setConfirmCopy(true)
    else doCopyToOther()
  }, [basesByMode, otherMode, doCopyToOther])

  // ─── Share codes ───
  const applyShared = useCallback((d: DecodedShare) => {
    recordChange()
    setMode(d.mode)
    setBasesByMode(prev => ({ ...prev, [d.mode]: d.bases }))
    setLinksByMode(prev => ({ ...prev, [d.mode]: d.links }))
    setSelectedByMode(prev => ({ ...prev, [d.mode]: [] }))
    if (Object.keys(d.groupNames).length > 0) setGroupNames(prev => ({ ...prev, ...d.groupNames }))
    if (d.league) setLeague(d.league)
    if (d.solo) setSoloLabels(true)
  }, [recordChange])

  const openShare = useCallback(() => {
    setShareOpen(true)
    setShareCode(null)
    setCopied(null)
    setLoadError(null)
    if (basesByMode[mode].length > 0) {
      encodeShare(mode, basesByMode[mode], linksByMode[mode], groupNames, league, soloLabels)
        .then(setShareCode)
        .catch(() => {})
    }
  }, [mode, basesByMode, linksByMode, groupNames, league, soloLabels])

  const copyToClipboard = useCallback((text: string, which: 'code' | 'link') => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(which)
      if (copiedTimer.current != null) clearTimeout(copiedTimer.current)
      copiedTimer.current = window.setTimeout(() => setCopied(null), 1600)
    }).catch(() => {})
  }, [])

  const handleLoadCode = useCallback(async () => {
    setLoadBusy(true)
    setLoadError(null)
    try {
      const d = await decodeShare(loadDraft)
      applyShared(d)
      setShareOpen(false)
      setLoadDraft('')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load that code.')
    } finally {
      setLoadBusy(false)
    }
  }, [loadDraft, applyShared])

  const dismissPending = useCallback(() => {
    setPendingShare(null)
    try { window.history.replaceState(null, '', window.location.pathname) } catch {}
  }, [])

  // A ?layout= param means someone followed a share link — confirm before loading
  useEffect(() => {
    try {
      const code = new URLSearchParams(window.location.search).get('layout')
      if (!code) return
      decodeShare(code).then(d => setPendingShare(d)).catch(() => setPendingShare('error'))
    } catch {}
  }, [])

  // Ctrl+Z / Ctrl+Y (or Ctrl+Shift+Z) — skipped while typing in a field
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

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
      recordChange()
      setBasesByMode(prev => ({ ...prev, [mode]: imported }))
      setSelectedByMode(prev => ({ ...prev, [mode]: [] }))
      setLinksByMode(prev => ({ ...prev, [mode]: [] }))
      setImportOpen(false)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }, [mode, recordChange])

  // Escape: close whichever modal is open, otherwise clear the selection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (helpOpen) setHelpOpen(false)
      else if (shareOpen) setShareOpen(false)
      else if (pendingShare) dismissPending()
      else if (importOpen) setImportOpen(false)
      else if (confirmReset) setConfirmReset(false)
      else if (confirmCopy) setConfirmCopy(false)
      else setSelectedByMode(prev => ({ ...prev, [mode]: [] }))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [helpOpen, shareOpen, pendingShare, importOpen, confirmReset, confirmCopy, mode, dismissPending])

  const handleExport = useCallback(async () => {
    setExporting(true)
    try {
      await exportConfig(mode === 'ultimate', basesByMode[mode], league, groupNames, linksByMode[mode], soloLabels)
    } catch (e) {
      console.error('Export failed', e)
      alert('Export failed — please try again.')
    } finally {
      setExporting(false)
    }
  }, [mode, basesByMode, league, groupNames, linksByMode, soloLabels])

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

          {/* Mode switcher + instructions */}
          <div className="sc-topbar">
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
            <button className="sc-instr-btn" onClick={() => setHelpOpen(true)}>
              <span className="sc-instr-icon">?</span> Instructions
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
              links={links}
              soloLabels={soloLabels}
              onRemoveBase={removeBase}
            />
            <RosterPanel
              ultimate={mode === 'ultimate'}
              bases={bases}
              setBases={setBases}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              league={league}
              setLeague={setLeague}
              groupNames={groupNames}
              setGroupName={setGroupName}
              links={links}
              setLinks={setLinks}
              soloLabels={soloLabels}
              setSoloLabels={setSoloLabels}
              onAdd={addBase}
              onImport={openImport}
              onExport={handleExport}
              onReset={() => setConfirmReset(true)}
              onRemove={removeBase}
              onShare={openShare}
              onCopyMode={requestCopyToOther}
              onUndo={undo}
              onRedo={redo}
              canUndo={histSizes.undo > 0}
              canRedo={histSizes.redo > 0}
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

      {helpOpen && (
        <div className="sc-modal-backdrop" onClick={() => setHelpOpen(false)}>
          <div className="sc-modal sc-modal-info sc-modal-help" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="sc-help-head">
              <div className="sc-modal-title">How To Use The Planner</div>
              <button className="sc-help-close" title="Close" onClick={() => setHelpOpen(false)}>✕</button>
            </div>

            <div className="sc-help-sec">
              <div className="sc-help-h">The Basics</div>
              <ul className="sc-help-list">
                <li>There are two maps — <strong>Battle For Gotham</strong> and <strong>Ultimate Battle For Gotham</strong> (which adds Armories 5 &amp; 6). Switch between them with the tabs up top; each map keeps its own layout.</li>
                <li>Everything you place is saved automatically in this browser, so you can leave and pick up where you left off.</li>
              </ul>
            </div>

            <div className="sc-help-sec">
              <div className="sc-help-h">Map Controls</div>
              <ul className="sc-help-list">
                <li><strong>Zoom</strong> with the scroll wheel, a two-finger pinch, or the + / − buttons. The ⤢ button resets the view.</li>
                <li><strong>Pan</strong> by dragging any empty part of the map.</li>
                <li><strong>Select</strong> a base by tapping it. Tap empty space (or press Esc) to deselect.</li>
                <li><strong>Right-click</strong> a base (or press-and-hold on touch) for a quick menu — rename, change group, or delete without leaving the map.</li>
              </ul>
            </div>

            <div className="sc-help-sec">
              <div className="sc-help-h">Adding Your League</div>
              <ul className="sc-help-list">
                <li><strong>+ Add Base</strong> adds bases one at a time (up to 100), auto-placed near City Hall.</li>
                <li><strong>Import</strong> uploads a .csv or .xlsx with player names in Column A (rows 1–100) and fills the map automatically — it replaces whatever is currently placed.</li>
                <li><strong>Drag</strong> any base to move it. Bases snap to the grid and can never sit on restricted zones, buildings, or other bases.</li>
              </ul>
            </div>

            <div className="sc-help-sec">
              <div className="sc-help-h">Groups &amp; Names</div>
              <ul className="sc-help-list">
                <li>Click a player&apos;s name in the roster to rename them; click the color swatches on their row to move them between the 8 groups.</li>
                <li>Click a group&apos;s name to rename it. Group names are shared across both maps.</li>
              </ul>
            </div>

            <div className="sc-help-sec">
              <div className="sc-help-h">Multi-Select &amp; Moving Together</div>
              <ul className="sc-help-list">
                <li>Use the roster checkboxes to select several bases at once — a group&apos;s header checkbox selects the whole group.</li>
                <li>Drag any selected base and the <strong>entire selection moves as one</strong>, keeping its spacing. The move is blocked if anyone would land somewhere invalid.</li>
                <li>On-map labels follow your selection: one base shows its name and range rings, a full group shows the group name, 2–5 bases show name callouts, and bigger selections just highlight.</li>
              </ul>
            </div>

            <div className="sc-help-sec">
              <div className="sc-help-h">Building Links</div>
              <ul className="sc-help-list">
                <li>Select a single base or a whole group, then use <strong>Building Links</strong> to tie it to City Hall or any Armory — a white line is drawn on the map for each linked base.</li>
                <li>A target can be tied to several buildings at once. Click a highlighted building to unlink it, or remove links from the list below the buttons.</li>
              </ul>
            </div>

            <div className="sc-help-sec">
              <div className="sc-help-h">Solo Group Labels (Ultimate Only)</div>
              <ul className="sc-help-list">
                <li>Turn on <strong>Label solo groups by group name</strong> to permanently show the group name beside any group with exactly one base. Labels stack toward the left or right edge — whichever side the base is on — so they stay off the board.</li>
                <li>The purpose of this functionality is so that you can create a graphic to show the top 8 leagues where their teams should place their bases (the general area) and what buildings they should go after.</li>
              </ul>
            </div>

            <div className="sc-help-sec">
              <div className="sc-help-h">Sharing, Copying &amp; Undo</div>
              <ul className="sc-help-list">
                <li><strong>Share</strong> generates a layout code and link for the current map. Anyone can paste the code (or open the link) to load your exact layout — bases, groups, links, and all.</li>
                <li><strong>To Ultimate / To Battle</strong> copies the current map&apos;s layout onto the other map, so you don&apos;t have to rebuild it twice.</li>
                <li><strong>Undo / Redo</strong> steps back through your last 50 changes — moves, deletes, imports, even a reset. Ctrl+Z and Ctrl+Y (or Ctrl+Shift+Z) work too.</li>
              </ul>
            </div>

            <div className="sc-help-sec">
              <div className="sc-help-h">Export &amp; Reset</div>
              <ul className="sc-help-list">
                <li><strong>Export</strong> downloads a shareable PNG of the current map with a legend and your full roster. Set a <strong>League Name</strong> to brand it.</li>
                <li>Building links and solo-group labels are drawn on the exported image exactly as they appear on screen — perfect for posting a deployment graphic to your league.</li>
                <li><strong>Reset Map</strong> clears every base on the current map only (it asks for confirmation first).</li>
              </ul>
            </div>

            <div className="sc-modal-actions">
              <button className="sc-btn" onClick={() => setHelpOpen(false)}>Got It</button>
            </div>
          </div>
        </div>
      )}

      {shareOpen && (
        <div className="sc-modal-backdrop" onClick={() => setShareOpen(false)}>
          <div className="sc-modal sc-modal-info" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="sc-modal-title">Share Layout</div>
            {bases.length > 0 ? (
              <>
                <p className="sc-modal-text" style={{ marginBottom: '0.7rem' }}>
                  Send this code or link to your league — loading it replaces the recipient&apos;s{' '}
                  <strong style={{ color: '#fff' }}>{mode === 'ultimate' ? 'Ultimate Battle For Gotham' : 'Battle For Gotham'}</strong> map.
                </p>
                <textarea
                  className="sc-share-code"
                  readOnly
                  value={shareCode ?? 'Generating code…'}
                  onFocus={e => e.currentTarget.select()}
                />
                <div className="sc-modal-actions" style={{ marginBottom: '0.4rem' }}>
                  <button className="sc-btn" disabled={!shareCode} onClick={() => shareCode && copyToClipboard(shareCode, 'code')}>
                    {copied === 'code' ? '✓ Copied' : 'Copy Code'}
                  </button>
                  <button
                    className="sc-btn"
                    disabled={!shareCode}
                    onClick={() => shareCode && copyToClipboard(`${window.location.origin}${window.location.pathname}?layout=${shareCode}`, 'link')}
                  >
                    {copied === 'link' ? '✓ Copied' : 'Copy Link'}
                  </button>
                </div>
              </>
            ) : (
              <p className="sc-modal-text" style={{ marginBottom: '0.4rem' }}>
                Place some bases on this map first to generate a share code.
              </p>
            )}
            <div className="sc-share-divider">Load a shared layout</div>
            {loadError && <p className="sc-modal-error">{loadError}</p>}
            <textarea
              className="sc-share-code"
              placeholder="Paste a layout code (or share link) here…"
              value={loadDraft}
              onChange={e => { setLoadDraft(e.target.value); setLoadError(null) }}
            />
            <div className="sc-modal-actions">
              <button className="sc-btn sc-btn-ghost" onClick={() => setShareOpen(false)}>Close</button>
              <button className="sc-btn" disabled={!loadDraft.trim() || loadBusy} onClick={handleLoadCode}>
                {loadBusy ? 'Loading…' : 'Load Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingShare && (
        <div className="sc-modal-backdrop" onClick={dismissPending}>
          <div className="sc-modal sc-modal-info" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            {pendingShare === 'error' ? (
              <>
                <div className="sc-modal-title">Invalid Layout Link</div>
                <p className="sc-modal-text">This link&apos;s layout code couldn&apos;t be read — it may be incomplete or from a newer version of the tool.</p>
                <div className="sc-modal-actions">
                  <button className="sc-btn" onClick={dismissPending}>OK</button>
                </div>
              </>
            ) : (
              <>
                <div className="sc-modal-title">Load Shared Layout?</div>
                <p className="sc-modal-text">
                  This link contains a <strong style={{ color: '#fff' }}>{pendingShare.bases.length}-base</strong> layout for{' '}
                  <strong style={{ color: '#fff' }}>{pendingShare.mode === 'ultimate' ? 'Ultimate Battle For Gotham' : 'Battle For Gotham'}</strong>.
                  Loading it replaces your current layout on that map (you can undo).
                </p>
                <div className="sc-modal-actions">
                  <button className="sc-btn sc-btn-ghost" onClick={dismissPending}>Cancel</button>
                  <button className="sc-btn" onClick={() => { applyShared(pendingShare); dismissPending() }}>Load Layout</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {confirmCopy && (
        <div className="sc-modal-backdrop" onClick={() => setConfirmCopy(false)}>
          <div className="sc-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="sc-modal-title">Overwrite {otherMode === 'ultimate' ? 'Ultimate' : 'Battle'} Map?</div>
            <p className="sc-modal-text">
              The <strong style={{ color: '#fff' }}>{otherMode === 'ultimate' ? 'Ultimate Battle For Gotham' : 'Battle For Gotham'}</strong> map
              already has {basesByMode[otherMode].length} base{basesByMode[otherMode].length === 1 ? '' : 's'}. Copying replaces that
              layout with this one (you can undo).
            </p>
            <div className="sc-modal-actions">
              <button className="sc-btn sc-btn-ghost" onClick={() => setConfirmCopy(false)}>Cancel</button>
              <button className="sc-btn" onClick={doCopyToOther}>Copy Layout</button>
            </div>
          </div>
        </div>
      )}

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
