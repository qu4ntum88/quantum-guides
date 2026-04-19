import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

const herosPath = path.join(process.cwd(), 'src/dcdl/data/heros.json')

const dirs: Record<string, string> = {
  headshot: path.join(process.cwd(), 'public/dcdl/heros/headshot_images'),
  full: path.join(process.cwd(), 'public/dcdl/heros/full_images'),
  skill: path.join(process.cwd(), 'public/dcdl/heros/skill_images'),
  globalskill: path.join(process.cwd(), 'public/dcdl/heros/globalskill_images'),
  upgrade: path.join(process.cwd(), 'public/dcdl/heros/upgrade_images'),
}

const prefixes: Record<string, string> = {
  headshot: './headshot_images/',
  full: './full_images/',
  skill: './skill_images/',
  globalskill: './globalskill_images/',
  upgrade: './upgrade_images/',
}

async function saveFile(file: File, type: keyof typeof dirs): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = file.name
  fs.writeFileSync(path.join(dirs[type], filename), buffer)
  return prefixes[type] + filename
}

function parseSkills(formData: FormData, prefix: string, imageType: string, count: number) {
  const result = []
  for (let i = 0; i < count; i++) {
    const name = formData.get(`${prefix}_${i}_name`) as string
    const description = formData.get(`${prefix}_${i}_description`) as string
    if (!name && !description) continue
    result.push({ name: name ?? '', description: description ?? '', image: `__${prefix}_${i}_image__` })
  }
  return result
}

function notProd() {
  return process.env.NODE_ENV === 'production'
    ? NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    : null
}

export async function GET() {
  const guard = notProd()
  if (guard) return guard
  const heros = JSON.parse(fs.readFileSync(herosPath, 'utf8'))
  return NextResponse.json(heros.map((h: { id: string; name: string }) => ({ id: h.id, name: h.name })))
}

export async function POST(req: NextRequest) {
  const guard = notProd()
  if (guard) return guard
  return handleSave(req, false)
}

export async function PATCH(req: NextRequest) {
  const guard = notProd()
  if (guard) return guard
  return handleSave(req, true)
}

