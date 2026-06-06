import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'src/gf/data/dungeon-recommendations.json')

type Rec = { hero_id: string; writeup: string }
type AllRecs = Record<string, Rec[]>

function read(): AllRecs {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) } catch { return {} }
}

function write(data: AllRecs) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

function notProd() {
  return process.env.NODE_ENV === 'production'
    ? NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    : null
}

export async function GET() {
  return NextResponse.json(read())
}

export async function POST(req: NextRequest) {
  const guard = notProd()
  if (guard) return guard

  const body = await req.json().catch(() => ({}))
  const { slug, hero_id, writeup } = body
  if (!slug || !hero_id || writeup == null) {
    return NextResponse.json({ error: 'slug, hero_id, and writeup are required' }, { status: 400 })
  }

  const data = read()
  if (!data[slug]) data[slug] = []
  if (data[slug].find((r) => r.hero_id === hero_id)) {
    return NextResponse.json({ error: 'Hero already recommended for this dungeon' }, { status: 409 })
  }

  data[slug].push({ hero_id, writeup: writeup.trim() })
  write(data)
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const guard = notProd()
  if (guard) return guard

  const body = await req.json().catch(() => ({}))
  const { slug, hero_id, writeup } = body
  if (!slug || !hero_id || writeup == null) {
    return NextResponse.json({ error: 'slug, hero_id, and writeup are required' }, { status: 400 })
  }

  const data = read()
  const rec = data[slug]?.find((r) => r.hero_id === hero_id)
  if (!rec) return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })

  rec.writeup = writeup.trim()
  write(data)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const guard = notProd()
  if (guard) return guard

  const body = await req.json().catch(() => ({}))
  const { slug, hero_id } = body
  if (!slug || !hero_id) {
    return NextResponse.json({ error: 'slug and hero_id are required' }, { status: 400 })
  }

  const data = read()
  if (!data[slug]) return NextResponse.json({ ok: true })
  data[slug] = data[slug].filter((r) => r.hero_id !== hero_id)
  if (data[slug].length === 0) delete data[slug]
  write(data)
  return NextResponse.json({ ok: true })
}
