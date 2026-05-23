import { getResolvedHeros, getResolvedLegacy } from '@/src/dcdl/lib/data'
import MembersClient from './MembersClient'

export default function MembersPage() {
  const heroes = getResolvedHeros().map((h) => ({ id: h.id, name: h.name, image: h.imageHeadshot }))
  const legacyPieces = getResolvedLegacy().map((l) => ({ id: l.id, name: l.name, image: l.image }))

  return <MembersClient heroes={heroes} legacyPieces={legacyPieces} />
}
