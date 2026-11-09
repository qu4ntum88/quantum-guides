import type { MetadataRoute } from 'next'
import { PUBLIC_SECTIONS } from '@/src/lib/siteConfig'

const BASE = 'https://www.quantumgameguides.com'

export default function robots(): MetadataRoute.Robots {
  // Keep crawlers out of non-content routes, and out of any hidden game section
  // so bots stop spending crawl budget (and edge requests) on 404s.
  const disallow = ['/api/', '/admin/', '/members']
  if (!PUBLIC_SECTIONS.godforge) disallow.push('/games/godforge')
  if (!PUBLIC_SECTIONS.voidHunters) disallow.push('/games/void-hunters')
  if (!PUBLIC_SECTIONS.invokers) disallow.push('/games/invokers')

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
      // Bulk AI-training crawlers: they fetch every page and image on repeat and send
      // no visitors back, and each fetch counts against the Vercel plan's requests and
      // transfer (the site was paused on Hobby on 2026-11-07). Search engines and the AI
      // assistants that fetch a page to answer a user's question (OAI-SearchBot,
      // ChatGPT-User, Claude-User, Claude-SearchBot, PerplexityBot) stay allowed above.
      {
        userAgent: [
          'GPTBot', 'ClaudeBot', 'anthropic-ai', 'CCBot', 'Bytespider', 'meta-externalagent',
          'Amazonbot', 'Applebot-Extended', 'Google-Extended', 'cohere-ai', 'Diffbot',
          'omgili', 'Timpibot', 'ImagesiftBot',
        ],
        disallow: '/',
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
