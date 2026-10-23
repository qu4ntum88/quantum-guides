/**
 * The account-wide part of a DCDL champion's stats: Global Skills from the roster, research,
 * league research, gear, the hangar (Apokolips, Firepit Afterburners, ship stars), VIP and room
 * skins. Pure functions over the export written by scripts/sync-dcdl-account-bonuses.mjs
 * (src/dcdl/data/game/account-bonuses.json) and a visitor's AccountProfile (account-profile.ts).
 *
 * Every bonus is a game stat key (Attribute0, e.g. AtkTechRatio) with its raw game value; `stats`
 * in the export says which of the four main stats it feeds and where in the formula it sits
 * (BUPropertyCalculator): (level stat + base) × (1 + star%) × (1 + pct%) + flat. Percent stats
 * are stored ×100 (500 = 5%). Base skins stay in owned-skins.ts and the calculator adds them.
 */

export type StatPair = [string, number]
export type Series = number[] | { start: number; length: number; cycle: number[] }
export type StatInfo = { label: string; calc: string | null; bucket: 'base' | 'pct' | 'flat' | 'star' | 'other'; pct: boolean }
export type GlobalLevel = { star: number; all: StatPair[]; career: StatPair[]; faction: StatPair[] }
export type AccountChampion = {
  gameId: number
  mythicPlus: boolean
  class: string | null
  armor: string | null
  factions: string[]
  globalSkill: { careerClass: string | null; faction: string | null; levels: GlobalLevel[] } | null
  upgradeOf?: string
}
/** x / y: column and row in the in-game tree; pre: nodes that must be researched first. */
export type TreeNode = { id: number; name: string; tier: number; x: number; y: number; pre: number[]; class: string; icon: string | null }
export type ResearchNode = TreeNode & { stat: string; levels: number[] }
export type LeagueNode = TreeNode & { modes: string[]; stats: { stat: string; levels: number[] }[] }
export type GearSlot = { name: string; stats: Record<string, Series>; top: Record<string, number> }
export type AccountData = {
  modes: Record<string, string>
  stats: Record<string, StatInfo>
  factions: Record<string, { name: string; game: number }>
  champions: Record<string, AccountChampion>
  research: ResearchNode[]
  league: LeagueNode[]
  gear: {
    qualities: { key: string; name: string; min: number; max: number; factionBonus: number }[]
    types: Record<string, { name: string; classes: string[]; sets: { name: string; icons: Record<string, string | null> }[]; slots: Record<string, GearSlot> }>
  }
  apokolips: { max: number; flat: Record<string, Series>; milestones: { level: number; stats: StatPair[] }[] }
  afterburners: { maxPartLevel: number; partQuality: [number, string][]; parts: { name: string; stat: string; levels: Series; icon: string | null }[]; maxCount: number; milestones: Record<string, Series> }
  ships: { id: number; name: string; quality: string; icon: string | null; stars: { stats: StatPair[]; skill: { name: string; text: string } | null }[] }[]
  vip: { level: number; points: number; stats: StatPair[] }[]
  rooms: { id: string; name: string; room: string; owned: boolean; icon: string | null; stats: StatPair[] }[]
}

/** What a visitor has. Every field is optional in storage; normalizeProfile fills the gaps. */
export type AccountProfile = {
  v: 1
  updatedAt: number
  /** Champion id → stars (0–25). Listed = owned. */
  roster: Record<string, number>
  /** Personal research node id → level. */
  research: Record<string, number>
  /** League research node id → level. */
  league: Record<string, number>
  /** Gear each champion wears, set on its Stat Calculator: five slots (Helmet, Body Armor, Gloves, Belt, Boots). */
  champGear: Record<string, GearPiece[]>
  vip: number
  apokolips: number
  afterburners: { parts: number[]; count: number }
  /** Ship id → star (1-based). Listed = owned. */
  ships: Record<string, number>
  mainShip: number | null
  rooms: string[]
}

/** One gear piece: level 0 = empty slot; set = index into the armor weight's sets (looks only);
 *  tag = the faction tag rolled on the piece (a faction id), or null. */
export type GearPiece = { level: number; set: number; tag: string | null }

export const GEAR_SLOTS = ['Helmet', 'BodySuit', 'Greaves', 'Belt', 'Boots'] as const
export const MAIN_STATS = ['HP', 'ATK', 'P. DEF', 'S. DEF'] as const
export const emptyGear = (): GearPiece[] => GEAR_SLOTS.map(() => ({ level: 0, set: 0, tag: null }))

