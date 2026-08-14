import herosRaw from "../data/heros.json"
import legacyRaw from "../data/legacy.json"
import synergiesRaw from "../data/synergies.json"
import dataUpdated from "../data/data-updated.json"

/**
 * The "Updated:" stamp shown on the tier list, best teams, combat cycle, and
 * supreme commander pages.
 *
 * Reads `data-updated.json`, a committed record of when each data file last
 * changed, maintained by `scripts/stamp-data-dates.mjs` (the pre-commit hook
 * stamps whichever data files a commit touches).
 *
 * This used to use `fs.statSync().mtimeMs`, but build systems normalise file
 * mtimes — in production every page reported the same bogus date (October 20,
 * 2018), years before the game existed. A committed stamp is the only value
 * that survives a deploy intact.
 */
export function getDataLastUpdated(...fileNames: string[]): string {
  const files = fileNames.length > 0 ? fileNames : ['heros.json', 'legacy.json']
  const dates = files
    .map((f) => (dataUpdated as Record<string, string>)[f])
    .filter(Boolean)
    .sort()
  const latest = dates[dates.length - 1]
  if (!latest) return ''
  // Parsed as UTC so the date never slips a day depending on server timezone.
  return new Date(`${latest}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  })
}

function fixHeroImagePath(path: string | undefined): string | undefined {
  if (!path) return undefined
  return path
    .replace(/^\.\/headshot_images\//, "/dcdl/heros/headshot_images/")
    .replace(/^\.\/full_images\//, "/dcdl/heros/full_images/")
    .replace(/^\.\/skill_images\//, "/dcdl/heros/skill_images/")
    .replace(/^\.\/upgrade_images\//, "/dcdl/heros/upgrade_images/")
    .replace(/^\.\/globalskill_images\//, "/dcdl/heros/globalskill_images/")
    .replace(/^\.\/rarity_images\//, "/dcdl/heros/rarity_images/")
}

function fixLegacyImagePath(path: string | undefined): string | undefined {
  if (!path) return undefined
  return path
    .replace(/^\.\/legacy_images_skills\//, "/dcdl/legacy/legacy_images_skills/")
    .replace(/^\.\/legacy_images\//, "/dcdl/legacy/legacy_images/")
}

function fixSynergyImagePath(path: string | undefined): string | undefined {
  if (!path) return undefined
  return path
    .replace(/^\.\/tag_images\//, "/dcdl/synergies/tag_images/")
    .replace(/^\.\/description_images\//, "/dcdl/synergies/description_images/")
    .replace(/^\.\/faction_infographics\//, "/dcdl/synergies/faction_infographics/")
}

export type Hero = {
  id: string
  name: string
  class: string
  rarity: string
  tier: string
  damageType?: string
  gameModes?: string[]
  transmutePriorities?: string[]
  quantumsTake?: string
  tagSynergies: string[]
  imageHeadshot?: string
  imageFull?: string
  sourcesWhereAvailable?: string[]
  recommendedLegacyPieces?: string[]
  ultimate?: { name: string; description: string; image?: string }
  skills?: { name: string; description: string; image?: string }[]
  globalSkill?: { name: string; description: string; image?: string }
  upgrades?: { name: string; description: string; image?: string }[]
  isNew?: boolean
  isP2W?: boolean
  previousTier?: string
  ascendsTo?: string
  ascendedFrom?: string
  starBreakpoint?: number
  acDcPriority?: string[]
  whaleOrSkipValue?: string
  uniqueLegacyRequired?: boolean
}

export type HeroResolved = Omit<Hero, "tagSynergies" | "recommendedLegacyPieces"> & {
  tagSynergies: Synergy[]
  recommendedLegacyPieces: Legacy[]
}

export type Legacy = {
  id: string
  name: string
  image?: string
  rank?: string
  unique?: boolean
  tier?: string
  role?: string
  gearEffects?: string[]
  legacySkills?: { name: string; description: string; image?: string }[]
  isNew?: boolean
  isP2W?: boolean
  previousTier?: string
}

export type LegacyResolved = Legacy & { champions: HeroResolved[] }

export type Synergy = {
  id: string
  name: string
  image?: string
  descriptionImage?: string
  infographic?: string
}

// Raw data with fixed image paths
const herosData: Hero[] = (herosRaw as Hero[]).map((h) => ({
  ...h,
  imageHeadshot: fixHeroImagePath(h.imageHeadshot),
  imageFull: fixHeroImagePath(h.imageFull),
  ultimate: h.ultimate ? { ...h.ultimate, image: fixHeroImagePath(h.ultimate.image) } : undefined,
  skills: h.skills?.map((s) => ({ ...s, image: fixHeroImagePath(s.image) })),
  globalSkill: h.globalSkill ? { ...h.globalSkill, image: fixHeroImagePath(h.globalSkill.image) } : undefined,
  upgrades: h.upgrades?.map((u) => ({ ...u, image: fixHeroImagePath(u.image) })),
}))

const legacyData: Legacy[] = (legacyRaw as Legacy[]).map((l) => ({
  ...l,
  image: fixLegacyImagePath(l.image),
  legacySkills: l.legacySkills?.map((s) => ({ ...s, image: fixLegacyImagePath(s.image) })),
}))

const synergiesData: Synergy[] = (synergiesRaw as Synergy[]).map((s) => ({
  ...s,
  image: fixSynergyImagePath(s.image),
  descriptionImage: fixSynergyImagePath(s.descriptionImage),
  infographic: fixSynergyImagePath(s.infographic),
}))

export function getHeros(): Hero[] {
  return herosData
}

export function getLegacy(): Legacy[] {
  return legacyData
}

export function getSynergies(): Synergy[] {
  return synergiesData
}

export function getResolvedHeros(): HeroResolved[] {
  return herosData.map((h) => {
    const tagSynergies = h.tagSynergies
      .map((sid) => synergiesData.find((s) => s.id === sid))
      .filter((s): s is Synergy => s != null)

    const recommendedLegacyPieces = (h.recommendedLegacyPieces ?? [])
      .map((lid) => legacyData.find((l) => l.id === lid))
      .filter((l): l is Legacy => l != null)

    return { ...h, tagSynergies, recommendedLegacyPieces }
  })
}

export function getResolvedLegacy(): LegacyResolved[] {
  const resolvedHeros = getResolvedHeros()
  return legacyData.map((l) => ({
    ...l,
    champions: resolvedHeros.filter((h) =>
      h.recommendedLegacyPieces?.some((rlp) => rlp.id === l.id)
    ),
  }))
}