async function handleSave(req: NextRequest, isEdit: boolean) {
  const formData = await req.formData()

  const name = formData.get('name') as string
  const id = formData.get('id') as string
  const heroClass = formData.get('class') as string
  const rarity = formData.get('rarity') as string
  const tier = formData.get('tier') as string
  const damageType = formData.get('damageType') as string
  const quantumsTake = formData.get('quantumsTake') as string
  const tagSynergies = formData.getAll('tagSynergies') as string[]
  const gameModes = formData.getAll('gameModes') as string[]
  const sources = formData.get('sourcesWhereAvailable') as string
  const transmute = formData.get('transmutePriorities') as string
  const legacyPieces = formData.getAll('recommendedLegacyPieces') as string[]
  const skillCount = parseInt(formData.get('skillCount') as string ?? '0')
  const upgradeCount = parseInt(formData.get('upgradeCount') as string ?? '0')

  const heros: Record<string, unknown>[] = JSON.parse(fs.readFileSync(herosPath, 'utf8'))
  const existingIdx = heros.findIndex((h) => (h as { id: string }).id === id)

  if (!isEdit && existingIdx !== -1) {
    return NextResponse.json({ error: `Champion "${id}" already exists. Use edit mode.` }, { status: 409 })
  }
  if (isEdit && existingIdx === -1) {
    return NextResponse.json({ error: `Champion "${id}" not found.` }, { status: 404 })
  }

  const existing = isEdit ? (heros[existingIdx] as Record<string, unknown>) : {}

  // Images
  const headshotFile = formData.get('imageHeadshot') as File | null
  const fullFile = formData.get('imageFull') as File | null
  const ultimateImageFile = formData.get('ultimateImage') as File | null
  const globalSkillImageFile = formData.get('globalSkillImage') as File | null

  const imageHeadshot = headshotFile?.size
    ? await saveFile(headshotFile, 'headshot')
    : (existing.imageHeadshot as string | undefined)

  const imageFull = fullFile?.size
    ? await saveFile(fullFile, 'full')
    : (existing.imageFull as string | undefined)

  // Ultimate
  const ultimateName = formData.get('ultimateName') as string
  const ultimateDesc = formData.get('ultimateDescription') as string
  let ultimateImagePath = ((existing.ultimate as Record<string, string> | undefined)?.image)
  if (ultimateImageFile?.size) ultimateImagePath = await saveFile(ultimateImageFile, 'skill')
  const ultimate = ultimateName
    ? { name: ultimateName, description: ultimateDesc ?? '', ...(ultimateImagePath ? { image: ultimateImagePath } : {}) }
    : undefined

  // Global skill
  const globalSkillName = formData.get('globalSkillName') as string
  const globalSkillDesc = formData.get('globalSkillDescription') as string
  let globalSkillImagePath = ((existing.globalSkill as Record<string, string> | undefined)?.image)
  if (globalSkillImageFile?.size) globalSkillImagePath = await saveFile(globalSkillImageFile, 'globalskill')
  const globalSkill = globalSkillName
    ? { name: globalSkillName, description: globalSkillDesc ?? '', ...(globalSkillImagePath ? { image: globalSkillImagePath } : {}) }
    : undefined

  // Skills array
  const existingSkills = (existing.skills as { name: string; description: string; image?: string }[] | undefined) ?? []
  const skills = []
  for (let i = 0; i < skillCount; i++) {
    const sName = formData.get(`skill_${i}_name`) as string
    const sDesc = formData.get(`skill_${i}_description`) as string
    if (!sName) continue
    const imgFile = formData.get(`skill_${i}_image`) as File | null
    const existingImg = existingSkills[i]?.image
    const img = imgFile?.size ? await saveFile(imgFile, 'skill') : existingImg
    skills.push({ name: sName, description: sDesc ?? '', ...(img ? { image: img } : {}) })
  }

  // Upgrades array
  const existingUpgrades = (existing.upgrades as { name: string; description: string; image?: string }[] | undefined) ?? []
  const upgrades = []
  for (let i = 0; i < upgradeCount; i++) {
    const uName = formData.get(`upgrade_${i}_name`) as string
    const uDesc = formData.get(`upgrade_${i}_description`) as string
    if (!uName) continue
    const imgFile = formData.get(`upgrade_${i}_image`) as File | null
    const existingImg = existingUpgrades[i]?.image
    const img = imgFile?.size ? await saveFile(imgFile, 'upgrade') : existingImg
    upgrades.push({ name: uName, description: uDesc ?? '', ...(img ? { image: img } : {}) })
  }

  const hero: Record<string, unknown> = {
    id,
    name,
    class: heroClass,
    rarity,
    tier,
    ...(damageType && { damageType }),
    ...(tagSynergies.length > 0 && { tagSynergies }),
    ...(gameModes.length > 0 && { gameModes }),
    ...(sources && { sourcesWhereAvailable: sources.split('\n').map((s) => s.trim()).filter(Boolean) }),
    ...(transmute && { transmutePriorities: transmute.split('\n').map((s) => s.trim()).filter(Boolean) }),
    ...(legacyPieces.length > 0 && { recommendedLegacyPieces: legacyPieces }),
    ...(quantumsTake && { quantumsTake }),
    ...(imageHeadshot && { imageHeadshot }),
    ...(imageFull && { imageFull }),
    ...(ultimate && { ultimate }),
    ...(globalSkill && { globalSkill }),
    ...(skills.length > 0 && { skills }),
    ...(upgrades.length > 0 && { upgrades }),
  }

  if (isEdit) {
    heros[existingIdx] = hero
  } else {
    heros.push(hero)
  }

  fs.writeFileSync(herosPath, JSON.stringify(heros, null, 2))
  return NextResponse.json({ success: true, hero })
}
