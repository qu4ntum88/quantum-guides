import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'src/gf/data/heroes.json')

type GfHero = {
  id: string
  name: string
  fullArt: string
  affinity: string | null
  allegiance: string | null
  archetype: string | null
  faction: string | null
}

function readHeroes(): GfHero[] {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) } catch { return [] }
}

function writeHeroes(heroes: GfHero[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(heroes, null, 2))
}

// GET: list all heroes (id + name) or a single hero by ?id=
export async function GET(req: NextRequest) {
  const heroes = readHeroes()
  const id = req.nextUrl.searchParams.get('id')
  if (id) {
    const hero = heroes.find((h) => h.id === id)
    if (!hero) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(hero)
  }
  return NextResponse.json(heroes.map((h) => ({ id: h.id, name: h.name })))
}

// PATCH: update a hero's affinity, allegiance, archetype, faction
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const heroes = readHeroes()
  const idx = heroes.findIndex((h) => h.id === body.id)
  if (idx === -1) return NextResponse.json({ error: 'Hero not found' }, { status: 404 })

  const allowed = ['affinity', 'allegiance', 'archetype', 'faction'] as const
  for (const key of allowed) {
    if (key in body) heroes[idx][key] = body[key] ?? null
  }

  writeHeroes(heroes)
  return NextResponse.json({ ok: true, hero: heroes[idx] })
}
