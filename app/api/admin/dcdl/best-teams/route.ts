import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'src/dcdl/data/best-teams.json')

type ReplacementRow = {
  required: string
  replacements: string[]
}

type Team = {
  rank: number
  name?: string
  explanation: string
  required: string[]
  optional: string[]
  replacements?: ReplacementRow[]
}

function readTeams(): Team[] {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) } catch { return [] }
}

// Required is a positional 5-slot array: indices 0-1 = Frontline, 2-4 = Backline.
// Empty string = a FLEX slot. Duplicates are collapsed to empty (first wins).
function normalizeRequired(raw: unknown): string[] {
  const arr = Array.isArray(raw) ? raw.map((x) => (typeof x === 'string' ? x : '')) : []
  const padded = [...arr, '', '', '', '', ''].slice(0, 5)
  const seen = new Set<string>()
  return padded.map((id) => {
    if (!id || seen.has(id)) return ''
    seen.add(id)
    return id
  })
}

export async function GET() {
  return NextResponse.json(readTeams())
}

export async function POST(req: NextRequest) {
  const teams: Team[] = await req.json()
  if (!Array.isArray(teams) || teams.length < 1 || teams.length > 50) {
    return NextResponse.json({ error: 'Expected between 1 and 50 teams' }, { status: 400 })
  }
  const validated = teams.map((t, i) => {
    const required = normalizeRequired(t.required)
    const filled = required.filter(Boolean)
    // Optional champions only allowed while required has an open (FLEX) slot; no count cap.
    const optional = filled.length >= 5
      ? []
      : Array.from(new Set((t.optional ?? []).filter(Boolean)))
    const replacements = (t.replacements ?? [])
      .map((r) => ({
        required: String(r.required ?? ''),
        replacements: Array.from(new Set((r.replacements ?? []).filter(Boolean))),
      }))
      .filter((r) => r.required && filled.includes(r.required) && r.replacements.length > 0)
    return { rank: i + 1, name: String(t.name ?? '').trim(), explanation: String(t.explanation ?? ''), required, optional, replacements }
  })
  fs.writeFileSync(DATA_FILE, JSON.stringify(validated, null, 2), 'utf8')
  return NextResponse.json({ success: true })
}
