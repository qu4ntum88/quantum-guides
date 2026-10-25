import { getGuide } from '@/src/dcdl/lib/content-db'
import { renderGuideCard, renderLogoCard, remoteImage, OG_SIZE, OG_CONTENT_TYPE } from '@/src/lib/og'

// Share card for a guide: title, author and branding beside the guide's cover art. Unlike the
// champion and legacy cards this one also renders on request, for guides published after a
// deploy, so its fonts and logo come from src/assets (see outputFileTracingIncludes).
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'DC: Dark Legion guide on Quantum Game Guides'
export const revalidate = 60

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const guide = await getGuide(id)
  if (!guide) return renderLogoCard('DC: Dark Legion')
  return renderGuideCard({
    overline: 'DC: Dark Legion · Guide',
    title: guide.title,
    author: guide.author,
    art: await remoteImage(guide.coverImage),
  })
}
