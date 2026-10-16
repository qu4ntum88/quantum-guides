export type World = 'godforge' | 'invokers' | 'voidhunters'

/** Godforge: a temple front (pediment, eight fluted columns, three steps) in thin gold line work. */
function Temple() {
  const cols = Array.from({ length: 8 }, (_, i) => 70 + i * 52)
  return (
    <svg className="wh-art wh-art--temple" viewBox="0 0 520 300" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M40 92 L260 22 L480 92 Z" />
        <path d="M78 84 L260 34 L442 84" opacity="0.5" />
        <rect x="40" y="92" width="440" height="14" />
        <path d="M40 112 H480" opacity="0.6" />
        {Array.from({ length: 22 }, (_, i) => (
          <path key={i} d={`M${48 + i * 20} 106 v6`} opacity="0.45" />
        ))}
        {cols.map((x) => (
          <g key={x}>
            <rect x={x - 13} y="116" width="26" height="6" />
            <path d={`M${x - 10} 122 V250 M${x - 4} 122 V250 M${x + 4} 122 V250 M${x + 10} 122 V250`} opacity="0.55" />
            <rect x={x - 13} y="250" width="26" height="5" />
          </g>
        ))}
        <rect x="30" y="256" width="460" height="10" />
        <rect x="20" y="266" width="480" height="10" />
        <rect x="10" y="276" width="500" height="10" />
      </g>
    </svg>
  )
}

/** Invokers: a slow-turning arcane circle with glyphs on its ring. */
function ArcaneCircle() {
  const glyphs = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ'
  return (
    <svg className="wh-art wh-art--arcane" viewBox="0 0 400 400" aria-hidden="true">
      <g fill="none" stroke="currentColor">
        <circle cx="200" cy="200" r="190" strokeWidth="1" opacity="0.5" />
        <circle cx="200" cy="200" r="160" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="120" strokeWidth="0.8" opacity="0.6" />
        <polygon points="200,45 334,277 66,277" strokeWidth="1" opacity="0.7" />
        <polygon points="200,355 66,123 334,123" strokeWidth="1" opacity="0.7" />
      </g>
      <g fill="currentColor" fontSize="15" textAnchor="middle" opacity="0.85">
        {[...glyphs].map((g, i) => {
          const a = (i / glyphs.length) * Math.PI * 2
          return (
            <text key={i} x={200 + Math.cos(a) * 175} y={205 + Math.sin(a) * 175}>
              {g}
            </text>
          )
        })}
      </g>
    </svg>
  )
}

/** Void Hunters: a jagged volcanic ridge lit from below, with drifting ash. */
function Ridge() {
  return (
    <svg className="wh-art wh-art--ridge" viewBox="0 0 1200 220" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="wh-ember" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ff6a2b" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#7a1c14" stopOpacity="0.15" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1200" height="220" fill="url(#wh-ember)" />
      <path
        d="M0 220 L0 150 L60 138 L95 160 L150 112 L190 130 L240 84 L270 104 L330 70 L360 96 L420 120 L470 92 L520 128 L575 60 L600 28 L630 64 L690 100 L740 86 L800 122 L860 96 L910 116 L960 80 L1010 110 L1070 132 L1120 118 L1200 140 L1200 220 Z"
        fill="#080605"
      />
      <path d="M600 28 L612 46 L604 66 L618 92" fill="none" stroke="#ff7a35" strokeWidth="2" opacity="0.8" />
    </svg>
  )
}

/**
 * The banner at the top of each game page. One shared layout; the world decides the
 * line art and materials (see src/qgg/worlds.css).
 */
export default function WorldHero({
  world,
  overline,
  title,
  sub,
  note,
  art,
  children,
}: {
  world: World
  overline: string
  title: React.ReactNode
  sub?: React.ReactNode
  note?: React.ReactNode
  /** Optional character art shown on the right (transparent PNG/WebP). */
  art?: string | null
  children?: React.ReactNode
}) {
  return (
    <section className={`wh wh--${world}`}>
      <div className="wh-backdrop" aria-hidden="true">
        {world === 'godforge' && <Temple />}
        {world === 'invokers' && <ArcaneCircle />}
        {world === 'voidhunters' && <Ridge />}
      </div>
      {art && <img className="wh-figure" src={art} alt="" aria-hidden="true" />}
      <div className="container wh-inner">
        <p className="wh-overline">{overline}</p>
        <h1 className="wh-title">{title}</h1>
        {sub && <p className="wh-sub">{sub}</p>}
        {note && <p className="wh-note">{note}</p>}
        <span className="wh-rule" aria-hidden="true" />
        {children}
      </div>
    </section>
  )
}
