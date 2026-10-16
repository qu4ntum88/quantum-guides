import TierListPage, { tierListDescription, tierListTitle } from '@/src/inv/components/TierListPage'
import { pageMeta } from '@/src/lib/seo'

export const metadata = pageMeta({
  title: tierListTitle('Titan', 'overall'),
  description: tierListDescription('Titan', 'overall'),
  path: '/games/invokers/titan-tier-list',
})

export default function TitanTierListPage() {
  return <TierListPage kind="Titan" listId="overall" />
}
