import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'src/vh/data/status-effects.json')
const IMG_DIR = path.join(process.cwd(), 'public/vh/status-effects')

export type StatusEffect = {
  id: string
  name: string
  image: string
  description: string
}

function readEffects(): StatusEffect[] {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) } catch { return [] }
}

export async function GET() {
  return NextResponse.json(readEffects())
}

export async function POST(req: NextRequest) {
  return upsert(req, false)
}

export async function PATCH(req: NextRequest) {
  return upsert(req, true)
}

async function upsert(req: NextRequest, editing: boolean) {
  const fd = await req.formData()
  const id = (fd.get('id') as string)?.trim()
  const name = (fd.get('name') as string)?.trim()
  if (!id || !name) return NextResponse.json({ error: 'id and name are required' }, { status: 400 })

  const effects = readEffects()
  const existingIdx = effects.findIndex((e) => e.id === id)
  const existing = existingIdx >= 0 ? effects[existingIdx] : null

  let image = existing?.image ?? ''
  const imgFile = fd.get('image') as File | null
  if (imgFile && imgFile.size > 0) {
    fs.mkdirSync(IMG_DIR, { recursive: true })
    const filename = imgFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    fs.writeFileSync(path.join(IMG_DIR, filename), Buffer.from(await imgFile.arrayBuffer()))
    image = `/vh/status-effects/${filename}`
  }

  const effect: StatusEffect = {
    id,
    name,
    image,
    description: (fd.get('description') as string) ?? '',
  }

  if (existingIdx >= 0) {
    effects[existingIdx] = effect
  } else {
    if (editing) return NextResponse.json({ error: 'Status effect not found' }, { status: 404 })
    effects.push(effect)
  }

  effects.sort((a, b) => a.name.localeCompare(b.name))
  fs.writeFileSync(DATA_FILE, JSON.stringify(effects, null, 2), 'utf8')
  return NextResponse.json({ success: true })
}