export function emptyProfile(): AccountProfile {
  return { v: 1, updatedAt: 0, roster: {}, research: {}, league: {}, champGear: {}, vip: 0, apokolips: 0, afterburners: { parts: [0, 0, 0, 0, 0, 0], count: 0 }, ships: {}, mainShip: null, rooms: [] }
}

function normalizeGear(v: unknown): GearPiece[] {
  const list = Array.isArray(v) ? v : []
  return GEAR_SLOTS.map((_, i) => {
    const g = (list[i] && typeof list[i] === 'object' ? list[i] : {}) as Partial<GearPiece>
    return { level: int(g.level, 0, 500), set: int(g.set, 0, 20), tag: typeof g.tag === 'string' && /^[\w-]{1,60}$/.test(g.tag) ? g.tag : null }
  })
}

const int = (v: unknown, lo: number, hi: number, d = 0) => {
  const n = Math.round(Number(v))
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d
}
const numMap = (v: unknown, hi: number) => {
  const out: Record<string, number> = {}
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v as Record<string, unknown>)) if (/^[\w-]{1,80}$/.test(k)) out[k] = int(x, 0, hi)
  return out
}

/** Coerces anything (old storage, a server row) into a valid profile. */
export function normalizeProfile(raw: unknown): AccountProfile {
  const p = (raw && typeof raw === 'object' ? raw : {}) as Partial<AccountProfile>
  const champGear: Record<string, GearPiece[]> = {}
  if (p.champGear && typeof p.champGear === 'object') {
    for (const [id, g] of Object.entries(p.champGear).slice(0, 200)) if (/^[\w-]{1,80}$/.test(id)) champGear[id] = normalizeGear(g)
  }
  const ab = (p.afterburners ?? {}) as Partial<AccountProfile['afterburners']>
  return {
    v: 1,
    updatedAt: int(p.updatedAt, 0, Number.MAX_SAFE_INTEGER),
    roster: numMap(p.roster, 25),
    research: numMap(p.research, 50),
    league: numMap(p.league, 50),
    champGear,
    vip: int(p.vip, 0, 40),
    apokolips: int(p.apokolips, 0, 20000),
    afterburners: { parts: [0, 1, 2, 3, 4, 5].map((i) => int(ab.parts?.[i], 0, 1000)), count: int(ab.count, 0, 100000) },
    ships: numMap(p.ships, 10),
    mainShip: p.mainShip == null ? null : int(p.mainShip, 0, 1000),
    rooms: Array.isArray(p.rooms) ? p.rooms.filter((x): x is string => typeof x === 'string').slice(0, 50) : [],
  }
}

export const isEmptyProfile = (p: AccountProfile) =>
  !Object.keys(p.roster).length && !Object.keys(p.research).length && !Object.keys(p.league).length && !p.vip && !p.apokolips &&
  !p.afterburners.count && !p.afterburners.parts.some(Boolean) && !Object.keys(p.ships).length && !p.rooms.length

/** Everything at its top level: every champion at 5★ Red, all research, Lv 500 gear, a maxed hangar. */
export function maxedProfile(data: AccountData): AccountProfile {
  const roster: Record<string, number> = {}
  for (const [id, c] of Object.entries(data.champions)) if (!c.mythicPlus || !c.upgradeOf) roster[id] = 25
  for (const [id, c] of Object.entries(data.champions)) if (c.upgradeOf) { roster[id] = 25; delete roster[c.upgradeOf] }
  const top = data.ships.reduce<Record<string, number>>((o, s) => ({ ...o, [s.id]: s.stars.length }), {})
  return {
    v: 1, updatedAt: 0, roster,
    research: Object.fromEntries(data.research.map((n) => [n.id, n.levels.length])),
    league: Object.fromEntries(data.league.map((n) => [n.id, n.stats[0]?.levels.length ?? 0])),
    champGear: {},
    vip: data.vip[data.vip.length - 1]?.level ?? 0,
    apokolips: data.apokolips.max,
    afterburners: { parts: data.afterburners.parts.map(() => data.afterburners.maxPartLevel), count: data.afterburners.maxCount },
    ships: top,
    mainShip: data.ships.find((s) => s.quality === 'Mythic')?.id ?? data.ships[0]?.id ?? null,
    rooms: data.rooms.map((r) => r.id),
  }
}

