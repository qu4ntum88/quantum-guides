import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import { blocksToHtml, parseGuideBody } from './guide-blocks'

/**
 * Server-side guide body → article HTML + table of contents, shared by every
 * game's guide page. Block bodies render through blocksToHtml (author text
 * already escaped/sanitized); legacy Markdown bodies run the Markdown pipeline
 * plus the [!TIP]/[!NOTE]/… callouts. Both go through extractAndIdHeadings so
 * the TOC works the same.
 *
 * Keep jsdom out of this module's import graph (see the guides-500 note in
 * CLAUDE.md): it is loaded by on-demand guide pages in the Vercel function.
 */

export type Heading = { id: string; text: string; level: number }

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

export async function renderGuideBody(body: string): Promise<{ html: string; headings: Heading[] }> {
  const parsed = parseGuideBody(body)
  if (parsed.format === 'blocks') return extractAndIdHeadings(blocksToHtml(parsed.blocks))
  const withIds = extractAndIdHeadings(await renderMarkdown(stripAstroSyntax(parsed.markdown)))
  return { html: processCallouts(withIds.html), headings: withIds.headings }
}
