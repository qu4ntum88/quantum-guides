import { getMeta, getRoster, getTierLists, type Kind, type RosterEntry } from './data'
import { CLASSES, TITAN_ROLES, TIERS, unitPath } from './constants'
import { RARITY_COLORS, RARITY_ORDER, type BoardRow } from '@/src/qgg/tiers'
import type { BrowserEntity, BrowserFilter } from '@/src/qgg/components/TierBrowser'
import type { TileEntity } from '@/src/qgg/components/QTile'

/** label → icon for every element, class, role, faction and soul sign. */
export function getIcons(): Record<string, string> {
  const m = getMeta()
  const out: Record<string, string> = {}
  // Roles before classes: "Tank" is both, and the class icon is the one Invokers show.
  for (const group of [m.element, m.role, m.class, m.faction, m.soulSign]) {
    for (const [label, chip] of Object.entries(group)) if (chip.icon) out[label] = chip.icon
  }
  return out
}

type TileSource = Pick<RosterEntry, 'slug' | 'kind' | 'name' | 'rarity' | 'element' | 'class' | 'role' | 'portrait'>

const columnOf = (u: Pick<RosterEntry, 'kind' | 'class' | 'role'>) => (u.kind === 'Titan' ? u.role : u.class)

/** A unit as a portrait tile. */
export function toTile(u: TileSource, icons: Record<string, string>): TileEntity {
  const col = columnOf(u)
  return {
    id: u.slug,
    name: u.name,
    href: unitPath(u.kind, u.slug),
    img: u.portrait,
    rarity: u.rarity,
    rarityColor: RARITY_COLORS[u.rarity] ?? '#666',
    cornerTL: u.element && icons[u.element] ? { icon: icons[u.element], label: u.element } : null,
    cornerTR: col && icons[col] ? { icon: icons[col], label: col } : null,
    caption: `${u.name} · ${[u.rarity, u.element, col].filter(Boolean).join(' · ')}`,
  }
}

export function browserEntities(kind: Kind): BrowserEntity[] {
  const icons = getIcons()
  return getRoster()
    .filter((u) => u.kind === kind)
    .map((u) => ({
      ...toTile(u, icons),
      group: columnOf(u),
      facets: { element: u.element, rarity: u.rarity, class: u.class, role: u.role, faction: u.faction, soulSign: u.soulSign },
      search: u.effects.join(' '),
    }))
}

export function browserFilters(kind: Kind): BrowserFilter[] {
  const units = getRoster().filter((u) => u.kind === kind)
  const opts = (k: 'element' | 'class' | 'role' | 'faction' | 'soulSign') =>
    [...new Set(units.map((u) => u[k]).filter((v): v is string => !!v))].sort()
  const rarities = RARITY_ORDER.filter((r) => units.some((u) => u.rarity === r))
  return kind === 'Titan'
    ? [
        { key: 'rarity', label: 'Rarity', param: 'rarity', options: rarities },
        { key: 'role', label: 'Role', param: 'role', options: opts('role') },
        { key: 'faction', label: 'Faction', param: 'faction', options: opts('faction') },
      ]
    : [
        { key: 'element', label: 'Element', param: 'element', options: opts('element') },
        { key: 'rarity', label: 'Rarity', param: 'rarity', options: rarities },
        { key: 'class', label: 'Class', param: 'class', options: opts('class') },
        { key: 'faction', label: 'Faction', param: 'faction', options: opts('faction') },
        { key: 'soulSign', label: 'Soul Sign', param: 'sign', options: opts('soulSign') },
      ]
}

export function boardColumns(kind: Kind) {
  const icons = getIcons()
  return [...(kind === 'Titan' ? TITAN_ROLES : CLASSES)].map((c) => ({ key: c, label: c, icon: icons[c] ?? null }))
}

/**
 * Board rows for one tier list. "overall" ranks every unit by its average across the
 * boss lists (see `assignOverallTiers` in scripts/sync-invokers.mjs); a boss id uses
 * that list as published.
 */
export function boardFor(kind: Kind, listId: string): BoardRow[] | null {
  const units = getRoster().filter((u) => u.kind === kind)
  const columns: string[] = [...(kind === 'Titan' ? TITAN_ROLES : CLASSES)]

  if (listId === 'overall') {
    return TIERS.map((tier) => ({
      tier,
      groups: columns.map((role) => ({
        role,
        members: units
          .filter((u) => u.overall?.tier === tier && columnOf(u) === role)
          .sort((a, b) => (b.overall?.score ?? 0) - (a.overall?.score ?? 0) || a.name.localeCompare(b.name))
          .map((u) => u.slug),
      })),
    })).filter((r) => r.groups.some((g) => g.members.length))
  }

  return getTierLists(kind).find((l) => l.id === listId)?.rows ?? null
}

export const listLinks = (kind: Kind) => getTierLists(kind).map((l) => ({ id: l.id, boss: l.boss }))
