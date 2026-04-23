import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'src/dcdl/data/best-teams.json')

type Team = {
  rank: number
  explanation: string
  required: string[]
  optional: string[]
}

function readTeams(): Team[] {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) } catch { return [] }
}

export async function GET() {
  return NextResponse.json(readTeams())
}

export async function POST(req: NextRequest) {
  const teams: Team[] = await req.json()
  if (!Array.isArray(teams) || teams.length !== 10) {
    return NextResponse.json({ error: 'Expected array of 10 teams' }, { status: 400 })
  }
  const validated = teams.map((t, i) => ({
    rank: i + 1,
    explanation: String(t.explanation ?? ''),
    required: (t.required ?? []).filter(Boolean).slice(0, 5),
    optional: (t.optional ?? []).filter(Boolean).slice(0, 5),
  }))
  fs.writeFileSync(DATA_FILE, JSON.stringify(validated, null, 2), 'utf8')
  return NextResponse.json({ success: true })
}