// ---------- series ----------
const decoded = new WeakMap<object, number[]>()
/** The value of a level series at index i (clamped to its ends). */
export function seriesAt(s: Series, i: number): number {
  if (!Array.isArray(s)) {
    const n = Math.max(0, Math.min(i, s.length - 1))
    const p = s.cycle.length
    const perCycle = s.cycle.reduce((a, b) => a + b, 0)
    let v = s.start + Math.floor(n / p) * perCycle
    for (let k = 0; k < n % p; k++) v += s.cycle[k]
    return v
  }
  let list = decoded.get(s)
  if (!list) {
    list = [s[0]]
    for (let k = 1; k < s.length; k += 2) for (let c = 0; c < s[k + 1]; c++) list.push(list[list.length - 1] + s[k])
    decoded.set(s, list)
  }
  return list[Math.max(0, Math.min(i, list.length - 1))]
}

// ---------- gear ----------
export function qualityOf(data: AccountData, level: number) {
  return data.gear.qualities.find((q) => level >= q.min && level <= q.max) ?? null
}
/** One piece's stats at a gear level (1–400, or 500), before any faction bonus. */
export function gearPieceStats(data: AccountData, armor: string, slot: string, level: number): StatPair[] {
  const s = data.gear.types[armor]?.slots[slot]
  if (!s || level <= 0) return []
  if (level >= 500) return Object.entries(s.top)
  return Object.entries(s.stats).map(([k, ser]): StatPair => [k, seriesAt(ser, Math.min(level, 400) - 1)]).filter(([, v]) => v)
}

/** Whether a piece's faction tag gives its bonus on this champion (tag matches, Orange or better). */
export function tagBonus(data: AccountData, championId: string, piece: GearPiece) {
  const me = data.champions[championId]
  if (!piece.tag || !me?.factions.includes(piece.tag)) return 0
  return qualityOf(data, piece.level)?.factionBonus ?? 0
}

/** The gear a champion wears (set on its Stat Calculator): every piece's stats, ×(1 + bonus) when its tag matches. */
export function gearContribution(data: AccountData, championId: string, pieces: GearPiece[]): Contribution | null {
  const me = data.champions[championId]
  if (!me?.armor) return null
  const stats: StatPair[] = []
  let matched = 0
  GEAR_SLOTS.forEach((slot, i) => {
    const piece = pieces[i]
    if (!piece?.level) return
    const bonus = tagBonus(data, championId, piece)
    if (bonus) matched++
    for (const [k, v] of gearPieceStats(data, me.armor!, slot, piece.level)) stats.push([k, Math.floor(v * (1 + bonus / 100))])
  })
  if (!stats.length) return null
  return { key: 'gear', source: 'Gear', detail: matched ? `${matched} faction-matched` : undefined, stats }
}

// ---------- research trees ----------
/** A node can be picked once every node it needs is picked (as in game). */
export const treeOpen = (n: TreeNode, picked: Record<string, number>) => n.pre.every((p) => (picked[p] ?? 0) > 0)
/** Picks a node at its top level, or clears it and every node that depends on it. */
export function toggleTreeNode<T extends TreeNode>(nodes: T[], picked: Record<string, number>, node: T, top: number): Record<string, number> {
  const out = { ...picked }
  if ((out[node.id] ?? 0) > 0) {
    const drop = [node.id]
    for (let i = 0; i < drop.length; i++) for (const n of nodes) if (n.pre.includes(drop[i]) && !drop.includes(n.id)) drop.push(n.id)
    for (const id of drop) delete out[id]
  } else if (treeOpen(node, out)) out[node.id] = top
  return out
}

// ---------- Firepit Afterburner milestones ----------
/** Milestone stats at a count, and the next count where they change (what the in-game banner shows). */
export function afterburnerMilestone(data: AccountData, count: number) {
  const now = Object.entries(data.afterburners.milestones).map(([k, s]): StatPair => [k, seriesAt(s, count)])
  for (let c = count + 1; c <= data.afterburners.maxCount; c++) {
    const changed = Object.entries(data.afterburners.milestones).map(([k, s]): StatPair => [k, seriesAt(s, c)]).filter(([k, v]) => v !== now.find((x) => x[0] === k)?.[1])
    if (changed.length) return { now, next: { at: c, stats: changed } }
  }
  return { now, next: null }
}
/** The hidden milestone count from the banner "Enhance N more time(s): <stat> +<value>": the count
 *  where that stat first reaches that value, minus N. Null when nothing matches. */
