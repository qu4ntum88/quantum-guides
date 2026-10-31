import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { supabaseAdmin } from '@/src/lib/supabase'
import { requireRole } from '@/src/lib/roles-server'
import { applyOverride, readStatusEffectFile, VH_EFFECTS_TAG, type StatusEffectOverride } from '@/src/vh/lib/status-effects'
import hunters from '@/src/vh/data/hunters.json'

/**
 * Void Hunters status effects: take one offline, put it back, or replace its name / text,
 * without a deploy. Rows live in `vh_status_effect_overrides` (see src/vh/lib/status-effects.ts);
 * the file (status-effects.json) stays the base. Admin only, LIVE: works on the deployed site.
 * Every save refreshes the status effects page and the hunter pages right away.
 */

async function guard() {
  return (await requireRole('admin')) ? null : NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

const hunterNames: Record<string, string> = Object.fromEntries((hunters as { id: string; name: string }[]).map((h) => [h.id, h.name]))

function refreshPages() {
  revalidateTag(VH_EFFECTS_TAG, { expire: 0 })
  revalidatePath('/games/void-hunters/status-effects')
  revalidatePath('/games/void-hunters/hunters/[id]', 'page')
}

async function loadOverrides() {
  const { data, error } = await supabaseAdmin
    .from('vh_status_effect_overrides')
    .select('effect_id, hidden, name, description, updated_at')
  return { rows: (data ?? []) as StatusEffectOverride[], error }
}

// GET — every effect in the file, with its override (if any) and what the site shows now.
export async function GET() {
  const denied = await guard()
  if (denied) return denied
  const { rows, error } = await loadOverrides()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const byId = new Map(rows.map((r) => [r.effect_id, r]))
  return NextResponse.json({
    effects: readStatusEffectFile().map((e) => {
      const o = byId.get(e.id)
      const live = applyOverride(e, o)
      return {
        id: e.id,
        image: e.image,
        name: live.name,
        description: live.description,
        hidden: !!live.hidden,
        unique: !!e.unique,
        hunters: (e.hunters ?? []).map((id) => hunterNames[id] ?? id),
        file: { name: e.name, description: e.description, hidden: !!e.hidden },
        override: o ?? null,
      }
    }),
  })
}

// PATCH { id, hidden?, name?, description? } — null clears that field back to the file's value.
export async function PATCH(req: NextRequest) {
  const viewer = await requireRole('admin')
  if (!viewer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const id = typeof b.id === 'string' ? b.id : ''
  if (!readStatusEffectFile().some((e) => e.id === id)) return NextResponse.json({ error: 'Unknown effect' }, { status: 400 })

  const { data: current } = await supabaseAdmin
    .from('vh_status_effect_overrides')
    .select('hidden, name, description')
    .eq('effect_id', id)
    .maybeSingle()
  const next = { hidden: current?.hidden ?? null, name: current?.name ?? null, description: current?.description ?? null }
  if (b.hidden !== undefined) next.hidden = typeof b.hidden === 'boolean' ? b.hidden : null
  if (b.name !== undefined) next.name = typeof b.name === 'string' && b.name.trim() ? b.name.trim().slice(0, 80) : null
  if (b.description !== undefined) next.description = typeof b.description === 'string' ? b.description.slice(0, 4000) : null

  // Nothing left to override: drop the row so the file decides again.
  const { error } = next.hidden === null && next.name === null && next.description === null
    ? await supabaseAdmin.from('vh_status_effect_overrides').delete().eq('effect_id', id)
    : await supabaseAdmin.from('vh_status_effect_overrides').upsert({
        effect_id: id, ...next, updated_at: new Date().toISOString(), updated_by: viewer.userId,
      })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  refreshPages()
  return NextResponse.json({ ok: true })
}
