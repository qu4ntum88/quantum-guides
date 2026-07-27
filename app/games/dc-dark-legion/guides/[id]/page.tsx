import Link from 'next/link'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import { notFound } from 'next/navigation'
import GuideToc from '../GuideToc'
import { getGuide, getGuidesFull } from '@/src/dcdl/lib/content-db'
import '../../../godforge/game.css'
import '../guide-prose.css'

// Read published guides from Supabase (with a file fallback); refresh at most
// once a minute so editor changes appear without a redeploy. Guides created
// after build time render on-demand (dynamicParams defaults to true).
export const revalidate = 60

export async function generateStaticParams() {
  const guides = await getGuidesFull()
  return guides.map((g) => ({ id: g.id }))
}

function stripAstroSyntax(raw: string): string {
  return raw
    .split('\n')
    .filter((line) => {
      if (line.includes('from "astro:assets"') || line.includes("from 'astro:assets'")) return false
      if (/^import\s+\w+\s+from\s+["']/.test(line)) return false
      return true
    })
    .join('\n')
    .replace(/<Image\s[^/]*/g, (match) => {
      const srcMatch = match.match(/src=\{(\w+)\}/)
      const altMatch = match.match(/alt="([^"]*)"/)
      if (srcMatch) {
        const alt = altMatch ? altMatch[1] : ''
        return `<img src="/dcdl/guides/Infographics/${srcMatch[1]}" alt="${alt}" style="max-width:100%;height:auto"`
      }
      return match
    })
    .replace(/<Image\s/g, '<img ')
}

async function renderMarkdown(content: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(content)
  return String(result)
}

type Heading = { id: string; text: string; level: number }

function extractAndIdHeadings(html: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = []
  const used = new Map<string, number>()

  const processed = html.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/h[23]>/g, (_, tag, attrs, inner) => {
    const level = parseInt(tag[1])
    const text = inner.replace(/<[^>]+>/g, '').trim()
    let base = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-{2,}/g, '-') || 'section'

    const count = used.get(base) ?? 0
    used.set(base, count + 1)
    const id = count === 0 ? base : `${base}-${count}`

    headings.push({ id, text, level })
    return `<${tag}${attrs} id="${id}">${inner}</${tag}>`
  })

  return { html: processed, headings }
}

function processCallouts(html: string): string {
  const LABELS: Record<string, string> = {
    TIP: 'Tip', NOTE: 'Note', WARNING: 'Warning', IMPORTANT: 'Important', F2P: 'F2P',
  }
  return html.replace(
    /<blockquote>\n?<p>\[!(TIP|NOTE|WARNING|IMPORTANT|F2P)\]\n?([\s\S]*?)<\/p>([\s\S]*?)<\/blockquote>/g,
    (_, type, firstParaContent, rest) => {
      const label = LABELS[type] ?? type
      const cls = `callout callout-${type.toLowerCase()}`
      const body = firstParaContent.trim()
        ? `<p>${firstParaContent.trim()}</p>${rest}`
        : rest
      return `<div class="${cls}"><div class="callout-label">${label}</div>${body.trim()}</div>`
    }
  )
}

// ── Event summary box ────────────────────────────────────────────────────────

type FrontmatterData = Record<string, unknown>

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{
        fontFamily: 'Unbounded, sans-serif',
        fontSize: '0.58rem',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--gold)',
        marginBottom: '0.3rem',
        opacity: 0.85,
      }}>
        {label}
      </div>
      <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.82)', lineHeight: 1.5 }}>{value}</div>
    </div>
  )
}

function EventSummaryBox({ data }: { data: FrontmatterData }) {
  const keyRewards = Array.isArray(data.key_rewards) ? (data.key_rewards as string[]) : null

  return (
    <div style={{
      background: 'rgba(204, 164, 83, 0.055)',
      border: '1px solid rgba(204, 164, 83, 0.22)',
      borderTop: '2px solid rgba(204, 164, 83, 0.55)',
      borderRadius: '8px',
      padding: '1.25rem 1.5rem',
      marginBottom: '2rem',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '1rem',
    }}>
      {data.event_type ? <SummaryField label="Event Type" value={String(data.event_type)} /> : null}
      {data.event_dates ? <SummaryField label="Dates" value={String(data.event_dates)} /> : null}
      {data.recommended_for ? <SummaryField label="Recommended For" value={String(data.recommended_for)} /> : null}
      {keyRewards && keyRewards.length > 0 && (
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{
            fontFamily: 'Unbounded, sans-serif',
            fontSize: '0.58rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            marginBottom: '0.45rem',
            opacity: 0.85,
          }}>
            Key Rewards
          </div>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            {keyRewards.map((reward, i) => (
              <span key={i} style={{
                background: 'rgba(204, 164, 83, 0.1)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.82rem',
                padding: '0.2rem 0.65rem',
                borderRadius: '4px',
                border: '1px solid rgba(204, 164, 83, 0.2)',
              }}>
                {reward}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const guide = await getGuide(id)
  if (!guide) return {}
  const canonical = `/games/dc-dark-legion/guides/${guide.id}`
  return {
    title: `${guide.title} · DC: Dark Legion Guide | Quantum Game Guides`,
    description: guide.description || undefined,
    alternates: { canonical },
    openGraph: {
      title: guide.title,
      description: guide.description || undefined,
      url: canonical,
      type: 'article',
      ...(guide.coverImage ? { images: [{ url: guide.coverImage, alt: guide.title }] } : {}),
    },
  }
}

export default async function GuideDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const guide = await getGuide(id)
  if (!guide) return notFound()

  const cleaned = stripAstroSyntax(guide.body)
  const rawHtml = await renderMarkdown(cleaned)
  const { html: htmlWithIds, headings } = extractAndIdHeadings(rawHtml)
  const html = processCallouts(htmlWithIds)

  const data = {
    event_type: guide.eventType,
    event_dates: guide.eventDates,
    recommended_for: guide.recommendedFor,
    key_rewards: guide.keyRewards,
  }

  const hasToc = headings.length >= 2
  const hasSummary = !!(guide.eventType || guide.eventDates || guide.recommendedFor || (guide.keyRewards && guide.keyRewards.length > 0))
  const coverImage = guide.coverImage
  const title = guide.title
  const tags = guide.tags
  const pubDate = guide.pubDate
  const author = guide.author

  return (
    <main style={{ '--game-accent': 'var(--gold)' } as React.CSSProperties}>

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

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div
        className="container"
        style={{ maxWidth: hasToc ? '1080px' : '820px', paddingTop: '2.5rem', paddingBottom: '4rem' }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: hasToc ? '1fr 220px' : '1fr',
          gap: '3rem',
          alignItems: 'start',
        }}>

          {/* Main article */}
          <div>
            {hasSummary && <EventSummaryBox data={data} />}
            <article className="guide-prose" dangerouslySetInnerHTML={{ __html: html }} />
          </div>

          {/* TOC sidebar */}
          {hasToc && (
            <div className="guide-toc-col">
              <GuideToc headings={headings} />
            </div>
          )}

        </div>
      </div>

    </main>
  )
}
