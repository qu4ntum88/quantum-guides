import { renderLogoCard } from '@/src/lib/og'

// The site-wide default share image (served at /og-default.png): the Quantum logo
// card, used by pageMeta() for every page that has no image of its own.
export const dynamic = 'force-static'

export function GET() {
  return renderLogoCard('Tier lists, guides & tools for gacha games')
}
