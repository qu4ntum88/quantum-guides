import { getResolvedHeros } from '@/src/dcdl/lib/data'
import { renderCard, renderLogoCard, publicImage, OG_SIZE, OG_CONTENT_TYPE } from '@/src/lib/og'

// Share card for a champion: full art, name, rarity/class, Quantum's tier.
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'DC: Dark Legion champion on Quantum Game Guides'

export function generateStaticParams() {
  return getResolvedHeros().map((h) => ({ id: h.id }))
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const hero = getResolvedHeros().find((h) => h.id === id)
  if (!hero) return renderLogoCard('DC: Dark Legion')
  const art = (await publicImage(hero.imageFull)) ?? (await publicImage(hero.imageHeadshot))
  const [name, variant] = hero.name.split(/\s*\((.*)\)\s*$/)
  return renderCard({
    overline: 'DC: Dark Legion',
    title: name,
    lines: [[variant && variant !== hero.rarity ? variant : null, hero.rarity, hero.class].filter(Boolean).join(' · ')],
    tier: hero.tier,
    art,
    artFit: 'cover',
  })
}
