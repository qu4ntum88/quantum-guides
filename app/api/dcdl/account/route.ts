import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase'
import { normalizeProfile } from '@/src/dcdl/lib/account-bonuses'

// The signed-in member's DCDL Account Profile (src/dcdl/lib/account-profile.ts). The table
// (dcdl_account_profiles) has RLS on and no policies, so this route is the only way in, and
// it only ever touches the caller's own row.

const MAX_BYTES = 64 * 1024

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabaseAdmin.from('dcdl_account_profiles').select('profile, updated_at').eq('user_id', userId).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json(null)
  return NextResponse.json({ profile: data.profile, updatedAt: new Date(data.updated_at).getTime() })
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const text = await req.text()
  if (text.length > MAX_BYTES) return NextResponse.json({ error: 'Profile too large' }, { status: 413 })
  let body: { profile?: Record<string, unknown> }
  try {
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const p = normalizeProfile(body.profile)
  const skins = (body.profile?.baseSkins ?? {}) as { owned?: unknown; equipped?: unknown }
  const owned = Array.isArray(skins.owned) ? skins.owned.filter((x): x is string => typeof x === 'string' && x.length < 80).slice(0, 100) : []
  const equipped = typeof skins.equipped === 'string' && owned.includes(skins.equipped) ? skins.equipped : null
  const updatedAt = p.updatedAt || Date.now()
  const { error } = await supabaseAdmin.from('dcdl_account_profiles').upsert(
    { user_id: userId, profile: { ...p, baseSkins: { owned, equipped } }, updated_at: new Date(updatedAt).toISOString() },
    { onConflict: 'user_id' },
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, updatedAt })
}
