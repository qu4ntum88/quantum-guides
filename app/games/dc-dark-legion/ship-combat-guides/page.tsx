'use client'
import { useState, useRef } from 'react'
import type { CSSProperties } from 'react'

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

function GameMap({ ultimate }: { ultimate: boolean }) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: ISO_ORIGIN, y: ISO_ORIGIN })
  const [basePos, setBasePos] = useState({ x: 36, y: 196 })
  const [isDragging, setIsDragging] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ sm: { x: number; y: number }; sp: { x: number; y: number } } | null>(null)
  const didDragRef = useRef(false)

  const viewSize = ISO_SIZE / zoom

  const handleZoomChange = (newZoom: number) => {
    const newViewSize = ISO_SIZE / newZoom
    const centerX = pan.x + viewSize / 2
    const centerY = pan.y + viewSize / 2
    setPan(clampPan(centerX - newViewSize / 2, centerY - newViewSize / 2, newViewSize))
    setZoom(newZoom)
  }

  const startDrag = (mx: number, my: number) => {
    dragRef.current = { sm: { x: mx, y: my }, sp: { ...pan } }
    didDragRef.current = false
    setIsDragging(true)
  }

  const moveDrag = (mx: number, my: number) => {
    if (!dragRef.current || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const scale = viewSize / rect.width
    const dx = (mx - dragRef.current.sm.x) * scale
    const dy = (my - dragRef.current.sm.y) * scale
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) didDragRef.current = true
    setPan(clampPan(dragRef.current.sp.x - dx, dragRef.current.sp.y - dy, viewSize))
  }

  const endDrag = () => {
    dragRef.current = null
    setIsDragging(false)
  }

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (didDragRef.current || !svgRef.current) return
    const pt = svgRef.current.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgPt = pt.matrixTransform(svgRef.current.getScreenCTM()!.inverse())
    // Un-rotate from diamond space back to map space, then snap to tile grid
    const mapPt = rotatePoint(svgPt.x, svgPt.y, 128, 128, -45)
    const snappedX = Math.floor(mapPt.x / TILE) * TILE
    const snappedY = Math.floor(mapPt.y / TILE) * TILE
    if (isInBuildable(snappedX, snappedY)) {
      setBasePos({ x: snappedX, y: snappedY })
    }
  }

  const activeArmories = ultimate ? ARMORIES : ARMORIES.filter(a => !a.ultimateOnly)
  const pfx = ultimate ? 'u' : 'b'

  const diamondPoints = `128,${ISO_ORIGIN} ${ISO_ORIGIN + ISO_SIZE},128 128,${ISO_ORIGIN + ISO_SIZE} ${ISO_ORIGIN},128`

  // Pre-compute SVG root positions for buildings
  const chPos  = toSvg(CITY_HALL.x, CITY_HALL.y)
  const baseCenter = toSvg(basePos.x + BASE_SIZE / 2, basePos.y + BASE_SIZE / 2)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <span style={{
          color: '#777', fontSize: '0.68rem', fontFamily: 'Unbounded, sans-serif',
          textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0,
        }}>
          Zoom
        </span>
        <input
          type="range" min="1" max="8" step="0.5"
          value={zoom}
          onChange={e => handleZoomChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#c9a01e', cursor: 'pointer' }}
        />
        <span style={{ color: 'var(--gold)', fontSize: '0.78rem', fontFamily: 'monospace', minWidth: '2.5rem', textAlign: 'right' }}>
          {zoom % 1 === 0 ? `${zoom}×` : `${zoom.toFixed(1)}×`}
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`${pan.x} ${pan.y} ${viewSize} ${viewSize}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%', display: 'block',
          cursor: isDragging ? 'grabbing' : 'pointer',
          userSelect: 'none',
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        }}
        onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY) }}
        onMouseMove={e => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onClick={handleClick}
        onTouchStart={e => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={e => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={endDrag}
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
          {(() => {
            const half = CITY_HALL.size / 2
            return (
              <rect x={CITY_HALL.x - half} y={CITY_HALL.y - half}
                width={CITY_HALL.size} height={CITY_HALL.size}
                fill="#92680c" fillOpacity="0.4" />
            )
          })()}

          {/* Plaza footprints */}
          {PLAZA.map((p) => {
            const half = p.size / 2
            return (
              <g key={p.dir}>
                <rect x={p.x - half} y={p.y - half} width={p.size} height={p.size}
                  fill="#5b21b6" fillOpacity="0.6" />
              </g>
            )
          })}

          {/* Armory footprints */}
          {activeArmories.map((a, i) => {
            const half = a.size / 2
            return (
              <g key={i}>
                <rect x={a.x - half} y={a.y - half} width={a.size} height={a.size}
                  fill={a.ultimateOnly ? '#9f1239' : '#c2410c'} fillOpacity="0.4" />
                {a.ultimateOnly && (
                  <rect x={a.x - half} y={a.y - half} width={a.size} height={a.size}
                    fill="none" stroke="#f87171" strokeWidth="0.5" />
                )}
              </g>
            )
          })}

          {/* Player Base footprint */}
          <rect x={basePos.x} y={basePos.y} width={BASE_SIZE} height={BASE_SIZE}
            fill="#1e293b" fillOpacity="0.8" />

        </g>{/* end rotation group */}

        {/* ── LAYER 2: upright building images, placed at rotated map coords ── */}

        {/* City Hall image — no border */}
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

        {/* Player Base image + range indicator + label */}
        <g>
          <circle
            cx={baseCenter.x}
            cy={baseCenter.y}
            r="7"
            fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" strokeDasharray="1.5,1.5"
          />
          <image
            href="/dcdl/resource_icons/Gotham_PlayerBase.png"
            x={baseCenter.x - BASE_SIZE / 2}
            y={baseCenter.y - BASE_SIZE / 2}
            width={BASE_SIZE}
            height={BASE_SIZE}
            preserveAspectRatio="xMidYMid meet"
          />
          <line
            x1={baseCenter.x}
            y1={baseCenter.y - BASE_SIZE / 2 - 5}
            x2={baseCenter.x}
            y2={baseCenter.y - BASE_SIZE / 2}
            stroke="rgba(255,255,255,0.35)" strokeWidth="0.3"
          />
          <text
            x={baseCenter.x + 2.5}
            y={baseCenter.y - BASE_SIZE / 2 - 5.5}
            fill="rgba(255,255,255,0.55)" fontSize="5" fontFamily="monospace"
          >
            Player Base
          </text>
        </g>

        {/* Diamond border */}
        <polygon
          points={diamondPoints}
          fill="none" stroke="#2a2a6a" strokeWidth="1"
        />
      </svg>

      <p style={{ color: '#666', fontSize: '0.72rem', marginTop: '0.4rem', fontFamily: 'monospace' }}>
        Click the green zone to move your Player Base
      </p>
    </div>
  )
}

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

export default function ShipCombatGuidesPage() {
  return (
    <main>
      <section
        style={{
          backgroundImage: "url('/images/site/Quantum Purple Background.png')",
          backgroundSize: 'cover', backgroundPosition: 'center', padding: '3rem 0',
        }}
      >
        <div className="container">
          <h1>Ship Combat Guides</h1>
          <p style={{ color: '#cccccc' }}>Map breakdowns for Battle For Gotham and Ultimate Battle For Gotham</p>
        </div>
      </section>

      <section style={{ padding: '2rem 0' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          <div className="card">
            <div style={secTitle}>Battle For Gotham</div>
            <GameMap ultimate={false} />
          </div>

          <div className="card">
            <div style={secTitle}>Ultimate Battle For Gotham</div>
            <GameMap ultimate={true} />
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
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>Player Base (click green zone to place)</span>
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
    </main>
  )
}
