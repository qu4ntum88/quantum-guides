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
      className={`qt qt--${size}${dimmed ? ' is-dim' : ''}`}
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
          height={128}
          style={e.fit === 'contain' ? { objectFit: 'contain', objectPosition: 'bottom' } : undefined}
        />
        {e.cornerTL && <img className="qt-ico qt-ico--tl" src={e.cornerTL.icon} alt={e.cornerTL.label} />}
        {e.cornerTR && <img className="qt-ico qt-ico--tr" src={e.cornerTR.icon} alt={e.cornerTR.label} />}
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
