import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getGuide, getGuidesFull } from '@/src/dcdl/lib/content-db'
import { renderGuideBody } from '@/src/dcdl/lib/guide-render'
import GuideBody from '@/src/dcdl/components/guide/GuideBody'
import JsonLd from '@/app/components/JsonLd'
import { pageMeta, articleLd, breadcrumbLd, DCDL_CRUMB } from '@/src/lib/seo'
import '../../../godforge/game.css'

// Read published guides from Supabase (with a file fallback); refresh at most
// once a minute so editor changes appear without a redeploy. Guides created
// after build time render on-demand (dynamicParams defaults to true).
// Only DCDL guides live here: getGuide() defaults to game 'dcdl', so another
// game's guide id 404s at this URL.
export const revalidate = 60

export async function generateStaticParams() {
  const guides = await getGuidesFull()
  return guides.map((g) => ({ id: g.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const guide = await getGuide(id)
  if (!guide) return {}
  return pageMeta({
    title: /dark legion/i.test(guide.title) ? guide.title : `${guide.title}: DC: Dark Legion Guide`,
    description: guide.description || `${guide.title}, a DC: Dark Legion guide by ${guide.author || 'Quantum'}.`,
    path: `/games/dc-dark-legion/guides/${guide.id}`,
    // opengraph-image.tsx builds the share card; the cover is hero art for under the title.
    image: false,
    type: 'article',
  })
}

export default async function GuideDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const guide = await getGuide(id)
  if (!guide) return notFound()

  const { html, headings } = await renderGuideBody(guide.body)
  const { coverImage, title, tags, pubDate, author } = guide

  return (
    <main style={{ '--game-accent': 'var(--gold)' } as React.CSSProperties}>
      <JsonLd
        data={[
          breadcrumbLd([DCDL_CRUMB, [guide.title, `/games/dc-dark-legion/guides/${guide.id}`]]),
          articleLd({
            title: guide.title,
            description: guide.description,
            path: `/games/dc-dark-legion/guides/${guide.id}`,
            image: guide.coverImage,
            author: guide.author,
            published: guide.pubDate,
          }),
        ]}
      />

      {/* ── Hero header ─────────────────────────────────────────────────────── */}
      <section className="gh-hero">
        {coverImage && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${coverImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.55,
            zIndex: 0,
          }} />
        )}
        <div className="container">
          {tags.length > 0 && (
            <span className="gh-overline">{tags[0]}</span>
          )}
          {title && (
            <h1 className="gh-hero-title" style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)' }}>
              {title}
            </h1>
          )}
          {(pubDate || author) && (
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
              {pubDate && (
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                  {pubDate}
                </span>
              )}
              {author && (
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                  by {author}
                </span>
              )}
            </div>
          )}
          <div className="gh-hero-divider" />
          <div className="gh-hero-back">
            <Link href="/games/dc-dark-legion/guides" className="btn">← Back to Guides</Link>
          </div>
        </div>
      </section>

      <GuideBody guide={guide} html={html} headings={headings} />
    </main>
  )
}
