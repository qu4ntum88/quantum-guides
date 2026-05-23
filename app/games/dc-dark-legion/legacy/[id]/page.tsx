import { permanentRedirect } from 'next/navigation'
import { getResolvedLegacy } from '@/src/dcdl/lib/data'

export function generateStaticParams() {
  return getResolvedLegacy().map((l) => ({ id: l.id }))
}

export default async function LegacyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  permanentRedirect(`/games/dc-dark-legion/legacy/community-tier#${id}`)
}
