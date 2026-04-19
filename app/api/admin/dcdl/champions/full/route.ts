import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }
  const id = req.nextUrl.searchParams.get('id')
  const heros = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/dcdl/data/heros.json'), 'utf8'))
  const hero = heros.find((h: { id: string }) => h.id === id)
  if (!hero) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(hero)
}
