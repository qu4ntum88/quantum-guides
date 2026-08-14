import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase'
import { requireRole } from '@/src/lib/roles-server'
import { getCatalog, TIERS, type EntityType } from '@/src/dcdl/lib/tier-db'

/**
 * The official (Quantum's) tier list, editable from the live site.
 *
 * Saving writes every ranked item into `official_tiers`, which the public pages
 * prefer over heros.json / legacy.json once it has rows. Tier movement arrows
 * work the same way as the local panel: when an item moves between two real
 * tiers, its old tier is recorded as `previous_tier`.
 */

async function guard() {
  return (await requireRole('admin')) ? null : NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

function parseType(v: string | null): EntityType {
  return v === 'legacy' ? 'legacy' : 'champion'
}

const VALID_TIERS = new Set<string>(TIERS)

// GET ?type=champion|legacy — the catalog with current tiers, for the editor.
export async function GET(req: NextRequest) {
  const denied = await guard()
  if (denied) return denied
  const type = parseType(req.nextUrl.searchParams.get('type'))
  return NextResponse.json(await getCatalog(type))
}

// PATCH — save the whole assignment for one entity type.
export async function PATCH(req: NextRequest) {
  const denied = await guard()
  if (denied) return denied

  const b = await req.json().catch(() => ({}))
  const type = parseType(b.entityType ?? null)
  const assignments = Array.isArray(b.assignments) ? b.assignments : []
  if (assignments.length === 0) {
    return NextResponse.json({ error: 'Nothing to save' }, { status: 400 })
  }

  // Current effective tiers — Supabase rows if they exist, otherwise the JSON —
  // so the first on-site save still produces correct movement arrows.
  const current = new Map((await getCatalog(type)).map((c) => [c.id, c.tier ?? '']))
  const { data: existingRows } = await supabaseAdmin
    .from('official_tiers')
    .select('entity_id, previous_tier')
    .eq('entity_type', type)
  const existingPrev = new Map((existingRows ?? []).map((r) => [r.entity_id as string, (r.previous_tier as string | null) ?? null]))

  const now = new Date().toISOString()
  const rows = assignments.flatMap((a: { id?: unknown; tier?: unknown }, index: number) => {
    const id = String(a.id ?? '')
    if (!id) return []
    const tier = String(a.tier ?? '')
    if (tier && !VALID_TIERS.has(tier)) return []
    const oldTier = current.get(id) ?? ''
    // Moving between two real tiers records the move; anything else keeps
    // whatever arrow was already there.
    const previous = tier && oldTier && tier !== oldTier ? oldTier : (existingPrev.get(id) ?? null)
    return [{
      entity_type: type,
      entity_id: id,
      tier,
      previous_tier: previous,
      position: index,
      updated_at: now,
    }]
  })

  const { error } = await supabaseAdmin
    .from('official_tiers')
    .upsert(rows, { onConflict: 'entity_type,entity_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, saved: rows.length })
}

// DELETE ?type= — clear the tier-movement arrows (same as the local panel's reset).
export async function DELETE(req: NextRequest) {
  const denied = await guard()
  if (denied) return denied
  const type = parseType(req.nextUrl.searchParams.get('type'))
  const { error } = await supabaseAdmin
    .from('official_tiers')
    .update({ previous_tier: null })
    .eq('entity_type', type)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
