'use client'
import { useState } from 'react'
import type { CSSProperties } from 'react'

// ── Map data ────────────────────────────────────────────────────────────────
// Coordinates in meters on a 256m × 256m map (each tile = 2m × 2m)
// City Hall:   9 tiles = 3×3 tile footprint = 6m × 6m
// Plaza:       4 tiles = 2×2 tile footprint = 4m × 4m
// Armory:      4 tiles = 2×2 tile footprint = 4m × 4m
// Player Base: 1 tile  = 1×1 tile footprint = 2m × 2m

const CITY_HALL = { x: 128, y: 128, size: 6 } // 3×3 tiles

const PLAZA = [
  { x: 68,  y: 128, dir: 'West',      size: 4 },
  { x: 98,  y: 98,  dir: 'Northwest', size: 4 },
  { x: 128, y: 68,  dir: 'North',     size: 4 },
  { x: 158, y: 98,  dir: 'Northeast', size: 4 },
  { x: 188, y: 128, dir: 'East',      size: 4 },
  { x: 158, y: 158, dir: 'Southeast', size: 4 },
  { x: 128, y: 188, dir: 'South',     size: 4 },
  { x: 98,  y: 158, dir: 'Southwest', size: 4 },
]

const ARMORIES = [
  { x: 100, y: 122, size: 4, ultimateOnly: false },
  { x: 122, y: 98,  size: 4, ultimateOnly: false },
  { x: 135, y: 156, size: 4, ultimateOnly: false },
  { x: 157, y: 135, size: 4, ultimateOnly: false },
  { x: 108, y: 147, size: 4, ultimateOnly: true  },
  { x: 147, y: 108, size: 4, ultimateOnly: true  },
]

// Sample player base near bottom-left corner of the map
const SAMPLE_BASE = { x: 16, y: 232, size: 2 } // 1×1 tile

// Approximate boundary radius (in meters) beyond which player bases can be placed
const PLAYER_ZONE_RADIUS = 40

// ── SVG Map Component ────────────────────────────────────────────────────────

