import TierListPage, { tierListDescription, tierListTitle } from '@/src/inv/components/TierListPage'
import { getTierLists } from '@/src/inv/lib/data'
import { tierListPath } from '@/src/inv/lib/constants'
import { pageMeta } from '@/src/lib/seo'

export const dynamicParams = false

export function generateStaticParams() {
  return getTierLists('Invoker').map((l) => ({ boss: l.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ boss: string }> }) {
  const { boss } = await params
  return pageMeta({
    title: tierListTitle('Invoker', boss),
    description: tierListDescription('Invoker', boss),
    path: tierListPath('Invoker', boss),
  })
}

export default async function InvokerBossTierListPage({ params }: { params: Promise<{ boss: string }> }) {
  const { boss } = await params
  return <TierListPage kind="Invoker" listId={boss} />
}
