import TierListPage, { tierListDescription, tierListTitle } from '@/src/inv/components/TierListPage'
import { pageMeta } from '@/src/lib/seo'

// Quantum's overall ranking is read from Supabase (official_tiers); refresh like the other tier lists.
export const revalidate = 60

export const metadata = pageMeta({
  title: tierListTitle('Titan', 'overall'),
  description: tierListDescription('Titan', 'overall'),
  path: '/games/invokers/titan-tier-list',
})

export default function TitanTierListPage() {
  return <TierListPage kind="Titan" listId="overall" />
}
