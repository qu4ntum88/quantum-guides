import fs from 'fs'
import path from 'path'
import type { GfHero } from '../components/GfHeroBox'
import { resolveGameTiers } from '@/src/qgg/game-tiers'
import { RARITY_COLORS, RARITY_ORDER } from '@/src/qgg/tiers'
import { noteFlags } from '@/src/qgg/notes'
import type { BrowserEntity, BrowserFilter } from '@/src/qgg/components/TierBrowser'

// Godforge read layer. heroes.json is the roster (slug ids, local art, rarity, realm, Quantum's
// tier); src/gf/data/game/heroes/<slug>.json is each hero's page data, built from the game
// export by scripts/sync-godforge.mjs.

export interface GfRosterHero {
  id: string
  name: string
  fullArt: string
  portrait: string | null
  rarity: string | null
  affinity: string | null
  allegiance: string | null
  archetype: string | null
  faction: string | null
  tier?: string | null
}

export type GfHeroPage = GfHero & { slug: string; summary: string | null; lore: string | null }

export const ARCHETYPES = ['Brawler', 'Defender', 'Disruptor', 'Invoker', 'Slayer'] as const

const DATA = path.join(process.cwd(), 'src/gf/data')
const read = <T,>(rel: string): T => JSON.parse(fs.readFileSync(path.join(DATA, rel), 'utf8'))

/** Playable heroes only (the dungeon bosses in heroes.json have no rarity). */
export const getGfRoster = (): GfRosterHero[] => read<GfRosterHero[]>('heroes.json').filter((h) => h.rarity)

export function getGfHero(slug: string): GfHeroPage | null {
  if (!/^[a-z0-9_-]+$/.test(slug)) return null
  try {
    return read<GfHeroPage>(`game/heroes/${slug}.json`)
  } catch {
    return null
  }
}

/** Every page-ready hero slug (roster heroes the export covers). */
export function getGfHeroSlugs(): string[] {
  try {
    return fs.readdirSync(path.join(DATA, 'game/heroes')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5))
  } catch {
    return []
  }
}

export const titleCase = (s: string | null | undefined) => (s ? s[0] + s.slice(1).toLowerCase() : s ?? null)

export const gfIcon = {
  faction: (f: string | null) => (f ? `/godforge/gf_heroes/factions/${f.toUpperCase()}.png` : null),
  archetype: (a: string | null) => (a ? `/godforge/gf_heroes/archetypes/Archetype_${a}.png` : null),
  affinity: (a: string | null) => (a ? `/godforge/gf_heroes/affinity/${a}.png` : null),
  allegiance: (a: string | null) => (a ? `/godforge/gf_heroes/allegiances/Allegiance_${a}.png` : null),
}

export const gfHeroPath = (slug: string) => `/games/godforge/heroes/${slug}`

/** The roster with Quantum's tiers applied (Supabase → heroes.json → rarity seed). */
export const getGfTieredRoster = () => resolveGameTiers('gf_hero', getGfRoster())

export function gfEntities(heroes: GfRosterHero[]): BrowserEntity[] {
  return heroes.map((h) => {
    const realm = titleCase(h.faction)
    return {
      id: h.id,
      name: h.name,
      href: gfHeroPath(h.id),
      img: h.portrait || h.fullArt,
      fit: h.portrait ? 'contain' : 'cover',
      rarity: h.rarity,
      rarityColor: RARITY_COLORS[h.rarity ?? ''] ?? '#666',
      cornerTL: h.faction ? { icon: gfIcon.faction(h.faction)!, label: realm ?? h.faction } : null,
      cornerTR: h.affinity ? { icon: gfIcon.affinity(h.affinity)!, label: h.affinity } : null,
      caption: `${h.name} · ${[h.rarity, h.affinity, h.archetype, realm].filter(Boolean).join(' · ')}`,
      flags: noteFlags('godforge', h.id),
      group: h.archetype,
      facets: { rarity: h.rarity, affinity: h.affinity, allegiance: h.allegiance, realm, archetype: h.archetype },
    }
  })
}

export function gfFilters(heroes: GfRosterHero[]): BrowserFilter[] {
  const opts = (vals: (string | null)[]) => [...new Set(vals.filter((v): v is string => !!v))].sort()
  return [
    { key: 'rarity', label: 'Rarity', param: 'rarity', options: RARITY_ORDER.filter((r) => heroes.some((h) => h.rarity === r)) },
    { key: 'affinity', label: 'Affinity', param: 'affinity', options: opts(heroes.map((h) => h.affinity)) },
    { key: 'allegiance', label: 'Allegiance', param: 'allegiance', options: opts(heroes.map((h) => h.allegiance)) },
    { key: 'realm', label: 'Realm', param: 'realm', options: opts(heroes.map((h) => titleCase(h.faction))) },
    { key: 'archetype', label: 'Archetype', param: 'archetype', options: [...ARCHETYPES] },
  ]
}

/** label → icon, for filter chips. */
export function gfIcons(heroes: GfRosterHero[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const h of heroes) {
    if (h.affinity) out[h.affinity] = gfIcon.affinity(h.affinity)!
    if (h.allegiance) out[h.allegiance] = gfIcon.allegiance(h.allegiance)!
    if (h.faction) out[titleCase(h.faction)!] = gfIcon.faction(h.faction)!
    if (h.archetype) out[h.archetype] = gfIcon.archetype(h.archetype)!
  }
  return out
}
