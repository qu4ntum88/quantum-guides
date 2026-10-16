import { notFound } from 'next/navigation'
import UnitPage, { unitSummary } from '@/src/inv/components/UnitPage'
import { getRoster, getUnit } from '@/src/inv/lib/data'
import { unitPath } from '@/src/inv/lib/constants'
import { pageMeta } from '@/src/lib/seo'

export const dynamicParams = false

export function generateStaticParams() {
  return getRoster()
    .filter((r) => r.kind === 'Invoker')
    .map((r) => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const u = getUnit('Invoker', slug)
  if (!u) return {}
  return pageMeta({
    title: `${u.name} Guide: Skills, Stats & Tier – Invokers: Titan Legacy`,
    description: unitSummary(u).slice(0, 300),
    path: unitPath('Invoker', slug),
    image: u.fullArt,
    type: 'article',
  })
}

export default async function InvokerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const unit = getUnit('Invoker', slug)
  if (!unit) notFound()
  return <UnitPage unit={unit} />
}
