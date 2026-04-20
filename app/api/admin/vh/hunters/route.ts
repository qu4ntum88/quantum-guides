import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'src/vh/data/hunters.json')
const IMG_DIR = path.join(process.cwd(), 'public/vh/portraits')

export type Hunter = {
  id: string
  name: string
  portrait: string
  class: string
  homeland: string
  species: string
  other: string[]
}

function readHunters(): Hunter[] {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) } catch { return [] }
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
  const id = (fd.get('id') as string)?.trim()
  const name = (fd.get('name') as string)?.trim()
  if (!id || !name) return NextResponse.json({ error: 'id and name are required' }, { status: 400 })

  const hunters = readHunters()
  const existingIdx = hunters.findIndex((h) => h.id === id)
  const existing = existingIdx >= 0 ? hunters[existingIdx] : null

  let portrait = existing?.portrait ?? ''
  const portraitFile = fd.get('portrait') as File | null
  if (portraitFile && portraitFile.size > 0) {
    fs.mkdirSync(IMG_DIR, { recursive: true })
    const filename = portraitFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    fs.writeFileSync(path.join(IMG_DIR, filename), Buffer.from(await portraitFile.arrayBuffer()))
    portrait = `/vh/portraits/${filename}`
  }

  const hunter: Hunter = {
    id,
    name,
    portrait,
    class: (fd.get('class') as string) ?? '',
    homeland: (fd.get('homeland') as string) ?? '',
    species: (fd.get('species') as string) ?? '',
    other: fd.getAll('other') as string[],
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
