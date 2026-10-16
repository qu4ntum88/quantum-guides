import { notFound } from 'next/navigation'
import UnitPage, { unitSummary } from '@/src/inv/components/UnitPage'
import { getRoster, getUnit } from '@/src/inv/lib/data'
import { unitPath } from '@/src/inv/lib/constants'
import { pageMeta } from '@/src/lib/seo'

export const dynamicParams = false

export function generateStaticParams() {
  return getRoster()
    .filter((r) => r.kind === 'Titan')
    .map((r) => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const u = getUnit('Titan', slug)
  if (!u) return {}
  return pageMeta({
    title: `${u.name} Titan Guide: Skills & Tier – Invokers: Titan Legacy`,
    description: unitSummary(u).slice(0, 300),
    path: unitPath('Titan', slug),
    image: u.fullArt,
    type: 'article',
  })
}

export default async function TitanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const unit = getUnit('Titan', slug)
  if (!unit) notFound()
  return <UnitPage unit={unit} />
}
