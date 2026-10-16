import TierListPage, { tierListDescription, tierListTitle } from '@/src/inv/components/TierListPage'
import { getTierLists } from '@/src/inv/lib/data'
import { tierListPath } from '@/src/inv/lib/constants'
import { pageMeta } from '@/src/lib/seo'

export const dynamicParams = false

export function generateStaticParams() {
  return getTierLists('Titan').map((l) => ({ boss: l.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ boss: string }> }) {
  const { boss } = await params
  return pageMeta({
    title: tierListTitle('Titan', boss),
    description: tierListDescription('Titan', boss),
    path: tierListPath('Titan', boss),
  })
}

export default async function TitanBossTierListPage({ params }: { params: Promise<{ boss: string }> }) {
  const { boss } = await params
  return <TierListPage kind="Titan" listId={boss} />
}
