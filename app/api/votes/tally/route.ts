import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase'

const RATINGS = ['S+', 'S', 'A+', 'A', 'B', 'C', 'D']

const POINTS: Record<string, number> = { 'S+': 7, S: 6, 'A+': 5, A: 4, B: 3, C: 2, D: 1 }

// Midpoint boundaries: avg >= 6.5 → S+, >= 5.5 → S, etc.
function scoreToTier(avg: number): string {
  if (avg >= 6.5) return 'S+'
  if (avg >= 5.5) return 'S'
  if (avg >= 4.5) return 'A+'
  if (avg >= 3.5) return 'A'
  if (avg >= 2.5) return 'B'
  if (avg >= 1.5) return 'C'
  return 'D'
}

export type TallyEntry = {
  'S+': number; S: number; 'A+': number; A: number; B: number; C: number; D: number
  winner: string; total: number; weightedAvg: number
}

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
      tally[row.entity_id] = { 'S+': 0, S: 0, 'A+': 0, A: 0, B: 0, C: 0, D: 0, winner: '', total: 0, weightedAvg: 0 }
    }
    const entry = tally[row.entity_id]
    const r = row.rating as keyof Omit<TallyEntry, 'winner' | 'total' | 'weightedAvg'>
    entry[r] = (entry[r] ?? 0) + 1
    entry.total += 1
  }

  for (const id of Object.keys(tally)) {
    const entry = tally[id]
    let totalPoints = 0
    for (const r of RATINGS) {
      totalPoints += (entry[r as keyof TallyEntry] as number) * POINTS[r]
    }
    const avg = entry.total > 0 ? totalPoints / entry.total : 0
    entry.weightedAvg = Math.round(avg * 100) / 100
    entry.winner = entry.total > 0 ? scoreToTier(avg) : ''
  }

  return NextResponse.json(tally)
}
