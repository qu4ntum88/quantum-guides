import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

const DATA_FILE = path.join(process.cwd(), 'src/gf/data/heroes.json')

type GfHeroRaw = {
  id: string
  name: string
  fullArt: string
  portrait: string | null
  rarity: string | null
  archetype: string | null
  gfTier?: string
  gfTierColumn?: string
  [key: string]: unknown
}

function read(): GfHeroRaw[] {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) } catch { return [] }
}

function notProd() {
  return process.env.NODE_ENV === 'production'
    ? NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    : null
}

export async function GET() {
  const guard = notProd(); if (guard) return guard
  const heroes = read()
  return NextResponse.json(
    heroes
      .filter((h) => h.rarity === 'Rare' || h.rarity === 'Epic' || h.rarity === 'Legendary')
      .map((h) => ({
        id: h.id,
        name: h.name,
        rarity: h.rarity,
        archetype: h.archetype,
        portrait: h.portrait,
        fullArt: h.fullArt,
        gfTier: h.gfTier ?? '',
        gfTierColumn: h.gfTierColumn ?? '',
      }))
  )
}

export async function PATCH(req: NextRequest) {
  const guard = notProd(); if (guard) return guard
  const { updates } = await req.json() as { updates: { id: string; gfTier: string; gfTierColumn: string }[] }
  const heroes = read()
  const updateMap = new Map(updates.map((u) => [u.id, u]))

  for (const hero of heroes) {
    const upd = updateMap.get(hero.id)
    if (!upd) continue
    if (upd.gfTier) {
      hero.gfTier = upd.gfTier
      hero.gfTierColumn = upd.gfTierColumn
    } else {
      delete hero.gfTier
      delete hero.gfTierColumn
    }
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(heroes, null, 2))
  return NextResponse.json({ ok: true })
}
