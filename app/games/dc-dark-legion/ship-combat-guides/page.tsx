import type { CSSProperties } from 'react'

// ── Map data ────────────────────────────────────────────────────────────────

const CITY_HALL = { x: 128, y: 128 }

const PLAZA = [
  { x: 68,  y: 128, dir: 'West'      },
  { x: 98,  y: 98,  dir: 'Northwest' },
  { x: 128, y: 68,  dir: 'North'     },
  { x: 158, y: 98,  dir: 'Northeast' },
  { x: 188, y: 128, dir: 'East'      },
  { x: 158, y: 158, dir: 'Southeast' },
  { x: 128, y: 188, dir: 'South'     },
  { x: 98,  y: 158, dir: 'Southwest' },
]

const ARMORIES = [
  { x: 100, y: 122, ultimateOnly: false },
  { x: 122, y: 98,  ultimateOnly: false },
  { x: 135, y: 156, ultimateOnly: false },
  { x: 157, y: 135, ultimateOnly: false },
  { x: 108, y: 147, ultimateOnly: true  },
  { x: 147, y: 108, ultimateOnly: true  },
]

// Sample player base placed near bottom-left corner (inside player zone)
const SAMPLE_BASE = { x: 16, y: 232 }

// ── SVG Map Component ────────────────────────────────────────────────────────

function GameMap({ ultimate }: { ultimate: boolean }) {
  const activeArmories = ultimate ? ARMORIES : ARMORIES.filter(a => !a.ultimateOnly)
  const maskId  = ultimate ? 'pzmU' : 'pzmB'
  const glowId  = ultimate ? 'glowU' : 'glowB'

  return (
    <svg
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', display: 'block', borderRadius: '0.5rem' }}
    >
      <defs>
        {/* Mask: full rect minus inner circle = player zone ring */}
        <mask id={maskId}>
          <rect width="256" height="256" fill="white" />
          <circle cx="128" cy="128" r="40" fill="black" />
        </mask>
        {/* Gold glow filter for City Hall */}
        <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Background ── */}
      <rect width="256" height="256" fill="#09090f" />

      {/* ── Grid lines every 16 m ── */}
      {Array.from({ length: 17 }, (_, i) => i * 16).map(v => (
        <g key={v}>
          <line x1={v} y1="0"   x2={v}   y2="256" stroke="#14143a" strokeWidth="0.3" />
          <line x1="0" y1={v}   x2="256" y2={v}   stroke="#14143a" strokeWidth="0.3" />
        </g>
      ))}

      {/* ── Player base zone (green tint outside armory ring) ── */}
      <rect
        width="256" height="256"
        fill="rgba(34,197,94,0.07)"
        mask={`url(#${maskId})`}
      />

      {/* ── Armory ring (red tint + dashed boundary) ── */}
      <circle cx="128" cy="128" r="40" fill="rgba(220,38,38,0.06)" />
      <circle
        cx="128" cy="128" r="40"
        fill="none" stroke="rgba(220,38,38,0.28)" strokeWidth="0.5" strokeDasharray="3,2"
      />

      {/* ── Gotham Plaza (8 capture points) ── */}
      {PLAZA.map((p) => (
        <g key={p.dir}>
          <rect
            x={p.x - 3.5} y={p.y - 3.5} width="7" height="7"
            fill="#5b21b6" fillOpacity="0.9" stroke="#8b5cf6" strokeWidth="0.5"
          />
          <circle cx={p.x} cy={p.y} r="1" fill="#c4b5fd" />
        </g>
      ))}

      {/* ── Armories ── */}
      {activeArmories.map((a, i) => (
        <g key={i}>
          <rect
            x={a.x - 3} y={a.y - 3} width="6" height="6"
            fill={a.ultimateOnly ? '#9f1239' : '#c2410c'}
            stroke={a.ultimateOnly ? '#f87171' : '#fb923c'}
            strokeWidth="0.5"
          />
          <circle cx={a.x} cy={a.y} r="0.9" fill={a.ultimateOnly ? '#fca5a5' : '#fed7aa'} />
        </g>
      ))}

      {/* ── Gotham City Hall (main objective) ── */}
      <rect
        x="121" y="121" width="14" height="14"
        fill="#92680c" stroke="#c9a01e" strokeWidth="0.75"
        filter={`url(#${glowId})`}
      />
      <line x1="124" y1="128" x2="132" y2="128" stroke="#f0c040" strokeWidth="0.6" />
      <line x1="128" y1="124" x2="128" y2="132" stroke="#f0c040" strokeWidth="0.6" />

      {/* ── Sample player base: exactly 1 tile = 2 × 2 m ── */}
      {/* Highlight ring to make it findable at a glance */}
      <circle
        cx={SAMPLE_BASE.x + 1} cy={SAMPLE_BASE.y + 1} r="6"
        fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" strokeDasharray="1.5,1.5"
      />
      <rect
        x={SAMPLE_BASE.x} y={SAMPLE_BASE.y} width="2" height="2"
        fill="white" fillOpacity="0.95" stroke="#999" strokeWidth="0.3"
      />
      {/* Pointer line + label */}
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

      {/* ── Map border ── */}
      <rect width="256" height="256" fill="none" stroke="#2a2a6a" strokeWidth="1" />
    </svg>
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
