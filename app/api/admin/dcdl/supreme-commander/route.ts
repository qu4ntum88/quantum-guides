import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { notProd } from '@/src/lib/adminGuard'

const DATA_FILE = path.join(process.cwd(), 'src/dcdl/data/supreme-commander.json')

type PointRow = { item: string; value: number | null }
type PointTable = { label: string; rows: PointRow[] }
type RewardRound = { round: number; eyes: number; points: number }
type RewardTrack = { label: string; rounds: RewardRound[] }
type Day = {
  day: number
  title: string
  pointTable: string | null
  rewardTrack: string | null
  noResources: boolean
  usableItems: string[]
  tips: string[]
}
type ItemReward = { item: string; qty: number }
type Metropolis = {
  milestones: { label: string; description: string; thresholds: number[]; reward: ItemReward[] }
  leagueOutcomes: { label: string; description: string; outcomes: { name: string; rewards: ItemReward[] }[] }
  ranking: { label: string; description: string; tiers: { rank: string; rewards: ItemReward[] }[] }
}
type SupremeCommander = {
  intro: string
  reward: { name: string; icon: string }
  itemIcons?: Record<string, string>
  days: Day[]
  pointTables: Record<string, PointTable>
  rewardTracks: Record<string, RewardTrack>
  metropolis?: Metropolis
}

function readData(): SupremeCommander | null {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) } catch { return null }
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0)
// Point values may be null ("TBD") until the real number is known.
const numOrNull = (v: unknown) => (v === null || v === undefined || v === '' ? null : num(v))

function normalizePointTable(raw: unknown): PointTable {
  const t = (raw ?? {}) as Partial<PointTable>
  return {
    label: str(t.label),
    rows: Array.isArray(t.rows)
      ? t.rows.map((r) => ({ item: str(r?.item), value: numOrNull(r?.value) })).filter((r) => r.item)
      : [],
  }
}

function normalizeRewards(raw: unknown): ItemReward[] {
  return Array.isArray(raw)
    ? raw.map((r) => ({ item: str(r?.item), qty: num(r?.qty) })).filter((r) => r.item)
    : []
}

function normalizeMetropolis(raw: unknown): Metropolis | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const m = raw as Partial<Metropolis>
  return {
    milestones: {
      label: str(m.milestones?.label),
      description: str(m.milestones?.description),
      thresholds: Array.isArray(m.milestones?.thresholds) ? m.milestones!.thresholds.map(num) : [],
      reward: normalizeRewards(m.milestones?.reward),
    },
    leagueOutcomes: {
      label: str(m.leagueOutcomes?.label),
      description: str(m.leagueOutcomes?.description),
      outcomes: Array.isArray(m.leagueOutcomes?.outcomes)
        ? m.leagueOutcomes!.outcomes.map((o) => ({ name: str(o?.name), rewards: normalizeRewards(o?.rewards) }))
        : [],
    },
    ranking: {
      label: str(m.ranking?.label),
      description: str(m.ranking?.description),
      tiers: Array.isArray(m.ranking?.tiers)
        ? m.ranking!.tiers.map((t) => ({ rank: str(t?.rank), rewards: normalizeRewards(t?.rewards) }))
        : [],
    },
  }
}

function normalizeRewardTrack(raw: unknown): RewardTrack {
  const t = (raw ?? {}) as Partial<RewardTrack>
  return {
    label: str(t.label),
    rounds: Array.isArray(t.rounds)
      ? t.rounds.map((r, i) => ({ round: num(r?.round) || i + 1, eyes: num(r?.eyes), points: num(r?.points) }))
      : [],
  }
}

function validate(input: SupremeCommander): SupremeCommander {
  const pointTables = Object.fromEntries(
    Object.entries(input.pointTables ?? {}).map(([k, v]) => [k, normalizePointTable(v)])
  )
  const pointTableKeys = new Set(Object.keys(pointTables))
  const rewardTrackKeys = new Set(Object.keys(input.rewardTracks ?? {}))
  const itemIcons = Object.fromEntries(
    Object.entries(input.itemIcons ?? {})
      .map(([k, v]) => [k, str(v)])
      .filter(([, v]) => v)
  )
  return {
    intro: str(input.intro),
    reward: { name: str(input.reward?.name), icon: str(input.reward?.icon) },
    itemIcons,
    days: (Array.isArray(input.days) ? input.days : []).map((d, i) => {
      const pointTable = str(d?.pointTable) && pointTableKeys.has(str(d?.pointTable)) ? str(d?.pointTable) : null
      const rewardTrack = str(d?.rewardTrack)
      // Only keep usable items that actually exist in the day's assigned point table.
      const tableItems = new Set(pointTable ? pointTables[pointTable].rows.map((r) => r.item) : [])
      const usableItems = Array.isArray(d?.usableItems)
        ? Array.from(new Set(d.usableItems.map(str).filter((it) => tableItems.has(it))))
        : []
      return {
        day: num(d?.day) || i + 1,
        title: str(d?.title),
        pointTable,
        rewardTrack: rewardTrack && rewardTrackKeys.has(rewardTrack) ? rewardTrack : null,
        noResources: Boolean(d?.noResources),
        usableItems,
        tips: Array.isArray(d?.tips) ? d.tips.map(str).filter(Boolean) : [],
      }
    }),
    pointTables,
    rewardTracks: Object.fromEntries(
      Object.entries(input.rewardTracks ?? {}).map(([k, v]) => [k, normalizeRewardTrack(v)])
    ),
    metropolis: normalizeMetropolis(input.metropolis),
  }
}

export async function GET() {
  const guard = notProd()
  if (guard) return guard
  return NextResponse.json(readData())
}

export async function POST(req: NextRequest) {
  const guard = notProd()
  if (guard) return guard
  const body = (await req.json()) as SupremeCommander
  if (!body || typeof body !== 'object' || !Array.isArray(body.days)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(validate(body), null, 2), 'utf8')
  return NextResponse.json({ success: true })
}
