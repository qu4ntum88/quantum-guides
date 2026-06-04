import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

const herosPath = path.join(process.cwd(), 'src/dcdl/data/heros.json')

function notProd() {
  return process.env.NODE_ENV === 'production'
    ? NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    : null
}

function resolveHeadshot(raw?: string) {
  if (!raw) return null
  return raw.replace(/^\.\/headshot_images\//, '/dcdl/heros/headshot_images/')
}

export async function GET() {
  const guard = notProd(); if (guard) return guard
  const heros = JSON.parse(fs.readFileSync(herosPath, 'utf8')) as Record<string, unknown>[]
  return NextResponse.json(heros.map((h) => ({
    id: h.id,
    name: h.name,
    tier: (h.tier as string | undefined) ?? '',
    imageHeadshot: resolveHeadshot(h.imageHeadshot as string | undefined),
  })))
}

export async function PATCH(req: NextRequest) {
  const guard = notProd(); if (guard) return guard
  const { updates } = await req.json() as { updates: { id: string; tier: string }[] }
  const heros = JSON.parse(fs.readFileSync(herosPath, 'utf8')) as Record<string, unknown>[]
  const updateMap = new Map(updates.map((u) => [u.id, u.tier]))

  for (const hero of heros) {
    const id = hero.id as string
    if (!updateMap.has(id)) continue
    const newTier = updateMap.get(id)!
    const oldTier = (hero.tier as string | undefined) ?? ''
    if (newTier === oldTier) continue
    if (oldTier && newTier) {
      hero.previousTier = oldTier
    }
    if (newTier) {
      hero.tier = newTier
    } else {
      delete hero.tier
    }
  }

  fs.writeFileSync(herosPath, JSON.stringify(heros, null, 2))
  return NextResponse.json({ ok: true })
}
