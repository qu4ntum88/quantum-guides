import raw from '../data/base-skins.json'
import notesRaw from '../data/base-skins-notes.json'

/**
 * Read layer for the DC: Dark Legion Base Skins page (/games/dc-dark-legion/base-skins).
 *
 * base-skins.json is written by scripts/sync-dcdl-base-skins.mjs (stats, art, and the official
 * post each skin was released in; released skins only). base-skins-notes.json is Quantum's:
 * his take and any extra "how to get" text per skin id, edited in Site Admin → DC: Dark
 * Legion → Base Skins. The sync never touches the notes file.
 */

export type SkinBonus = { key: string; stat: string; value: number; pct: boolean }
export type SkinRelease = {
  event?: string | null
  available?: string | null
  postTitle?: string
  postedAt?: string
  postId?: string
  confirmedInGame?: boolean
}
type RawSkin = {
  id: string
  name: string
  order: number
  quality: string
  owned: SkinBonus[]
  equipped: SkinBonus[]
  ownedPowerPct: number
  equippedPowerPct: number
  icon: string | null
  banner: string | null
  release: SkinRelease
}
export type SkinNote = { take?: string; howToGet?: string }
export type BaseSkinNotes = { confirmedInGame: string[]; skins: Record<string, SkinNote> }
export type BaseSkin = RawSkin & SkinNote

const data = raw as { skins: RawSkin[] }
const notes = notesRaw as BaseSkinNotes

/** Released skins, newest first. */
export function getBaseSkins(): BaseSkin[] {
  return [...data.skins]
    .sort((a, b) => b.order - a.order)
    .map((s) => ({ ...s, ...notes.skins[s.id] }))
}

/** Every owned bonus added up by stat, in the order the stats first appear (oldest skin first). */
export function getOwnedTotals(skins: Pick<BaseSkin, 'order' | 'owned'>[]): SkinBonus[] {
  const totals = new Map<string, SkinBonus>()
  for (const s of [...skins].sort((a, b) => a.order - b.order)) {
    for (const b of s.owned) {
      const t = totals.get(b.key)
      if (t) t.value = Math.round((t.value + b.value) * 100) / 100
      else totals.set(b.key, { ...b })
    }
  }
  return [...totals.values()]
}

/**
 * Skin stat → the champion Stat Calculator's stat name. These are the game's "Tech" percent
 * stats, which sit in the same additive bucket as Force % bonuses:
 * (base) × (1 + star%) × (1 + Force% + gear% + tech%). Stats not listed here don't change
 * the four base stats.
 */
export const CALC_STAT: Record<string, string> = {
  HpTechRatio: 'HP',
  AtkTechRatio: 'ATK',
  DefTechRatio: 'P. DEF',
  FortTechRatio: 'S. DEF',
}

export const formatBonus =(b: SkinBonus) => `+${b.value.toLocaleString('en-US')}${b.pct ? '%' : ''}`

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
/** "October 2026" from the release post's date. */
export function releaseMonth(r: SkinRelease): string | null {
  const m = r.postedAt?.match(/^(\d{4})-(\d{2})/)
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : null
}
