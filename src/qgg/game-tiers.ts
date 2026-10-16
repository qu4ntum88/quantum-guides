import { getOfficialTiers } from '@/src/dcdl/lib/tier-db'
import { QUANTUM_TIERS, RARITY_SEED_TIER } from './tiers'

export type GameTierType = 'gf_hero' | 'vh_hunter'

/**
 * Quantum's tier for every unit of a game (Godforge heroes, Void Hunters hunters), with the
 * same Supabase-first / JSON-fallback shape as DC: Dark Legion's official list:
 *   1. a row in `official_tiers` (saved from the Studio editor) wins;
 *   2. otherwise the `tier` field in the game's JSON;
 *   3. otherwise the rarity seed (Legendary → S, Epic → A, Rare → B, Uncommon → C, Common → D).
 * Array order is the within-tier rank, as on the DCDL list.
 */
export async function resolveGameTiers<T extends { id: string; rarity: string | null; tier?: string | null }>(
  type: GameTierType,
  items: T[],
): Promise<(T & { tier: string | null })[]> {
  const overrides = await getOfficialTiers(type)
  const valid = new Set<string>(QUANTUM_TIERS)
  const withTier = items.map((it) => {
    const o = overrides?.get(it.id)
    const tier = o ? o.tier || null : it.tier && valid.has(it.tier) ? it.tier : RARITY_SEED_TIER[it.rarity ?? ''] ?? null
    return { ...it, tier }
  })
  if (!overrides) return withTier
  const pos = (id: string) => overrides.get(id)?.position ?? Number.MAX_SAFE_INTEGER
  return withTier.sort((a, b) => pos(a.id) - pos(b.id))
}
