import { getResolvedHeros, getResolvedLegacy } from '@/src/dcdl/lib/data'
import { getBaseSkins, CALC_STAT } from '@/src/dcdl/lib/base-skins'
import accountData from '@/src/dcdl/data/game/account-bonuses.json'
import type { AccountData } from '@/src/dcdl/lib/account-bonuses'
import type { RosterChampion, BuilderSkin } from '@/src/dcdl/components/account/AccountBuilder'
import MembersClient from './MembersClient'

export default function MembersPage() {
  const resolved = getResolvedHeros()
  const heroes = resolved.map((h) => ({ id: h.id, name: h.name, image: h.imageHeadshot }))
  const legacyPieces = getResolvedLegacy().map((l) => ({ id: l.id, name: l.name, image: l.image }))

  // The DC: Dark Legion account editor (src/dcdl/components/account).
  const data = accountData as unknown as AccountData
  const champions: RosterChampion[] = resolved
    .filter((h) => data.champions[h.id])
    .map((h) => ({ id: h.id, name: h.name, img: h.imageHeadshot ?? null, rarity: h.rarity ?? '', className: h.class ?? '', globalName: h.globalSkill?.name ?? null }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const skins: BuilderSkin[] = getBaseSkins().map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    owned: s.owned.filter((b) => CALC_STAT[b.key]).map((b) => ({ stat: CALC_STAT[b.key], value: b.value })),
  }))

  return <MembersClient heroes={heroes} legacyPieces={legacyPieces} account={{ data, champions, skins }} />
}
