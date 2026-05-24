import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_PATH = path.join(process.cwd(), 'src/dcdl/data/infographics.json')
const IMG_DIR = path.join(process.cwd(), 'public/dcdl/infographics')

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
  } catch {
    return []
  }
}

function writeData(data: unknown[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8')
}

export async function GET() {
  return NextResponse.json(readData())
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || ''
  const credit = (formData.get('credit') as string)?.trim() || ''
  const imageFile = formData.get('image') as File | null

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  const id = `${base}_${Date.now()}`

  let imagePath: string | null = null
  if (imageFile && imageFile.size > 0) {
    const bytes = await imageFile.arrayBuffer()
    fs.mkdirSync(IMG_DIR, { recursive: true })
    const filename = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    fs.writeFileSync(path.join(IMG_DIR, filename), Buffer.from(bytes))
    imagePath = `/dcdl/infographics/${filename}`
  }

  const existing = readData()
  existing.push({ id, title, description, credit, image: imagePath })
  writeData(existing)

  return NextResponse.json({ success: true, id })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const existing = readData()
  const updated = existing.filter((ig: { id: string }) => ig.id !== id)
  writeData(updated)
  return NextResponse.json({ success: true })
}
