import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }
  const id = req.nextUrl.searchParams.get('id')
  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/dcdl/data/legacy.json'), 'utf8'))
  const item = data.find((l: { id: string }) => l.id === id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}
