import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

const mementosPath = path.join(process.cwd(), 'src/dcdl/data/mementos.json')
const imgDir = path.join(process.cwd(), 'public/dcdl/mementos/mementos_images')

function notProd() {
  return process.env.NODE_ENV === 'production'
    ? NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    : null
}

export async function GET() {
  const guard = notProd(); if (guard) return guard
  const data = JSON.parse(fs.readFileSync(mementosPath, 'utf8'))
  return NextResponse.json(data.map((m: { id: string; name: string }) => ({ id: m.id, name: m.name })))
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
  const description = fd.get('description') as string
  const rarity = fd.get('rarity') as string
  const collection = fd.get('collection') as string
  const availability = fd.get('availability') as string

  const items: Record<string, unknown>[] = JSON.parse(fs.readFileSync(mementosPath, 'utf8'))
  const idx = items.findIndex((m) => (m as { id: string }).id === id)

  if (!isEdit && idx !== -1) return NextResponse.json({ error: `"${id}" already exists. Use edit mode.` }, { status: 409 })
  if (isEdit && idx === -1) return NextResponse.json({ error: `"${id}" not found.` }, { status: 404 })

  const existing = isEdit ? items[idx] as Record<string, unknown> : {}
  const imgFile = fd.get('image') as File | null
  let image = existing.image as string | undefined
  if (imgFile?.size) {
    const buffer = Buffer.from(await imgFile.arrayBuffer())
    fs.writeFileSync(path.join(imgDir, imgFile.name), buffer)
    image = './mementos_images/' + imgFile.name
  }

  const item: Record<string, unknown> = {
    id, name,
    ...(description && { description }),
    ...(rarity && { rarity }),
    ...(collection && { collection }),
    ...(availability && { availability }),
    ...(image && { image }),
  }

  if (isEdit) items[idx] = item; else items.push(item)
  fs.writeFileSync(mementosPath, JSON.stringify(items, null, 2))
  return NextResponse.json({ success: true, item })
}
