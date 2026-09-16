import type { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'
import { getResolvedHeros } from '@/src/dcdl/lib/data'
import { PUBLIC_SECTIONS } from '@/src/lib/siteConfig'

const BASE = 'https://www.quantumgameguides.com'

// Sections are included only while they're public (see src/lib/siteConfig.ts).
// Godforge is still hidden, so it has no entries here; re-add it alongside the
// Void Hunters block below if PUBLIC_SECTIONS.godforge is ever flipped on.
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
  ]

  const heroPaths = getResolvedHeros().map((h) => `/games/dc-dark-legion/heros/${h.id}`)

  let guidePaths: string[] = []
  try {
    const dir = path.join(process.cwd(), 'src/dcdl/guides')
    guidePaths = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
      .map((f) => `/games/dc-dark-legion/guides/${f.replace(/\.(mdx|md)$/, '')}`)
  } catch {}

  // Void Hunters: hub, hunter database, status effects, and every hunter page.
  let vhPaths: string[] = []
  if (PUBLIC_SECTIONS.voidHunters) {
    const vhStatic = [
      '/games/void-hunters/guides',
      '/games/void-hunters',
      '/games/void-hunters/status-effects',
    ]
    let hunterPaths: string[] = []
    try {
      const hunters = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'src/vh/data/hunters.json'), 'utf8')
      ) as { id: string }[]
      hunterPaths = hunters.map((h) => `/games/void-hunters/hunters/${h.id}`)
    } catch {}
    vhPaths = [...vhStatic, ...hunterPaths]
  }

  return [...staticPaths, ...heroPaths, ...guidePaths, ...vhPaths].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: p === '' ? 1 : 0.7,
  }))
}
