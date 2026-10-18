import raw from '../data/event-history.json'
import { getResolvedHeros, getLegacy } from './data'

/**
 * Read layer for the DC: Dark Legion event + Bleed history (src/dcdl/data/event-history.json,
 * hand-curated from the official Discord archive and checked by
 * scripts/check-dcdl-event-history.mjs). Used by /games/dc-dark-legion/event-history and the
 * history strip on champion pages.
 *
 * Patterns shown on the page are computed here from the dated facts, so they update as the
 * data grows. They are observations, never developer statements, and the page labels them so.
 */

export type Source = { post: string; quote: string; postedAt?: string }
export type FactType =
  | 'revealed' | 'tracker' | 'event-debut' | 'standard' | 'legacy' | 'rerun' | 'permanent-pool'
  | 'ascension' | 'upgrade' | 'vip' | 'divergence' | 'policy'
export type Fact = { type: FactType; date: string; what: string; servers?: string; legacyId?: string; sources: Source[] }
type ChampionRow = { id: string; name: string; facts: Fact[] }
export type Rewards = {
  frame?: string; baseSkin?: string; room?: string; magicEyes?: boolean; worldAnvilFragments?: boolean; other?: string[]
}
type EventRow = {
  id: string; name: string; kind: 'themed' | 'minor'; start: string; end?: string; mechanic?: string; servers?: string
  featured?: string[]; newChampions?: string[]; rerunOf?: string; notes?: string; rewards?: Rewards; sources: Source[]
}
type CollectionRow = { name: string; start: string; end?: string; rerunOf?: string; sources: Source[] }
type Dated = { date: string; what: string; sources: Source[] }

type Data = {
  caveats: string[]
  quantumsTake: string
  observations: { text: string; events: string[] }[]
  milestones: Dated[]
  bleedRules: Dated[]
  champions: ChampionRow[]
  events: EventRow[]
  collections: CollectionRow[]
  devStatements: Dated[]
}
const data = raw as unknown as Data

export type ChampionRef = { id: string; name: string; image?: string; rarity?: string }
export type ArchiveItem = {
  id: string; name: string; kind: 'themed' | 'minor' | 'collection'; start: string; end?: string
  mechanic?: string; servers?: string; notes?: string; rewards?: Rewards
  newChampions: ChampionRef[]; featured: ChampionRef[]
  rerun?: { previous: string; days: number }
  sources: Source[]
}

export const FACT_LABELS: Record<FactType, string> = {
  revealed: 'Revealed',
  tracker: 'Bleed banner',
  'event-debut': 'Event debut',
  standard: 'Joins the regular pool',
  legacy: 'Legacy piece',
  rerun: 'Rerun',
  'permanent-pool': 'Permanent tracker',
  ascension: 'Ascension story',
  upgrade: 'Limited Mythic upgrade',
  vip: 'VIP reward',
  divergence: 'Server split',
  policy: 'Developer note',
}

const FIRST_TYPES: FactType[] = ['revealed', 'tracker', 'event-debut', 'standard', 'vip', 'ascension', 'upgrade']
const HOW: Partial<Record<FactType, string>> = {
  revealed: 'Bleed', tracker: 'Bleed', 'event-debut': 'Event', standard: 'Regular pool', vip: 'VIP rewards',
  ascension: 'Mythic ascension', upgrade: 'Limited Mythic upgrade',
}

const DAY = 86400000
const t = (d: string) => new Date(`${d.length === 7 ? `${d}-01` : d}T00:00:00Z`).getTime()
export const daysBetween = (a: string, b: string) => Math.round((t(b) - t(a)) / DAY)
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length === 0 ? 0 : s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
}

