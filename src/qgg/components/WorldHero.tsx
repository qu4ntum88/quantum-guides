import { GodforgePantheon, VoidHuntersScene } from './WorldScenes'

export type World = 'godforge' | 'invokers' | 'voidhunters'

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

/**
 * The banner at the top of each game page. One shared layout; the world decides the
 * scene behind it (see src/qgg/worlds.css): Godforge's rotating pantheon, the Invokers
 * arcane circle, the Void Hunters key art with two hunters' cards. A page's own `art`
 * (a guide's cover, say) takes the place of the Godforge / Void Hunters scene.
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
        {world === 'invokers' && <ArcaneCircle />}
      </div>
      {world === 'godforge' && !art && <GodforgePantheon />}
      {world === 'voidhunters' && !art && <VoidHuntersScene />}
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
