import type { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'
import { getResolvedHeros, getLegacy, getDataUpdatedISO } from '@/src/dcdl/lib/data'
import { getGuidesList, getPatchNotes } from '@/src/dcdl/lib/content-db'
import { getOfficialTiersUpdatedAt } from '@/src/dcdl/lib/tier-db'
import { PUBLIC_SECTIONS } from '@/src/lib/siteConfig'
import { SITE_URL } from '@/src/lib/seo'

// Guides and patch notes come from the CMS, so rebuild the sitemap hourly
// instead of freezing it at deploy time.
export const revalidate = 3600

type Entry = [path: string, lastModified?: string | null]

// `lastModified` is only set where we know the real date (data-updated.json, the
// CMS, the official tier table). A date that is always "now" teaches Google to
// ignore the field entirely. Godforge is hidden, so it has no entries here.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [guides, patchNotes, tiersSavedAt] = await Promise.all([
    getGuidesList().catch(() => []),
    getPatchNotes().catch(() => []),
    getOfficialTiersUpdatedAt().catch(() => null),
  ])
  const tiers = tiersSavedAt?.slice(0, 10) ?? null
  const latest = (...dates: (string | null | undefined)[]) =>
    dates.filter((d): d is string => !!d).sort().pop() ?? null

  const D = '/games/dc-dark-legion'
  const entries: Entry[] = [
    ['/', latest(tiers, getDataUpdatedISO('heros.json', 'legacy.json'), guides[0]?.pubDate)],
    ['/about'],
    ['/privacy-policy'],
    ['/terms'],
    ['/disclaimer'],
    ['/cookies'],
    [`${D}/guides`, latest(guides[0]?.pubDate, patchNotes[0]?.publishedAt, getDataUpdatedISO('game-info.json'))],
    [`${D}/champion-tier-list`, latest(tiers, getDataUpdatedISO('heros.json'))],
    [`${D}/legacy-tier-list`, latest(tiers, getDataUpdatedISO('legacy.json'))],
    [`${D}/legacy/community-tier`, getDataUpdatedISO('legacy.json')],
    [`${D}/best-teams`, getDataUpdatedISO('best-teams.json', 'heros.json')],
    [`${D}/combat-cycle`, getDataUpdatedISO('combat-cycle.json', 'heros.json')],
    [`${D}/supreme-commander`, getDataUpdatedISO('supreme-commander.json')],
    [`${D}/ship-combat-guides`],
    [`${D}/infographics`, getDataUpdatedISO('infographics.json', 'shards-per-star.json')],
    [`${D}/patch-notes`, patchNotes[0]?.publishedAt],
    ...getResolvedHeros().map((h): Entry => [`${D}/heros/${h.id}`, getDataUpdatedISO('heros.json', `${h.id}.json`)]),
    ...getLegacy().map((l): Entry => [`${D}/legacy/${l.id}`, getDataUpdatedISO('legacy.json')]),
    ...guides.map((g): Entry => [`${D}/guides/${g.id}`, g.pubDate]),
  ]

  // Void Hunters: hub, hunter database, status effects, and every hunter page.
  if (PUBLIC_SECTIONS.voidHunters) {
    entries.push(['/games/void-hunters/guides'], ['/games/void-hunters'], ['/games/void-hunters/status-effects'])
    try {
      const hunters = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'src/vh/data/hunters.json'), 'utf8')
      ) as { id: string }[]
      entries.push(...hunters.map((h): Entry => [`/games/void-hunters/hunters/${h.id}`]))
    } catch {}
  }

  return entries.map(([p, lastModified]) => ({
    url: `${SITE_URL}${p === '/' ? '' : p}`,
    ...(lastModified ? { lastModified } : {}),
  }))
}