export function formatDate(d: string): string {
  if (d.length === 7) return new Date(`${d}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  return new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

// Display names: rarity tags like "(Mythic +)" are dropped; an identity like "(Wally West)" is kept
// when another champion shares the base name (The Flash, Robin) or the official posts use the
// real name rather than the codename (Cassandra Cain, Donna Troy), so chips stay short.
const KEEP_IDENTITY = new Set(['orphan_cassandra_cain', 'donna_troy'])
const RARITY_TAG = /\s*\((Mythic\s*\+|Mythic|Legendary|Iconic)\)/gi
function heroRefs(): Map<string, ChampionRef> {
  const heros = getResolvedHeros()
  const base = (n: string) => n.replace(/\s*\(.*?\)/g, '').trim()
  const count = new Map<string, number>()
  for (const h of heros) count.set(base(h.name), (count.get(base(h.name)) ?? 0) + 1)
  const display = (id: string, n: string) => {
    const noRarity = n.replace(RARITY_TAG, '').trim()
    return KEEP_IDENTITY.has(id) || (count.get(base(n)) ?? 0) > 1 ? noRarity : base(n)
  }
  return new Map(heros.map((h) => [h.id, { id: h.id, name: display(h.id, h.name), image: h.imageHeadshot, rarity: h.rarity }]))
}

export const getCaveats = () => data.caveats
export const getQuantumsTake = () => data.quantumsTake?.trim() || ''
export const getBleedRules = () => [...data.bleedRules].sort((a, b) => b.date.localeCompare(a.date))
export const getDevStatements = () => [...data.devStatements].sort((a, b) => b.date.localeCompare(a.date))
export const getMilestones = () => [...data.milestones].sort((a, b) => b.date.localeCompare(a.date))

/** Every event and limited collection, newest first, with rerun gaps worked out. */
export function getArchive(): ArchiveItem[] {
  const refs = heroRefs()
  const ref = (id: string) => refs.get(id) ?? { id, name: id }
  const byId = new Map(data.events.map((e) => [e.id, e]))
  const items: ArchiveItem[] = data.events.map((e) => {
    // Gap from the previous run in the same chain (original + its reruns).
    const chainRoot = e.rerunOf ?? e.id
    const chain = data.events.filter((x) => x.id === chainRoot || x.rerunOf === chainRoot).sort((a, b) => a.start.localeCompare(b.start))
    const prev = chain[chain.indexOf(e) - 1]
    return {
      id: e.id, name: e.name, kind: e.kind, start: e.start, end: e.end, mechanic: e.mechanic, servers: e.servers,
      notes: e.notes, rewards: e.rewards, sources: e.sources,
      newChampions: (e.newChampions ?? []).map(ref),
      featured: (e.featured ?? []).filter((id) => !(e.newChampions ?? []).includes(id)).map(ref),
      rerun: prev && byId.has(prev.id) ? { previous: prev.start, days: daysBetween(prev.start, e.start) } : undefined,
    }
  })
  for (const c of data.collections) {
    const prev = c.rerunOf ? data.collections.find((x) => x.name === c.rerunOf) : undefined
    items.push({
      id: `collection-${c.name}-${c.start}`, name: c.name, kind: 'collection', start: c.start, end: c.end, sources: c.sources,
      newChampions: [], featured: [], rerun: prev ? { previous: prev.start, days: daysBetween(prev.start, c.start) } : undefined,
    })
  }
  return items.sort((a, b) => b.start.localeCompare(a.start))
}

export type ChampionFirst = { champion: ChampionRef; fact: Fact; how: string; legacy?: { id: string; name: string; date: string } }

/** Each champion's earliest dated arrival (reveal, banner, event debut, upgrade...), newest first. */
export function getChampionFirsts(): ChampionFirst[] {
  const refs = heroRefs()
  const legacyNames = new Map(getLegacy().map((l) => [l.id, l.name]))
  const out: ChampionFirst[] = []
  for (const c of data.champions) {
    const fact = [...c.facts].filter((f) => FIRST_TYPES.includes(f.type)).sort((a, b) => a.date.localeCompare(b.date))[0]
    if (!fact) continue
    out.push({
      champion: refs.get(c.id) ?? { id: c.id, name: c.name },
      fact,
      how: HOW[fact.type] ?? FACT_LABELS[fact.type],
      legacy: (() => {
        const l = c.facts.find((f) => f.legacyId)
        return l?.legacyId ? { id: l.legacyId, name: legacyNames.get(l.legacyId) ?? l.legacyId, date: l.date } : undefined
      })(),
    })
  }
  return out.sort((a, b) => b.fact.date.localeCompare(a.fact.date))
}

export type RerunRow = { champion: ChampionRef; fact: Fact; firstDate?: string; days?: number }

/** Official champion reruns (repeat banners, event shards) and permanent-tracker additions. */
export function getChampionReruns(): { reruns: RerunRow[]; permanent: RerunRow[] } {
  const refs = heroRefs()
  const reruns: RerunRow[] = []
  const permanent: RerunRow[] = []
  for (const c of data.champions) {
    const earliest = [...c.facts].sort((a, b) => a.date.localeCompare(b.date))[0]
    for (const f of c.facts) {
      if (f.type !== 'rerun' && f.type !== 'permanent-pool') continue
      const row: RerunRow = { champion: refs.get(c.id) ?? { id: c.id, name: c.name }, fact: f }
      if (earliest && earliest !== f) { row.firstDate = earliest.date; row.days = daysBetween(earliest.date, f.date) }
      ;(f.type === 'rerun' ? reruns : permanent).push(row)
    }
  }
  return { reruns: reruns.sort((a, b) => b.fact.date.localeCompare(a.fact.date)), permanent }
}

/** One champion's dated facts (oldest first) plus the events they featured in. Empty when the archive has nothing. */
export function getChampionTimeline(id: string): { facts: Fact[]; events: { id: string; name: string; start: string; isNew: boolean }[] } {
  const facts = [...(data.champions.find((c) => c.id === id)?.facts ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  const events = data.events
    .filter((e) => e.featured?.includes(id) || e.newChampions?.includes(id))
    .map((e) => ({ id: e.id, name: e.name, start: e.start, isNew: !!e.newChampions?.includes(id) }))
    .sort((a, b) => a.start.localeCompare(b.start))
  return { facts, events }
}

export type Observation = { text: string; basis: string }

/**
 * Patterns in the dated facts. Each is stated as what has happened so far, with the numbers
 * it rests on, so the page can label them as observations rather than predictions.
 */
export function getObservations(): Observation[] {
  const out: Observation[] = []
  const themed = data.events.filter((e) => e.kind === 'themed' && e.start.length === 10).sort((a, b) => a.start.localeCompare(b.start))

  // Unbroken run of months with a themed event, ending at the latest one.
  const months = [...new Set(themed.map((e) => e.start.slice(0, 7)))].sort()
  let run = 1
  for (let i = months.length - 1; i > 0; i--) {
    const [y, m] = months[i].split('-').map(Number)
    const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
    if (months[i - 1] !== prev) break
    run++
  }
  const runStart = months[months.length - run]
  const runEvents = themed.filter((e) => e.start.slice(0, 7) >= runStart)
  const days = runEvents.map((e) => +e.start.slice(8))
  if (run >= 3) {
    out.push({
      text: `There has been a themed event every month since ${formatDate(runStart)}, usually starting in the middle or second half of the month.`,
      basis: `${run} months in a row; start days ranged from the ${Math.min(...days)}th to the ${Math.max(...days)}th.`,
    })
  }

  // New-champion cadence over the latest 12 months.
  const firsts = data.champions
    .map((c) => c.facts.filter((f) => f.type === 'revealed' || f.type === 'event-debut').sort((a, b) => a.date.localeCompare(b.date))[0])
    .filter((f): f is Fact => !!f)
    .map((f) => f.date)
    .sort()
  if (firsts.length > 3) {
    const latest = firsts[firsts.length - 1]
    const recent = firsts.filter((d) => daysBetween(d, latest) <= 365)
    const gaps = recent.slice(1).map((d, i) => daysBetween(recent[i], d)).filter((g) => g > 0)
    if (gaps.length > 2) {
      out.push({
        text: `A new champion has been revealed about every ${Math.round(median(gaps) / 7)} weeks over the last year.`,
        basis: `${recent.length} new champions between ${formatDate(recent[0])} and ${formatDate(latest)}; median gap ${median(gaps)} days.`,
      })
    }
  }

  // Event-only champions joining the regular pool.
  const joined = data.champions
    .map((c) => {
      const debut = c.facts.find((f) => f.type === 'event-debut')
      const std = c.facts.find((f) => f.type === 'standard')
      return debut && std ? `${c.name} after ${daysBetween(debut.date, std.date)} days` : null
    })
    .filter(Boolean)
  if (joined.length) {
    out.push({
      text: 'Regular Mythics that debuted in an event joined the Bleed and Mother Boxes within a month.',
      basis: `${joined.join('; ')}. Limited and Iconic event champions (Wonder Woman Death Metal, Batman Death Metal, Supergirl Woman of Tomorrow) did not.`,
    })
  }

  for (const o of data.observations) {
    const evs = o.events.map((id) => data.events.find((e) => e.id === id)).filter((e): e is EventRow => !!e)
    out.push({ text: o.text, basis: evs.map((e) => `${e.name} (${formatDate(e.start)})`).join(', ') })
  }
  return out
}

/** Latest dated fact anywhere in the file (the page's "covers up to" date). */
export function getLatestFactDate(): string {
  const dates = [
    ...data.events.map((e) => e.start), ...data.champions.flatMap((c) => c.facts.map((f) => f.date)),
    ...data.bleedRules.map((r) => r.date), ...data.devStatements.map((r) => r.date),
  ].filter((d) => d.length === 10)
  return dates.sort().pop() ?? ''
}