export function afterburnerCountFromBanner(data: AccountData, timesLeft: number, stat: string, value: number) {
  const s = data.afterburners.milestones[stat]
  if (!s) return null
  for (let c = 1; c <= data.afterburners.maxCount; c++) {
    if (seriesAt(s, c) === value && seriesAt(s, c - 1) !== value) {
      const n = c - timesLeft
      return n >= 0 ? n : null
    }
  }
  return null
}
/** Part ring colour (purple / yellow / red) at a level. */
export function partQuality(data: AccountData, level: number) {
  let q = data.afterburners.partQuality[0]?.[1] ?? 'purple'
  for (const [from, name] of data.afterburners.partQuality) if (level >= from) q = name
  return q
}

// ---------- the bonuses ----------
export type Mode = 'normal' | 'Gve' | 'Gvg' | 'AllianceBoss'
export type BonusContext = {
  championId: string
  /** League research only counts in its modes. */
  mode: Mode
  /** The vehicle the champion's squad is on: its star bonus and the Afterburners apply. */
  ship: number | null
}
export type Contribution = {
  key: string
  source: string
  detail?: string
  stats: StatPair[]
  /** In-battle text that isn't a plain stat (a ship's unique skill). */
  note?: string
}

const levelValue = (levels: number[], lv: number) => (lv > 0 ? levels[Math.min(lv, levels.length) - 1] ?? 0 : 0)

/** Global Skill level for a champion at `stars` (0 when not owned). */
export function globalLevel(c: AccountChampion, stars: number | undefined) {
  if (stars == null || !c.globalSkill) return 0
  return c.globalSkill.levels.filter((l) => l.star <= stars).length
}

/** The owned champions whose Global Skills count: a Mythic+ version replaces the champion it was upgraded from. */
export function activeRoster(data: AccountData, roster: Record<string, number>) {
  const out = { ...roster }
  for (const id of Object.keys(roster)) {
    const from = data.champions[id]?.upgradeOf
    if (from) delete out[from]
  }
  return out
}

export function accountContributions(data: AccountData, p: AccountProfile, ctx: BonusContext): Contribution[] {
  const me = data.champions[ctx.championId]
  const out: Contribution[] = []
  const add = (c: Contribution) => { if (c.stats.length || c.note) out.push(c) }

  // Global Skills of every owned champion.
  const roster = activeRoster(data, p.roster)
  const gs: StatPair[] = []
  let count = 0
  for (const [id, stars] of Object.entries(roster)) {
    const c = data.champions[id]
    const lv = c ? globalLevel(c, stars) : 0
    if (!lv || !c.globalSkill) continue
    const l = c.globalSkill.levels[lv - 1]
    const before = gs.length
    gs.push(...l.all)
    if (me && (c.globalSkill.careerClass === 'All' || c.globalSkill.careerClass === me.class)) gs.push(...l.career)
    if (me && c.globalSkill.faction && me.factions.includes(c.globalSkill.faction)) gs.push(...l.faction)
    if (gs.length > before) count++
  }
  add({ key: 'global', source: 'Global Skills', detail: `${count} champion${count === 1 ? '' : 's'}`, stats: gs })

  // Personal research: class nodes for this champion's class plus the all-champion ones.
  const rs: StatPair[] = []
  for (const n of data.research) {
    const lv = p.research[n.id] ?? 0
    if (lv && (n.class === 'All' || n.class === me?.class)) rs.push([n.stat, levelValue(n.levels, lv)])
  }
  add({ key: 'research', source: 'Research', stats: rs })

  if (ctx.mode !== 'normal') {
    const ls: StatPair[] = []
    for (const n of data.league) {
      const lv = p.league[n.id] ?? 0
      if (!lv || !n.modes.includes(ctx.mode) || !(n.class === 'All' || n.class === me?.class)) continue
      for (const s of n.stats) ls.push([s.stat, levelValue(s.levels, lv)])
    }
    add({ key: 'league', source: 'League Research', detail: data.modes[ctx.mode], stats: ls })
  }

  // Apokolips: flat stats at the level plus every milestone reached.
  if (p.apokolips > 0) {
    const ap: StatPair[] = Object.entries(data.apokolips.flat).map(([k, s]): StatPair => [k, seriesAt(s, p.apokolips)])
    for (const m of data.apokolips.milestones) if (m.level <= p.apokolips) ap.push(...m.stats)
    add({ key: 'apokolips', source: 'Apokolips', detail: apokolipsLabel(p.apokolips), stats: ap })
  }

  // The squad's vehicle: its star bonus and the account's Firepit Afterburners.
  const ship = ctx.ship != null ? data.ships.find((s) => s.id === ctx.ship) : null
  if (ship) {
    const star = Math.max(1, Math.min(p.ships[ship.id] ?? 1, ship.stars.length))
    const st = ship.stars[star - 1]
    add({ key: 'ship', source: ship.name, detail: ship.stars.length > 1 ? `${star}★` : undefined, stats: st.stats, note: st.skill ? `${st.skill.name}: ${st.skill.text}` : undefined })
    const ab: StatPair[] = []
    data.afterburners.parts.forEach((part, i) => { const v = seriesAt(part.levels, p.afterburners.parts[i] ?? 0); if (v) ab.push([part.stat, v]) })
    for (const [k, s] of Object.entries(data.afterburners.milestones)) { const v = seriesAt(s, p.afterburners.count); if (v) ab.push([k, v]) }
    add({ key: 'afterburners', source: 'Firepit Afterburners', stats: ab })
  }

  // VIP: each level lists its totals.
  const vip = [...data.vip].reverse().find((v) => v.level <= p.vip && v.stats.length)
  if (vip && p.vip) add({ key: 'vip', source: 'VIP', detail: `VIP ${p.vip}`, stats: vip.stats })

  const rooms = data.rooms.filter((r) => p.rooms.includes(r.id))
  if (rooms.length) add({ key: 'rooms', source: 'Room Skins', detail: rooms.map((r) => r.name).join(', '), stats: rooms.flatMap((r) => r.stats) })

  return out
}