function GameMap({ ultimate }: { ultimate: boolean }) {
  const [zoom, setZoom] = useState(1)

  // Zoom by narrowing the viewBox around the map center
  const viewSize = 256 / zoom
  const viewX    = CITY_HALL.x - viewSize / 2
  const viewY    = CITY_HALL.y - viewSize / 2

  const activeArmories = ultimate ? ARMORIES : ARMORIES.filter(a => !a.ultimateOnly)

  // Unique IDs per map instance to avoid SVG ID collisions
  const pfx = ultimate ? 'u' : 'b'

  return (
    <div>
      {/* Zoom slider */}
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
          onChange={e => setZoom(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#c9a01e', cursor: 'pointer' }}
        />
        <span style={{ color: 'var(--gold)', fontSize: '0.78rem', fontFamily: 'monospace', minWidth: '2.5rem', textAlign: 'right' }}>
          {zoom % 1 === 0 ? `${zoom}×` : `${zoom.toFixed(1)}×`}
        </span>
      </div>

      <svg
        viewBox={`${viewX} ${viewY} ${viewSize} ${viewSize}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', display: 'block', borderRadius: '0.5rem' }}
      >
        <defs>
          {/* Player zone mask: full map minus inner circle */}
          <mask id={`pzm${pfx}`}>
            <rect width="256" height="256" fill="white" />
            <circle cx="128" cy="128" r={PLAYER_ZONE_RADIUS} fill="black" />
          </mask>

          {/* Gold glow for City Hall */}
          <filter id={`glow${pfx}`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Fine grid: every tile (2m) */}
          <pattern id={`tile${pfx}`} x="0" y="0" width="2" height="2" patternUnits="userSpaceOnUse">
            <path d="M 2 0 L 0 0 0 2" fill="none" stroke="#16163c" strokeWidth="0.2" />
          </pattern>

          {/* Coarse grid: every 8 tiles (16m) */}
          <pattern id={`chunk${pfx}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#21215a" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* ── Background ── */}
        <rect width="256" height="256" fill="#09090f" />

        {/* ── Grid: tile-level then chunk-level ── */}
        <rect width="256" height="256" fill={`url(#tile${pfx})`} />
        <rect width="256" height="256" fill={`url(#chunk${pfx})`} />

        {/* ── Player base zone (green tint outside armory ring) ── */}
        <rect width="256" height="256" fill="rgba(34,197,94,0.07)" mask={`url(#pzm${pfx})`} />

        {/* ── Armory ring boundary ── */}
        <circle cx="128" cy="128" r={PLAYER_ZONE_RADIUS}
          fill="rgba(220,38,38,0.05)"
          stroke="rgba(220,38,38,0.25)" strokeWidth="0.5" strokeDasharray="3,2"
        />

        {/* ── Gotham Plaza (purple, 4 tiles = 4×4m) ── */}
        {PLAZA.map((p) => {
          const half = p.size / 2
          return (
            <g key={p.dir}>
              <rect x={p.x - half} y={p.y - half} width={p.size} height={p.size}
                fill="#5b21b6" fillOpacity="0.85" stroke="#8b5cf6" strokeWidth="0.5" />
              <circle cx={p.x} cy={p.y} r="0.8" fill="#c4b5fd" />
            </g>
          )
        })}

        {/* ── Armories (image, 4 tiles = 4×4m) ── */}
        {activeArmories.map((a, i) => {
          const half = a.size / 2
          return (
            <g key={i}>
              {/* Fallback bg */}
              <rect x={a.x - half} y={a.y - half} width={a.size} height={a.size}
                fill={a.ultimateOnly ? '#9f1239' : '#c2410c'} fillOpacity="0.45" />
              <image
                href="/dcdl/resource_icons/Gotham_Armory.png"
                x={a.x - half} y={a.y - half} width={a.size} height={a.size}
                preserveAspectRatio="xMidYMid meet"
              />
              {/* Extra border to distinguish Ultimate-only armories */}
              {a.ultimateOnly && (
                <rect x={a.x - half} y={a.y - half} width={a.size} height={a.size}
                  fill="none" stroke="#f87171" strokeWidth="0.5" />
              )}
            </g>
          )
        })}

        {/* ── Gotham City Hall (image, 9 tiles = 6×6m) ── */}
        {(() => {
          const half = CITY_HALL.size / 2
          return (
            <g>
              <g filter={`url(#glow${pfx})`}>
                {/* Fallback bg */}
                <rect x={CITY_HALL.x - half} y={CITY_HALL.y - half}
                  width={CITY_HALL.size} height={CITY_HALL.size}
                  fill="#92680c" fillOpacity="0.55" />
                <image
                  href="/dcdl/resource_icons/Gotham_CityHall.png"
                  x={CITY_HALL.x - half} y={CITY_HALL.y - half}
                  width={CITY_HALL.size} height={CITY_HALL.size}
                  preserveAspectRatio="xMidYMid meet"
                />
              </g>
              {/* Gold border */}
              <rect x={CITY_HALL.x - half} y={CITY_HALL.y - half}
                width={CITY_HALL.size} height={CITY_HALL.size}
                fill="none" stroke="#c9a01e" strokeWidth="0.75" />
            </g>
          )
        })()}

        {/* ── Sample player base (image, 1 tile = 2×2m) ── */}
        <g>
          {/* Highlight ring */}
          <circle
            cx={SAMPLE_BASE.x + SAMPLE_BASE.size / 2}
            cy={SAMPLE_BASE.y + SAMPLE_BASE.size / 2}
            r="5"
            fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" strokeDasharray="1.5,1.5"
          />
          {/* Fallback bg */}
          <rect x={SAMPLE_BASE.x} y={SAMPLE_BASE.y}
            width={SAMPLE_BASE.size} height={SAMPLE_BASE.size}
            fill="#1e293b" />
          <image
            href="/dcdl/resource_icons/Gotham_PlayerBase.png"
            x={SAMPLE_BASE.x} y={SAMPLE_BASE.y}
            width={SAMPLE_BASE.size} height={SAMPLE_BASE.size}
            preserveAspectRatio="xMidYMid meet"
          />
          {/* Pointer + label */}
          <line
            x1={SAMPLE_BASE.x + 1} y1={SAMPLE_BASE.y - 5}
            x2={SAMPLE_BASE.x + 1} y2={SAMPLE_BASE.y}
            stroke="rgba(255,255,255,0.35)" strokeWidth="0.3"
          />
          <text
            x={SAMPLE_BASE.x + 3.5} y={SAMPLE_BASE.y - 5.5}
            fill="rgba(255,255,255,0.55)" fontSize="5" fontFamily="monospace"
          >
            Player Base
          </text>
        </g>

        {/* ── Map border ── */}
        <rect width="256" height="256" fill="none" stroke="#2a2a6a" strokeWidth="1" />
      </svg>
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const secTitle: CSSProperties = {
  fontFamily: 'Unbounded, sans-serif', fontSize: '0.75rem', fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)',
  borderBottom: '1px solid rgba(204,164,83,0.3)', paddingBottom: '0.5rem', marginBottom: '0.75rem',
}

// ── Legend swatch helper ──────────────────────────────────────────────────────

function Swatch({ children }: { children: React.ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
      {children}
    </svg>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

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

          {/* Maps */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div className="card" style={{ flex: '1 1 300px' }}>
              <div style={secTitle}>Battle For Gotham</div>
              <GameMap ultimate={false} />
            </div>
            <div className="card" style={{ flex: '1 1 300px' }}>
              <div style={secTitle}>Ultimate Battle For Gotham</div>
              <GameMap ultimate={true} />
            </div>
          </div>

          {/* Legend */}
          <div className="card">
            <div style={secTitle}>Map Legend</div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Swatch>
                  <rect x="1" y="1" width="14" height="14" fill="#92680c" stroke="#c9a01e" strokeWidth="1.5" />
                  <line x1="4" y1="8" x2="12" y2="8" stroke="#f0c040" strokeWidth="1.2" />
                  <line x1="8" y1="4" x2="8" y2="12" stroke="#f0c040" strokeWidth="1.2" />
                </Swatch>
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>Gotham City Hall</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Swatch>
                  <rect x="2" y="2" width="12" height="12" fill="#5b21b6" stroke="#8b5cf6" strokeWidth="1.2" />
                  <circle cx="8" cy="8" r="2.5" fill="#c4b5fd" />
                </Swatch>
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>Gotham Plaza (×8)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Swatch>
                  <rect x="2" y="2" width="12" height="12" fill="#c2410c" stroke="#fb923c" strokeWidth="1.2" />
                  <circle cx="8" cy="8" r="2.5" fill="#fed7aa" />
                </Swatch>
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>Armory (both modes)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Swatch>
                  <rect x="2" y="2" width="12" height="12" fill="#9f1239" stroke="#f87171" strokeWidth="1.2" />
                  <circle cx="8" cy="8" r="2.5" fill="#fca5a5" />
                </Swatch>
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>Armory (Ultimate only)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Swatch>
                  <rect x="4" y="4" width="8" height="8" fill="white" stroke="#999" strokeWidth="1" />
                </Swatch>
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>Player Base</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Swatch>
                  <rect width="16" height="16" fill="rgba(34,197,94,0.2)" />
                  <rect width="16" height="16" fill="none" stroke="rgba(34,197,94,0.5)" strokeWidth="0.8" />
                </Swatch>
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>Player Base Zone</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Swatch>
                  <rect width="16" height="16" fill="rgba(220,38,38,0.15)" />
                  <rect width="16" height="16" fill="none" stroke="rgba(220,38,38,0.5)" strokeWidth="0.8" strokeDasharray="2,1.5" />
                </Swatch>
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>Restricted Zone (approx.)</span>
              </div>

            </div>
          </div>

        </div>
      </section>
    </main>
  )
}
