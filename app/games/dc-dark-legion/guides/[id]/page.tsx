import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import { notFound } from 'next/navigation'
import GuideToc from '../GuideToc'
import '../../../godforge/game.css'
import '../guide-prose.css'

const guidesDir = path.join(process.cwd(), 'src/dcdl/guides')

function getGuideFiles() {
  return fs.readdirSync(guidesDir).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
}

export function generateStaticParams() {
  return getGuideFiles().map((f) => ({ id: f.replace(/\.(mdx|md)$/, '') }))
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

export default async function GuideDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const files = getGuideFiles()
  const file = files.find((f) => f.replace(/\.(mdx|md)$/, '') === id)
  if (!file) return notFound()

  const raw = fs.readFileSync(path.join(guidesDir, file), 'utf8')
  const { data, content: rawContent } = matter(raw)
  const cleaned = stripAstroSyntax(rawContent)
  const rawHtml = await renderMarkdown(cleaned)
  const { html: htmlWithIds, headings } = extractAndIdHeadings(rawHtml)
  const html = processCallouts(htmlWithIds)

  const hasToc = headings.length >= 2
  const hasSummary = !!(data.event_type || data.event_dates || data.recommended_for || data.key_rewards)
  const coverImage = data.coverImage ? String(data.coverImage) : null
  const title = data.title ? String(data.title) : null
  const tags = Array.isArray(data.tags) ? (data.tags as string[]) : []
  const pubDate = data.pubDate ? String(data.pubDate).slice(0, 10) : null
  const author = data.author ? String(data.author) : null

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
            <a href="/games/dc-dark-legion/guides" className="btn">← Back to Guides</a>
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
