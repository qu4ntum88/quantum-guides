import fs from 'fs'
import path from 'path'
import { getOfficialTiers } from '@/src/dcdl/lib/tier-db'
import { getRoster, type Kind } from './data'
import { TIERS } from './constants'

/**
 * Quantum's own overall Invoker / Titan ranking, on the game's S+…E scale.
 *
 * Saved from the Site Admin's Tier Lists tab into `official_tiers`
 * (entity types `inv_invoker` / `inv_titan`), which wins; the commit hook
 * (pull-tiers.mjs) folds it back into `src/inv/data/quantum-tiers.json` as the
 * fallback. Until Quantum saves one, there is none and the overall board shows
 * the boss-list average from the export instead. The per-boss lists are always
 * the game's own.
 */

export type InvTierType = 'inv_invoker' | 'inv_titan'
export type QuantumTier = { id: string; tier: string }

export const invTierType = (kind: Kind): InvTierType => (kind === 'Titan' ? 'inv_titan' : 'inv_invoker')

function readFallback(type: InvTierType): QuantumTier[] {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/inv/data/quantum-tiers.json'), 'utf8'))
    return Array.isArray(j[type]) ? j[type] : []
  } catch {
    return []
  }
}

/** Quantum's ranking in rank order (tier '' = unranked), or null while none has been saved. */
export async function getQuantumOverall(kind: Kind): Promise<QuantumTier[] | null> {
  const type = invTierType(kind)
  const live = await getOfficialTiers(type)
  if (live) {
    return [...live.entries()]
      .sort((a, b) => a[1].position - b[1].position)
      .map(([id, o]) => ({ id, tier: o.tier }))
  }
  const file = readFallback(type)
  return file.length ? file : null
}

/** Every unit of a kind for the tier editor: Quantum's tier if saved, else seeded from the boss-list average. */
export async function invTierCatalog(kind: Kind) {
  const units = getRoster().filter((u) => u.kind === kind)
  const quantum = await getQuantumOverall(kind)
  const valid = new Set<string>(TIERS)
  const saved = new Map((quantum ?? []).map((q, i) => [q.id, { tier: q.tier, pos: i }]))
  return units
    .map((u) => {
      const s = saved.get(u.slug)
      const seed = u.overall?.tier && valid.has(u.overall.tier) ? u.overall.tier : ''
      return {
        id: u.slug,
        name: u.name,
        img: u.portrait,
        group: (kind === 'Titan' ? u.role : u.class) ?? '',
        tier: s ? s.tier : seed,
        pos: s?.pos ?? Number.MAX_SAFE_INTEGER,
        score: u.overall?.score ?? 0,
      }
    })
    .sort((a, b) => a.pos - b.pos || b.score - a.score || a.name.localeCompare(b.name))
    .map(({ pos: _pos, score: _score, ...item }) => item)
}
