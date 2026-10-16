import fs from 'fs'
import path from 'path'

// Invokers: Titan Legacy data, written by scripts/sync-invokers.mjs from the game-data
// export. Read at build time; every page under /games/invokers is static.

export type Kind = 'Invoker' | 'Titan'

export interface RosterEntry {
  slug: string
  kind: Kind
  name: string
  faction: string
  rarity: string
  class: string | null
  element: string | null
  soulSign: string | null
  role: string | null
  portrait: string
  aoe: number
  effects: string[]
  max: { hp: string | null; atk: string | null; def: string | null }
  /** tier-list id → tier */
  ratings: Record<string, string>
  overall: { tier: string; score: number; lists: number } | null
}

export interface SkillLevel {
  level: number
  crown: boolean
  cooldown: string
  cost: string
  text: string
}

export interface Skill {
  name: string
  type: string
  label: string
  aoe: boolean
  icon: string | null
  effects: { label: string; group: string; description: string }[]
  manaGen: { ult: string | null; titan: string | null } | null
  levels: SkillLevel[]
}

export interface Unit extends Omit<RosterEntry, 'aoe' | 'effects' | 'max'> {
  gender: string | null
  fullArt: string
  stats: { base: Record<string, string>; max: Record<string, string> }
  skills: Skill[]
  tolerances: { label: string; byLevel: string[] }[]
  bio: string
}

export interface TierList {
  id: string
  kind: Kind
  boss: string
  rows: { tier: string; groups: { role: string; members: string[] }[] }[]
}

type Chip = { icon: string | null; color: string | null }
export interface Meta {
  element: Record<string, Chip>
  class: Record<string, Chip>
  faction: Record<string, Chip>
  soulSign: Record<string, Chip>
  role: Record<string, Chip>
  tolerance: Record<string, Chip>
}

const DATA = path.join(process.cwd(), 'src/inv/data')
const read = <T,>(rel: string): T => JSON.parse(fs.readFileSync(path.join(DATA, rel), 'utf8'))
// Cache in production builds only, so a re-sync shows up in `next dev` without a restart.
const CACHE = process.env.NODE_ENV === 'production'

let roster: RosterEntry[] | null = null
export const getRoster = (): RosterEntry[] => (CACHE ? (roster ??= read<RosterEntry[]>('roster.json')) : read<RosterEntry[]>('roster.json'))
export const getInvokers = () => getRoster().filter((r) => r.kind === 'Invoker')
export const getTitans = () => getRoster().filter((r) => r.kind === 'Titan')

export function getUnit(kind: Kind, slug: string): Unit | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null
  try {
    return read<Unit>(`units/${kind === 'Titan' ? 'titans' : 'invokers'}/${slug}.json`)
  } catch {
    return null
  }
}

let lists: TierList[] | null = null
export const getTierLists = (kind?: Kind): TierList[] => {
  const all = CACHE ? (lists ??= read<TierList[]>('tier-lists.json')) : read<TierList[]>('tier-lists.json')
  return kind ? all.filter((l) => l.kind === kind) : all
}

let meta: Meta | null = null
export const getMeta = (): Meta => (CACHE ? (meta ??= read<Meta>('meta.json')) : read<Meta>('meta.json'))

/** "Last updated" for the Invokers data: the date the sync last wrote roster.json, from data-updated.json. */
export function getInvUpdatedISO(): string | null {
  try {
    const stamps = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/dcdl/data/data-updated.json'), 'utf8'))
    return stamps['inv/roster.json'] ?? null
  } catch {
    return null
  }
}

export interface EffectEntry {
  label: string
  group: string
  description: string
  /** Units with a skill that applies it, as roster slugs by kind. */
  invokers: string[]
  titans: string[]
}

/** Every status effect named in a skill, with the Invokers and Titans whose kits apply it. */
export function getEffects(): EffectEntry[] {
  const map = new Map<string, EffectEntry>()
  for (const r of getRoster()) {
    const u = getUnit(r.kind, r.slug)
    if (!u) continue
    for (const s of u.skills) {
      for (const e of s.effects) {
        let entry = map.get(e.label)
        if (!entry) map.set(e.label, (entry = { label: e.label, group: e.group, description: e.description, invokers: [], titans: [] }))
        const bucket = r.kind === 'Titan' ? entry.titans : entry.invokers
        if (!bucket.includes(r.slug)) bucket.push(r.slug)
      }
    }
  }
  return [...map.values()].sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label))
}
