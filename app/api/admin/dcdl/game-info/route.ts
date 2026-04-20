import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'src/dcdl/data/game-info.json')

export async function GET() {
  try {
    const data = JSON.parse(fs.readFileSync(FILE, 'utf8'))
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ latestServer: '', patchNotes: '', gameCodes: [] })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const data = {
    latestServer: String(body.latestServer ?? ''),
    patchNotes: String(body.patchNotes ?? ''),
    gameCodes: Array.isArray(body.gameCodes) ? body.gameCodes.map(String) : [],
  }
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
  return NextResponse.json({ success: true })
}
