import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase'

const VALID_RATINGS = ['S+', 'S', 'A+', 'A', 'B', 'C', 'D']
const VALID_TYPES = ['champion', 'legacy']

// GET /api/votes?type=champion — returns the current user's votes
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const type = req.nextUrl.searchParams.get('type')
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('votes')
    .select('entity_id, rating')
    .eq('user_id', userId)
    .eq('entity_type', type)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/votes — submit or update a vote
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { entity_type, entity_id, rating } = await req.json()

  if (!VALID_TYPES.includes(entity_type)) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  if (!VALID_RATINGS.includes(rating)) return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
  if (!entity_id) return NextResponse.json({ error: 'Missing entity_id' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('votes')
    .upsert({ user_id: userId, entity_type, entity_id, rating }, { onConflict: 'user_id,entity_type,entity_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
