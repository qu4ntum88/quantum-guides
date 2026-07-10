import type { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'
import { getResolvedHeros, getSynergies } from '@/src/dcdl/lib/data'

const BASE = 'https://www.quantumgameguides.com'

// DCDL-only sitemap. Godforge / Void Hunters are intentionally excluded while
// they're hidden (see src/lib/siteConfig.ts); re-add them here if re-enabled.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPaths = [
    '',
    '/about',
    '/privacy-policy',
    '/terms',
    '/disclaimer',
    '/games/dc-dark-legion/guides',
    '/games/dc-dark-legion',
    '/games/dc-dark-legion/legacy',
    '/games/dc-dark-legion/legacy/community-tier',
    '/games/dc-dark-legion/tier-list',
    '/games/dc-dark-legion/best-teams',
    '/games/dc-dark-legion/combat-cycle',
    '/games/dc-dark-legion/ship-combat-guides',
    '/games/dc-dark-legion/infographics',
    '/games/dc-dark-legion/factions',
  ]

  const heroPaths = getResolvedHeros().map((h) => `/games/dc-dark-legion/heros/${h.id}`)
  const factionPaths = getSynergies().map((s) => `/games/dc-dark-legion/factions/${s.id}`)

  let guidePaths: string[] = []
  try {
    const dir = path.join(process.cwd(), 'src/dcdl/guides')
    guidePaths = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
      .map((f) => `/games/dc-dark-legion/guides/${f.replace(/\.(mdx|md)$/, '')}`)
  } catch {}

  return [...staticPaths, ...heroPaths, ...factionPaths, ...guidePaths].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: p === '' ? 1 : 0.7,
  }))
}
