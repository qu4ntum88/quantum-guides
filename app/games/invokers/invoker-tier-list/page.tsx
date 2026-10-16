import TierListPage, { tierListDescription, tierListTitle } from '@/src/inv/components/TierListPage'
import { pageMeta } from '@/src/lib/seo'

export const metadata = pageMeta({
  title: tierListTitle('Invoker', 'overall'),
  description: tierListDescription('Invoker', 'overall'),
  path: '/games/invokers/invoker-tier-list',
})

export default function InvokerTierListPage() {
  return <TierListPage kind="Invoker" listId="overall" />
}
