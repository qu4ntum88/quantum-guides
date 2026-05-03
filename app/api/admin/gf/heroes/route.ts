import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'src/gf/data/heroes.json')
const FULL_ART_DIR = path.join(process.cwd(), 'public/godforge/gf_heroes/full_art')
const PORTRAIT_DIR = path.join(process.cwd(), 'public/godforge/gf_heroes/portrait')

type GfHero = {
  id: string
  name: string
  fullArt: string
  portrait: string | null
  rarity: string | null
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

function notProd() {
  return process.env.NODE_ENV === 'production'
    ? NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    : null
}

async function saveImage(file: File, dir: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(path.join(dir, file.name), buffer)
  return file.name
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

// POST: add a new hero
export async function POST(req: NextRequest) {
  const guard = notProd()
  if (guard) return guard

  const formData = await req.formData()
  const id = (formData.get('id') as string)?.trim()
  const name = (formData.get('name') as string)?.trim()
  if (!id || !name) return NextResponse.json({ error: 'id and name are required' }, { status: 400 })

  const heroes = readHeroes()
  if (heroes.find((h) => h.id === id)) {
    return NextResponse.json({ error: `Hero "${id}" already exists.` }, { status: 409 })
  }

  const fullArtFile = formData.get('fullArt') as File | null
  const portraitFile = formData.get('portrait') as File | null

  let fullArt = ''
  if (fullArtFile?.size) {
    const filename = await saveImage(fullArtFile, FULL_ART_DIR)
    fullArt = `/godforge/gf_heroes/full_art/${filename}`
  }

  let portrait: string | null = null
  if (portraitFile?.size) {
    const filename = await saveImage(portraitFile, PORTRAIT_DIR)
    portrait = `/godforge/gf_heroes/portrait/${filename}`
  }

  const hero: GfHero = {
    id,
    name,
    fullArt,
    portrait,
    rarity: (formData.get('rarity') as string) || null,
    affinity: (formData.get('affinity') as string) || null,
    allegiance: (formData.get('allegiance') as string) || null,
    archetype: (formData.get('archetype') as string) || null,
    faction: (formData.get('faction') as string) || null,
  }

  heroes.push(hero)
  writeHeroes(heroes)
  return NextResponse.json({ ok: true, hero })
}

// PATCH: update a hero's attributes and optionally upload a new portrait
export async function PATCH(req: NextRequest) {
  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const id = (formData.get('id') as string)?.trim()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const heroes = readHeroes()
    const idx = heroes.findIndex((h) => h.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Hero not found' }, { status: 404 })

    const portraitFile = formData.get('portrait') as File | null
    if (portraitFile?.size) {
      const filename = await saveImage(portraitFile, PORTRAIT_DIR)
      heroes[idx].portrait = `/godforge/gf_heroes/portrait/${filename}`
    }

    const allowed = ['rarity', 'affinity', 'allegiance', 'archetype', 'faction'] as const
    for (const key of allowed) {
      const val = formData.get(key) as string | null
      if (val !== null) heroes[idx][key] = val || null
    }

    writeHeroes(heroes)
    return NextResponse.json({ ok: true, hero: heroes[idx] })
  }

  // JSON fallback (existing behaviour)
  const body = await req.json().catch(() => null)
  if (!body?.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const heroes = readHeroes()
  const idx = heroes.findIndex((h) => h.id === body.id)
  if (idx === -1) return NextResponse.json({ error: 'Hero not found' }, { status: 404 })

  const allowed = ['portrait', 'rarity', 'affinity', 'allegiance', 'archetype', 'faction'] as const
  for (const key of allowed) {
    if (key in body) heroes[idx][key] = body[key] ?? null
  }

  writeHeroes(heroes)
  return NextResponse.json({ ok: true, hero: heroes[idx] })
}
