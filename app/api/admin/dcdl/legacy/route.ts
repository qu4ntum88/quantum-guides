import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

const legacyPath = path.join(process.cwd(), 'src/dcdl/data/legacy.json')
const imgDir = path.join(process.cwd(), 'public/dcdl/legacy/legacy_images')
const skillImgDir = path.join(process.cwd(), 'public/dcdl/legacy/legacy_images_skills')

function notProd() {
  return process.env.NODE_ENV === 'production'
    ? NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    : null
}

async function saveFile(file: File, dir: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(path.join(dir, file.name), buffer)
  return file.name
}

export async function GET() {
  const guard = notProd(); if (guard) return guard
  const data = JSON.parse(fs.readFileSync(legacyPath, 'utf8'))
  return NextResponse.json(data.map((l: { id: string; name: string }) => ({ id: l.id, name: l.name })))
}

export async function POST(req: NextRequest) {
  const guard = notProd(); if (guard) return guard
  return handleSave(req, false)
}

export async function PATCH(req: NextRequest) {
  const guard = notProd(); if (guard) return guard
  return handleSave(req, true)
}

async function handleSave(req: NextRequest, isEdit: boolean) {
  const fd = await req.formData()
  const id = fd.get('id') as string
  const name = fd.get('name') as string
  const rank = fd.get('rank') as string
  const tier = fd.get('tier') as string
  const role = fd.get('role') as string
  const unique = fd.get('unique') === 'true'
  const gearEffects = fd.get('gearEffects') as string
  const skillCount = parseInt(fd.get('skillCount') as string ?? '0')

  const items: Record<string, unknown>[] = JSON.parse(fs.readFileSync(legacyPath, 'utf8'))
  const idx = items.findIndex((l) => (l as { id: string }).id === id)

  if (!isEdit && idx !== -1) return NextResponse.json({ error: `"${id}" already exists. Use edit mode.` }, { status: 409 })
  if (isEdit && idx === -1) return NextResponse.json({ error: `"${id}" not found.` }, { status: 404 })

  const existing = isEdit ? items[idx] as Record<string, unknown> : {}

  const imgFile = fd.get('image') as File | null
  const image = imgFile?.size
    ? './legacy_images/' + await saveFile(imgFile, imgDir)
    : (existing.image as string | undefined)

  // Skills
  const existingSkills = (existing.legacySkills as { name: string; description: string; image?: string }[] | undefined) ?? []
  const legacySkills = []
  for (let i = 0; i < skillCount; i++) {
    const sName = fd.get(`skill_${i}_name`) as string
    const sDesc = fd.get(`skill_${i}_description`) as string
    if (!sName) continue
    const sImg = fd.get(`skill_${i}_image`) as File | null
    const existingImg = existingSkills[i]?.image
    const img = sImg?.size ? './legacy_images_skills/' + await saveFile(sImg, skillImgDir) : existingImg
    legacySkills.push({ name: sName, description: sDesc ?? '', ...(img ? { image: img } : {}) })
  }

  const item: Record<string, unknown> = {
    id, name,
    ...(image && { image }),
    ...(rank && { rank }),
    unique,
    ...(tier && { tier }),
    ...(role && { role }),
    ...(gearEffects && { gearEffects: gearEffects.split('\n').map((s) => s.trim()).filter(Boolean) }),
    ...(legacySkills.length > 0 && { legacySkills }),
  }

  if (isEdit) items[idx] = item; else items.push(item)
  fs.writeFileSync(legacyPath, JSON.stringify(items, null, 2))
  return NextResponse.json({ success: true, item })
}
