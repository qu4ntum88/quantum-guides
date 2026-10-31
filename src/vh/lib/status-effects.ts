import type { StatusEffect } from '@/src/vh/components/StatusEffectBox'
import fileEffects from '@/src/vh/data/status-effects.json'

/**
 * Read layer for Void Hunters status effects. The base is `src/vh/data/status-effects.json`
 * (written by scripts/sync-vh-status-effects.mjs); an entry with `hidden: true` there is never
 * shown. On top of that, Quantum can take any effect offline, put it back, or replace its name
 * or text from Site Admin → Void Hunters → Status Effects, stored in the Supabase table
 * `vh_status_effect_overrides` (RLS on, no policies: rows can carry text for effects that
 * aren't public yet, so it is only read here, server-side, with the service key).
 *
 * An override row's `hidden` wins over the file; with no row, the file decides. If Supabase
 * can't be reached the file alone decides, so the file's `hidden` flags are the safe fallback.
 * Hidden effects are dropped here, before anything is handed to a client component, so their
 * text never reaches the browser.
 */

export type FileStatusEffect = StatusEffect & { hidden?: boolean }

export type StatusEffectOverride = {
  effect_id: string
  hidden: boolean | null
  name: string | null
  description: string | null
  updated_at: string
}

export const VH_EFFECTS_TAG = 'vh-status-effects'

/** Every entry in the file, hidden ones included (admin use). */
export function readStatusEffectFile(): FileStatusEffect[] {
  return fileEffects as FileStatusEffect[]
}

export async function getStatusEffectOverrides(): Promise<StatusEffectOverride[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return []
  try {
    const res = await fetch(`${url}/rest/v1/vh_status_effect_overrides?select=effect_id,hidden,name,description,updated_at`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 60, tags: [VH_EFFECTS_TAG] },
    })
    if (!res.ok) return []
    return (await res.json()) as StatusEffectOverride[]
  } catch {
    return []
  }
}

/** File entry + override, with the effective `hidden`. */
export function applyOverride(e: FileStatusEffect, o: StatusEffectOverride | undefined): FileStatusEffect {
  return {
    ...e,
    name: o?.name?.trim() || e.name,
    description: o?.description ?? e.description,
    hidden: o?.hidden ?? e.hidden ?? false,
  }
}

/** The effects the public site may show. */
export async function getStatusEffects(): Promise<StatusEffect[]> {
  const overrides = new Map((await getStatusEffectOverrides()).map((o) => [o.effect_id, o]))
  return readStatusEffectFile()
    .map((e) => applyOverride(e, overrides.get(e.id)))
    .filter((e) => !e.hidden)
    .map(({ hidden: _hidden, ...e }) => e)
}
