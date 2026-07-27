import { NextRequest, NextResponse } from 'next/server'
import { getIsAdmin } from '@/src/lib/adminAuth'
import { supabaseAdmin } from '@/src/lib/supabase'

// Admin-only read/update for the single-row game_info record
// (latest server, patch notes, active game codes).

async function guard() {
  if (!(await getIsAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}

export async function GET() {
  const denied = await guard()
  if (denied) return denied
  const { data, error } = await supabaseAdmin.from('game_info').select('*').eq('id', 1).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(
    data ?? { id: 1, latest_server: '', patch_notes: '', game_codes: [] },
  )
}

export async function PUT(req: NextRequest) {
  const denied = await guard()
  if (denied) return denied
  const b = await req.json()
  const row = {
    id: 1,
    latest_server: String(b.latestServer ?? ''),
    patch_notes: String(b.patchNotes ?? ''),
    game_codes: Array.isArray(b.gameCodes) ? b.gameCodes.map(String).filter(Boolean) : [],
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabaseAdmin.from('game_info').upsert(row, { onConflict: 'id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
