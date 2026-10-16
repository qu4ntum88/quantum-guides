import fs from 'fs'
import path from 'path'
import { getResolvedLegacy } from '@/src/dcdl/lib/data'
import { renderCard, renderLogoCard, publicImage, OG_SIZE, OG_CONTENT_TYPE } from '@/src/lib/og'

// Share card for a legacy piece: icon, name, rank, unique owner, max-star Gear Effects, tier.
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'DC: Dark Legion legacy piece on Quantum Game Guides'
// Prerendered only: the source files aren't shipped with the function (see src/lib/og.tsx).
export const dynamicParams = false

export function generateStaticParams() {
  return getResolvedLegacy().map((l) => ({ id: l.id }))
}

type Details = { quality: string; uniqueTo: string | null; art: string | null; gearEffects: { stats: string[]; rows: string[][] } | null }
const QUALITY: Record<string, string> = { Red: 'Mythic', Orange: 'Legendary', Purple: 'Epic' }

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const piece = getResolvedLegacy().find((l) => l.id === id)
  if (!piece) return renderLogoCard('DC: Dark Legion')
  let d: Details | null = null
  try {
    d = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/dcdl/legacy/details', `${id}.json`), 'utf8'))
  } catch {}
  const rank = piece.rank || (d ? QUALITY[d.quality] : undefined)
  const top = d?.gearEffects?.rows[d.gearEffects.rows.length - 1]
  const stats = d?.gearEffects && top
    ? d.gearEffects.stats.slice(0, 3).map((s, i) => `+${top[i + 1]} ${s.replace(/ %$/, '')}`).join(' · ')
    : null
  return renderCard({
    overline: 'DC: Dark Legion · Legacy Piece',
    title: piece.name,
    lines: [[rank, d?.uniqueTo ? `Unique to ${d.uniqueTo}` : null].filter(Boolean).join(' · '), stats ? `${top![0]}: ${stats}` : ''].filter(Boolean),
    tier: piece.tier,
    art: (await publicImage(d?.art)) ?? (await publicImage(piece.image)),
    artFit: 'portrait',
  })
}
