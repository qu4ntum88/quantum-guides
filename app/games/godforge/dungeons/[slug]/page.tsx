import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'
import '../../game.css'
import DungeonDetail from '@/src/gf/components/DungeonDetail'

type Skill = {
  type: string
  name: string
  description: string
  cooldown?: number | null
  divinity_cost?: number | null
}

type Minion = {
  name: string
  skills: Skill[]
}

type BossData = {
  id: number | null
  name: string
  portrait_url: string | null
  skills?: Skill[]
  phases?: { label: string; skills: Skill[] }[]
  minions: Minion[]
}

type DungeonMeta = {
  id: number
  name: string
  slug: string
  type: 'ascension_dungeon' | 'equipment_dungeon'
  affinity: string | null
  stage_count: number
  image_url: string
  boss: BossData
}

type HeroSlot = {
  position: number
  enemy_level: number
  star_rank: number
  hero: {
    id: number
    name: string
    portrait_url: string | null
    rarity: string
  }
}

type Wave = {
  id: number
  wave_number: number
  is_boss_wave: boolean
  name: string | null
  slots: HeroSlot[]
}

type RewardDrop = {
  type: string
  amount: number
  chance_pct: number
}

type RewardGuaranteed = {
  type: string
  amount: number
}

type Stage = {
  id: number
  stage_number: number
  energy_cost: number
  is_boss_stage: boolean
  boss: { id: number; name: string; portrait_url: string | null } | null
  wave_count: number
  waves: Wave[]
  reward_summary: {
    drops: RewardDrop[]
    guaranteed: RewardGuaranteed[]
  }
}

type RewardIcon = { name: string; icon_url: string | null }

type GfHero = {
  id: string
  name: string
  portrait: string | null
  rarity: string | null
}

type DungeonRecRaw = { hero_id: string; writeup: string }

type DungeonRecEnriched = DungeonRecRaw & {
  hero_name: string
  portrait_url: string | null
  rarity: string | null
}

function getDungeons(): DungeonMeta[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/gf/data/dungeons.json'), 'utf8'))
  } catch { return [] }
}

function getStages(slug: string): { stages: Stage[]; reward_icons: Record<string, RewardIcon> } {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/gf/data/dungeon-stages.json'), 'utf8'))
    return data.dungeons[slug] ?? { stages: [], reward_icons: {} }
  } catch { return { stages: [], reward_icons: {} } }
}

function getRecommendations(slug: string): DungeonRecEnriched[] {
  try {
    const heroes: GfHero[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/gf/data/heroes.json'), 'utf8'))
    const heroMap = new Map(heroes.map((h) => [h.id, h]))
    const recs: Record<string, DungeonRecRaw[]> = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/gf/data/dungeon-recommendations.json'), 'utf8')
    )
    return (recs[slug] ?? []).map((rec) => {
      const hero = heroMap.get(rec.hero_id)
      return {
        ...rec,
        hero_name: hero?.name ?? 'Unknown Hero',
        portrait_url: hero?.portrait ?? null,
        rarity: hero?.rarity ?? null,
      }
    })
  } catch { return [] }
}

export async function generateStaticParams() {
  const dungeons = getDungeons()
  return dungeons.map(d => ({ slug: d.slug }))
}

export default async function DungeonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const dungeons = getDungeons()
  const dungeon = dungeons.find(d => d.slug === slug)
  if (!dungeon) notFound()

  const { stages, reward_icons } = getStages(slug)
  const recommendations = getRecommendations(slug)

  return (
    <main style={{ '--game-accent': '#a855f7' } as React.CSSProperties}>
      <DungeonDetail dungeon={dungeon} stages={stages} reward_icons={reward_icons} recommendations={recommendations} />
    </main>
  )
}
