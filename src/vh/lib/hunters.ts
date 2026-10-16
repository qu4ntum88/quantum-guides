import type { Hunter } from '../components/HunterBox'
import { resolveGameTiers } from '@/src/qgg/game-tiers'
import { RARITY_COLORS, RARITY_ORDER } from '@/src/qgg/tiers'
import { noteFlags } from '@/src/qgg/notes'
import type { BrowserEntity, BrowserFilter } from '@/src/qgg/components/TierBrowser'

// Void Hunters read layer for the tier list. hunters.json is the roster; Quantum's tier
// comes from Supabase, then a `tier` field on the hunter, then the rarity seed.

export const VH_CLASSES = ['Attacker', 'Balanced', 'Support', 'Tank'] as const

type VhHunter = Hunter & { tier?: string | null }

const first = (v: unknown) => (Array.isArray(v) && v.length ? String(v[0]) : null)

export function getVhRoster(): VhHunter[] {
  return (require('@/src/vh/data/hunters.json') as VhHunter[]).filter((h) => h.rarity)
}

export const vhHunterPath = (id: string) => `/games/void-hunters/hunters/${id}`

export const getVhTieredRoster = () => resolveGameTiers('vh_hunter', getVhRoster())

export function vhEntities(hunters: VhHunter[]): BrowserEntity[] {
  return hunters.map((h) => {
    const cls = first(h.class)
    return {
      id: h.id,
      name: h.name,
      href: vhHunterPath(h.id),
      img: h.portrait,
      rarity: h.rarity,
      rarityColor: RARITY_COLORS[h.rarity] ?? '#666',
      caption: `${h.name}${h.title ? `, ${h.title}` : ''} · ${[h.rarity, cls, first(h.species), first(h.homeland)].filter(Boolean).join(' · ')}`,
      flags: noteFlags('voidhunters', h.id),
      group: cls,
      facets: { rarity: h.rarity, class: cls, homeland: first(h.homeland), species: first(h.species) },
      search: [h.title, ...(h.other ?? [])].filter(Boolean).join(' '),
    }
  })
}

export function vhFilters(hunters: VhHunter[]): BrowserFilter[] {
  const opts = (k: 'homeland' | 'species') => [...new Set(hunters.map((h) => first(h[k])).filter((v): v is string => !!v))].sort()
  return [
    { key: 'rarity', label: 'Rarity', param: 'rarity', options: RARITY_ORDER.filter((r) => hunters.some((h) => h.rarity === r)) },
    { key: 'class', label: 'Class', param: 'class', options: [...VH_CLASSES] },
    { key: 'homeland', label: 'Homeland', param: 'homeland', options: opts('homeland') },
    { key: 'species', label: 'Species', param: 'species', options: opts('species') },
  ]
}
