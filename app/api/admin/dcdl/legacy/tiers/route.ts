import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

const legacyPath = path.join(process.cwd(), 'src/dcdl/data/legacy.json')

function notProd() {
  return process.env.NODE_ENV === 'production'
    ? NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    : null
}

function resolveImage(raw?: string) {
  if (!raw) return null
  return raw.replace(/^\.\/legacy_images\//, '/dcdl/legacy/legacy_images/')
}

export async function GET() {
  const guard = notProd(); if (guard) return guard
  const items = JSON.parse(fs.readFileSync(legacyPath, 'utf8')) as Record<string, unknown>[]
  return NextResponse.json(items.map((l) => ({
    id: l.id,
    name: l.name,
    tier: (l.tier as string | undefined) ?? '',
    image: resolveImage(l.image as string | undefined),
  })))
}

export async function PATCH(req: NextRequest) {
  const guard = notProd(); if (guard) return guard
  const { updates } = await req.json() as { updates: { id: string; tier: string }[] }
  const items = JSON.parse(fs.readFileSync(legacyPath, 'utf8')) as Record<string, unknown>[]
  const updateMap = new Map(updates.map((u) => [u.id, u.tier]))

  for (const item of items) {
    const id = item.id as string
    if (!updateMap.has(id)) continue
    const newTier = updateMap.get(id)!
    const oldTier = (item.tier as string | undefined) ?? ''
    if (newTier === oldTier) continue
    if (oldTier && newTier) {
      item.previousTier = oldTier
    }
    if (newTier) {
      item.tier = newTier
    } else {
      delete item.tier
    }
  }

  fs.writeFileSync(legacyPath, JSON.stringify(items, null, 2))
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const guard = notProd(); if (guard) return guard
  const items = JSON.parse(fs.readFileSync(legacyPath, 'utf8')) as Record<string, unknown>[]
  for (const item of items) delete item.previousTier
  fs.writeFileSync(legacyPath, JSON.stringify(items, null, 2))
  return NextResponse.json({ ok: true })
}
