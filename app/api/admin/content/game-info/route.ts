import { NextRequest, NextResponse } from 'next/server'
import { getIsAdmin } from '@/src/lib/adminAuth'
import { supabaseAdmin } from '@/src/lib/supabase'
import { GUIDE_GAMES, toGuideGame } from '@/src/lib/guide-games'

// Admin-only read/update for a game's game_info row (latest server, active
// game codes). One row per game, keyed by `game`; the integer id is fixed per
// game (its position in GUIDE_GAMES, DCDL = 1, the original singleton row).
const rowId = (game: string) => GUIDE_GAMES.findIndex((g) => g.id === game) + 1

async function guard() {
  if (!(await getIsAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}

export async function GET(req: NextRequest) {
  const denied = await guard()
  if (denied) return denied
  const game = toGuideGame(req.nextUrl.searchParams.get('game'))
  const { data, error } = await supabaseAdmin.from('game_info').select('*').eq('game', game).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(
    data ?? { id: rowId(game), game, latest_server: '', patch_notes: '', game_codes: [] },
  )
}

export async function PUT(req: NextRequest) {
  const denied = await guard()
  if (denied) return denied
  const b = await req.json()
  // Patch notes now live in their own dated `patch_notes` table, so this route
  // only manages the server + game codes and leaves game_info.patch_notes as an
  // untouched fallback (omitting it from the upsert preserves the column).
  const game = toGuideGame(b.game)
  const row = {
    id: rowId(game),
    game,
    latest_server: String(b.latestServer ?? ''),
    game_codes: Array.isArray(b.gameCodes) ? b.gameCodes.map(String).filter(Boolean) : [],
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabaseAdmin.from('game_info').upsert(row, { onConflict: 'game' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
