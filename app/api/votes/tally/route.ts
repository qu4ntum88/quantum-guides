import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase'

const RATINGS = ['S+', 'S', 'A+', 'A', 'B', 'C', 'D']

type TallyEntry = { 'S+': number; S: number; 'A+': number; A: number; B: number; C: number; D: number; winner: string; total: number }

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type')
  if (!type) return NextResponse.json({ error: 'Missing type' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('votes')
    .select('entity_id, rating')
    .eq('entity_type', type)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const tally: Record<string, TallyEntry> = {}
  for (const row of data ?? []) {
    if (!tally[row.entity_id]) {
      tally[row.entity_id] = { 'S+': 0, S: 0, 'A+': 0, A: 0, B: 0, C: 0, D: 0, winner: '', total: 0 }
    }
    const entry = tally[row.entity_id]
    const r = row.rating as keyof Omit<TallyEntry, 'winner' | 'total'>
    entry[r] = (entry[r] ?? 0) + 1
    entry.total += 1
  }

  for (const id of Object.keys(tally)) {
    let best = ''
    let bestCount = 0
    for (const r of RATINGS) {
      const count = tally[id][r as keyof TallyEntry] as number
      if (count > bestCount) { bestCount = count; best = r }
    }
    tally[id].winner = best
  }

  return NextResponse.json(tally)
}
