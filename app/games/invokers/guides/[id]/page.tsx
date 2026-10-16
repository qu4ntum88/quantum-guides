import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getGuide, getGuidesFull } from '@/src/dcdl/lib/content-db'
import { renderGuideBody } from '@/src/dcdl/lib/guide-render'
import GuideBody from '@/src/dcdl/components/guide/GuideBody'
import WorldHero from '@/src/qgg/components/WorldHero'
import JsonLd from '@/app/components/JsonLd'
import { articleLd, breadcrumbLd, INV_CRUMB, pageMeta } from '@/src/lib/seo'
import { guidePath } from '@/src/lib/guide-games'

// CMS guides with game = 'invokers' (written in /admin/content or the Studio).
// Same Supabase-first read and 60s refresh as the DCDL guide pages; guides
// published after the deploy render on demand.
export const revalidate = 60

export async function generateStaticParams() {
  const guides = await getGuidesFull('invokers')
  return guides.map((g) => ({ id: g.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const guide = await getGuide(id, 'invokers')
  if (!guide) return {}
  return pageMeta({
    title: /invokers/i.test(guide.title) ? guide.title : `${guide.title}: Invokers Guide`,
    description: guide.description || `${guide.title}, an Invokers: Titan Legacy guide by ${guide.author || 'Quantum'}.`,
    path: guidePath('invokers', guide.id),
    image: guide.coverImage,
    type: 'article',
  })
}

export default async function InvokersGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const guide = await getGuide(id, 'invokers')
  if (!guide) return notFound()

  const { html, headings } = await renderGuideBody(guide.body)
  const path = guidePath('invokers', guide.id)
  const byline = [guide.pubDate, guide.author && `by ${guide.author}`].filter(Boolean).join(' · ')

  return (
    // guide-prose and the editor's "Gold" text colour read --gold; use the world's amber.
    <main style={{ '--gold': 'var(--w-accent-2)' } as React.CSSProperties}>
      <JsonLd
        data={[
          breadcrumbLd([INV_CRUMB, [guide.title, path]]),
          articleLd({
            title: guide.title,
            description: guide.description,
            path,
            image: guide.coverImage,
            author: guide.author,
            published: guide.pubDate,
          }),
        ]}
      />
      <WorldHero
        world="invokers"
        overline="Invokers Guide"
        title={guide.title}
        sub={guide.description || undefined}
        note={byline || undefined}
        art={guide.coverImage}
      >
        <Link href="/games/invokers/guides" className="btn">← Invokers Guides</Link>
      </WorldHero>

      <GuideBody guide={guide} html={html} headings={headings} />
    </main>
  )
}
