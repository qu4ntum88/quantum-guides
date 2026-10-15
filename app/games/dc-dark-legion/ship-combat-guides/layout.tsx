import { pageMeta } from '@/src/lib/seo'

// The planner page is a client component, so its metadata lives here.
export const metadata = pageMeta({
  title: 'DC: Dark Legion Battle for Gotham Planner',
  description:
    'Free interactive Battle for Gotham and Ultimate Battle for Gotham map planner for DC: Dark Legion. Place up to 100 league bases, group them by squad, link them to City Hall and armories, and export or share the layout.',
  path: '/games/dc-dark-legion/ship-combat-guides',
})

export default function ShipCombatLayout({ children }: { children: React.ReactNode }) {
  return children
}
