import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE  = path.join(process.cwd(), 'src/vh/data/hunters.json')
const IMG_DIR    = path.join(process.cwd(), 'public/vh/portraits')
const FULL_DIR   = path.join(process.cwd(), 'public/vh/full')
const SKILL_DIR  = path.join(process.cwd(), 'public/vh/skills')

type SkillEntry = {
  order: number
  name: string
  level: string
  type: string
  cooldown: number | null
  tags: string[]
  description: string
  upgrades: string[]
  image: string | null
}

type AwakenRow  = { stars: number; bonuses: string[] }
type SkillEnhance = { stars: number; skill: string; type: string; effect: string }

type BonusBreakdown = {
  awaken?: AwakenRow[]
  super_awaken?: AwakenRow[]
  super_awaken_skill_enhance?: SkillEnhance[]
}

export type Hunter = {
  id: string
  name: string
  portrait: string
  fullArt: string | null
  rarity: string
  class: string[]
  homeland: string[]
  species: string[]
  other: string[]
  title?: string
  power?: number
  stats?: { attack: number; defense: number; health: number; speed: number }
  bio?: string[]
  skills?: SkillEntry[]
  bonus_breakdown?: BonusBreakdown | null
}

function readHunters(): Hunter[] {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) } catch { return [] }
}

async function saveFile(dir: string, file: File): Promise<string> {
  fs.mkdirSync(dir, { recursive: true })
  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  fs.writeFileSync(path.join(dir, filename), Buffer.from(await file.arrayBuffer()))
  return filename
}

export async function GET() {
  return NextResponse.json(readHunters())
}

export async function POST(req: NextRequest) {
  return upsert(req, false)
}

export async function PATCH(req: NextRequest) {
  return upsert(req, true)
}

async function upsert(req: NextRequest, editing: boolean) {
  const fd = await req.formData()
  const id   = (fd.get('id')   as string)?.trim()
  const name = (fd.get('name') as string)?.trim()
  if (!id || !name) return NextResponse.json({ error: 'id and name are required' }, { status: 400 })

  const hunters     = readHunters()
  const existingIdx = hunters.findIndex((h) => h.id === id)
  const existing    = existingIdx >= 0 ? hunters[existingIdx] : null

  // Portrait
  let portrait = existing?.portrait ?? ''
  const portraitFile = fd.get('portrait') as File | null
  if (portraitFile && portraitFile.size > 0) {
    portrait = `/vh/portraits/${await saveFile(IMG_DIR, portraitFile)}`
  }

  // Full art
  let fullArt = existing?.fullArt ?? null
  const fullArtFile = fd.get('fullArt') as File | null
  if (fullArtFile && fullArtFile.size > 0) {
    fullArt = `/vh/full/${await saveFile(FULL_DIR, fullArtFile)}`
  }

  // Skills — stored as JSON string in formData
  let skills: SkillEntry[] = existing?.skills ?? []
  const skillsJson = fd.get('skills') as string | null
  if (skillsJson) {
    const parsed: SkillEntry[] = JSON.parse(skillsJson)
    // Handle per-skill image uploads: field name = skill_image_<order>
    for (const skill of parsed) {
      const skillImg = fd.get(`skill_image_${skill.order}`) as File | null
      if (skillImg && skillImg.size > 0) {
        skill.image = `/vh/skills/${await saveFile(SKILL_DIR, skillImg)}`
      } else {
        // Preserve existing image if not replaced
        const oldSkill = existing?.skills?.find((s) => s.order === skill.order)
        skill.image = skill.image ?? oldSkill?.image ?? null
      }
    }
    skills = parsed
  }

  // Bonus breakdown
  let bonus_breakdown: BonusBreakdown | null = existing?.bonus_breakdown ?? null
  const bdJson = fd.get('bonus_breakdown') as string | null
  if (bdJson) {
    bonus_breakdown = JSON.parse(bdJson)
  }

  // Stats
  const statsJson = fd.get('stats') as string | null
  const stats = statsJson
    ? JSON.parse(statsJson)
    : (existing?.stats ?? undefined)

  // Bio
  const bioJson = fd.get('bio') as string | null
  const bio = bioJson
    ? JSON.parse(bioJson)
    : (existing?.bio ?? undefined)

  const hunter: Hunter = {
    id,
    name,
    portrait,
    fullArt,
    rarity:   (fd.get('rarity') as string) ?? '',
    class:    fd.getAll('class')    as string[],
    homeland: fd.getAll('homeland') as string[],
    species:  fd.getAll('species')  as string[],
    other:    fd.getAll('other')    as string[],
    title:    (fd.get('title') as string | null) ?? existing?.title,
    power:    fd.get('power') ? Number(fd.get('power')) : existing?.power,
    stats,
    bio,
    skills,
    bonus_breakdown,
  }

  if (existingIdx >= 0) {
    hunters[existingIdx] = hunter
  } else {
    if (editing) return NextResponse.json({ error: 'Hunter not found' }, { status: 404 })
    hunters.push(hunter)
  }

  hunters.sort((a, b) => a.name.localeCompare(b.name))
  fs.writeFileSync(DATA_FILE, JSON.stringify(hunters, null, 2), 'utf8')
  return NextResponse.json({ success: true })
}