/** Apokolips level as the game shows it: tier I–X (each 1,000 levels) and the tens within it. */
export function apokolipsLabel(level: number) {
  if (level <= 0) return 'Not started'
  const tier = Math.min(10, Math.floor(level / 1000) + 1)
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
  return `${ROMAN[tier - 1]} · ${Math.floor((level % 1000) / 10)}`
}

// ---------- folding into the calculator ----------
export type Buckets = {
  /** Main stat → added before stars / in the % bucket (percent) / after everything. */
  base: Record<string, number>
  pct: Record<string, number>
  flat: Record<string, number>
  /** Other stats by label → { value (percent when pct), pct }. */
  other: Record<string, { value: number; pct: boolean }>
}
export function emptyBuckets(): Buckets {
  return { base: {}, pct: {}, flat: {}, other: {} }
}
/** Adds raw game stats into calculator buckets (percent stats become percents). */
export function addToBuckets(data: AccountData, b: Buckets, pairs: StatPair[]) {
  for (const [k, raw] of pairs) {
    const info = data.stats[k]
    if (!info) continue
    const v = info.pct ? raw / 100 : raw
    if (info.calc && info.bucket !== 'other' && info.bucket !== 'star') {
      const into = b[info.bucket]
      into[info.calc] = (into[info.calc] ?? 0) + v
    } else {
      const o = (b.other[info.label] ??= { value: 0, pct: info.pct })
      o.value += v
    }
  }
  return b
}

/** "ATK +5%", "HP +150": one chip label per stat after adding up a list. */
export function statChips(data: AccountData, pairs: StatPair[]) {
  const totals = new Map<string, { value: number; pct: boolean; order: number }>()
  for (const [k, raw] of pairs) {
    const info = data.stats[k]
    if (!info) continue
    const pct = info.pct
    const label = info.calc ? `${info.calc}${info.bucket === 'base' ? ' (base)' : ''}` : info.label
    const key = `${label}|${pct}`
    const t = totals.get(key) ?? { value: 0, pct, order: MAIN_STATS.indexOf(info.calc as (typeof MAIN_STATS)[number]) }
    t.value += pct ? raw / 100 : raw
    totals.set(key, t)
  }
  return [...totals.entries()]
    .sort((a, b) => (a[1].order < 0 ? 9 : a[1].order) - (b[1].order < 0 ? 9 : b[1].order))
    .map(([key, t]) => `${key.split('|')[0]} +${t.pct ? `${Number(t.value.toFixed(2))}%` : Math.round(t.value).toLocaleString()}`)
}

let loading: Promise<AccountData> | null = null
/** The export, fetched as its own chunk so champion pages only pay for it when the calculator mounts. */
export function loadAccountData(): Promise<AccountData> {
  loading ??= import('../data/game/account-bonuses.json').then((m) => (m.default ?? m) as unknown as AccountData)
  return loading
}
