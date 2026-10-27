import Link from 'next/link'
import { TIER_COLORS } from '../tiers'

export interface TileEntity {
  id: string
  name: string
  href: string
  img: string
  rarity: string | null
  rarityColor: string
  /** Small icons drawn in the top corners (e.g. element / class). */
  cornerTL?: { icon: string; label: string } | null
  cornerTR?: { icon: string; label: string } | null
  /** One-line hover summary. */
  caption?: string
  /** 'contain' for transparent cut-out portraits, so heads aren't cropped. */
  fit?: 'cover' | 'contain'
  /** 'card': a tall torn-edge card (Void Hunters) instead of the square frame; the rarity shows as a glow. */
  shape?: 'square' | 'card'
  /** Quantum's Pay-to-Win / New markers (src/qgg/notes.ts). */
  flags?: { p2w: boolean; isNew: boolean }
}

/** Portrait tile shared by every game: rarity frame, two corner icons, optional tier tag, name. */
export default function QTile({
  e,
  tier,
  dimmed,
  size = 'md',
}: {
  e: TileEntity
  tier?: string | null
  dimmed?: boolean
  size?: 'sm' | 'md'
}) {
  return (
    <Link
      href={e.href}
      className={`qt qt--${size}${e.shape === 'card' ? ' qt--card' : ''}${dimmed ? ' is-dim' : ''}`}
      style={{ '--rarity': e.rarityColor } as React.CSSProperties}
      title={e.caption ?? e.name}
    >
      <span className="qt-frame">
        <img
          className="qt-img"
          src={e.img}
          alt={e.name}
          loading="lazy"
          width={128}
          height={e.shape === 'card' ? 168 : 128}
          style={e.fit === 'contain' ? { objectFit: 'contain', objectPosition: 'bottom' } : undefined}
        />
        {e.cornerTL && <img className="qt-ico qt-ico--tl" src={e.cornerTL.icon} alt={e.cornerTL.label} />}
        {e.cornerTR && <img className="qt-ico qt-ico--tr" src={e.cornerTR.icon} alt={e.cornerTR.label} />}
        {e.flags && (
          <span className="qt-flags">
            {e.flags.isNew && <span className="qt-flag qt-flag--new">NEW</span>}
            {e.flags.p2w && <span className="qt-flag qt-flag--p2w" title="Pay to win">$</span>}
          </span>
        )}
        {tier && (
          <span className="qt-tier" style={{ background: TIER_COLORS[tier] ?? '#666' }}>
            {tier}
          </span>
        )}
      </span>
      <span className="qt-name">{e.name}</span>
    </Link>
  )
}
