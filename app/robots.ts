import type { MetadataRoute } from 'next'
import { PUBLIC_SECTIONS } from '@/src/lib/siteConfig'

const BASE = 'https://www.quantumgameguides.com'

export default function robots(): MetadataRoute.Robots {
  // Keep crawlers out of non-content routes, and out of any hidden game section
  // so bots stop spending crawl budget (and edge requests) on 404s.
  const disallow = ['/api/', '/admin/', '/members']
  if (!PUBLIC_SECTIONS.godforge) disallow.push('/games/godforge')
  if (!PUBLIC_SECTIONS.voidHunters) disallow.push('/games/void-hunters')

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow,
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
