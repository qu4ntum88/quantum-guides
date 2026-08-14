/**
 * Structured "block" model for DC: Dark Legion guide bodies.
 *
 * Guides used to be authored as raw Markdown. The on-site editor now writes a
 * small JSON envelope of typed blocks instead, so the author never has to get
 * Markdown syntax right. The guide `body` column stores EITHER:
 *   - a blocks envelope: {"format":"qgg-blocks","version":1,"blocks":[…]}  (new)
 *   - raw Markdown text                                                    (legacy)
 *
 * `parseGuideBody()` detects which. The public guide page renders blocks via
 * `blocksToHtml()` and still falls back to the Markdown pipeline for legacy
 * bodies, so nothing that already exists breaks.
 *
 * Imported by the client editor and the server-rendered guide page alike.
 * Inline formatting (bold / italic / links) inside paragraphs is stored as a
 * small, sanitized HTML subset — `sanitizeInline()` (DOMPurify) is the single
 * gate, run in the editor, on save, and at render.
 */

import DOMPurify from 'isomorphic-dompurify'

/** Paragraph / heading alignment. 'left' is the default and is never stored. */
export type Align = 'left' | 'center' | 'right' | 'justify'

export const ALIGNMENTS: Align[] = ['left', 'center', 'right', 'justify']

export type Block =
  | { type: 'heading'; text: string; align?: Align } // section header → <h2>
  | { type: 'subheading'; text: string; align?: Align } // sub header → <h3>
  | { type: 'paragraph'; text: string; rich?: boolean; align?: Align } // body copy → <p>; rich ⇒ sanitized inline HTML
  | { type: 'list'; items: string[] } // bulleted list → <ul>
  | { type: 'image'; url: string; caption: string } // <figure> + italic <figcaption>

// ── Inline formatting vocabulary ─────────────────────────────────────────────

/**
 * Inline formatting is expressed as a FIXED SET OF CLASSES, never inline
 * `style` attributes.
 *
 * That is a deliberate security choice: allowing `style` through the sanitizer
 * would let an author (or a crafted request) inject arbitrary CSS —
 * `position:fixed` overlays, off-site `url()` fetches, and so on. A closed
 * allowlist of class names cannot express any of that, and it keeps every guide
 * on the site's own type scale and palette.
 *
 * Anything not on this list is stripped at save AND at render.
 */
export const TEXT_SIZES = [
  { id: '', label: 'Normal' },
  { id: 'qgg-sm', label: 'Small' },
  { id: 'qgg-lg', label: 'Large' },
] as const

export const TEXT_COLORS = [
  { id: '', label: 'Default', swatch: '#e8e8e8' },
  { id: 'qgg-c-gold', label: 'Gold', swatch: '#c9a01e' },
  { id: 'qgg-c-red', label: 'Red', swatch: '#ef4444' },
  { id: 'qgg-c-green', label: 'Green', swatch: '#22c55e' },
  { id: 'qgg-c-blue', label: 'Blue', swatch: '#38bdf8' },
  { id: 'qgg-c-purple', label: 'Purple', swatch: '#a855f7' },
  { id: 'qgg-c-muted', label: 'Muted', swatch: '#8a8a8a' },
] as const

export const TEXT_FONTS = [
  { id: '', label: 'Default' },
  { id: 'qgg-f-serif', label: 'Serif' },
  { id: 'qgg-f-display', label: 'Display' },
  { id: 'qgg-f-mono', label: 'Mono' },
] as const

/** Every class the sanitizer will keep on an inline <span>. */
const ALLOWED_CLASSES = new Set<string>([
  ...TEXT_SIZES.map((s) => s.id),
  ...TEXT_COLORS.map((c) => c.id),
  ...TEXT_FONTS.map((f) => f.id),
].filter(Boolean))

/** Strip any class token that is not in the allowlist; drop empty attributes. */
function filterClasses(html: string): string {
  // Runs on DOMPurify output, so attributes are already normalized to double
  // quotes and the markup is well-formed.
  return html.replace(/\sclass="([^"]*)"/gi, (_full, value: string) => {
    const kept = value.split(/\s+/).filter((c) => ALLOWED_CLASSES.has(c))
    return kept.length > 0 ? ` class="${kept.join(' ')}"` : ''
  })
}

// ── Inline sanitization ───────────────────────────────────────────────────────

/**
 * Reduce a snippet of paragraph HTML to a safe inline subset: bold, italic,
 * underline, links, line breaks, and <span> carrying an allowlisted formatting
 * class. DOMPurify strips everything else (scripts, event handlers,
 * javascript: URLs, block tags, and every `style` attribute). Anchors are
 * normalized to open in a new tab with a safe rel.
 *
 * This is the ONLY place inline markup is trusted.
 */
export function sanitizeInline(html: string): string {
  const clean = DOMPurify.sanitize(html ?? '', {
    ALLOWED_TAGS: ['strong', 'em', 'b', 'i', 'u', 'span', 'a', 'br'],
    // NOTE: `style` is deliberately absent — see the comment on ALLOWED_CLASSES.
    ALLOWED_ATTR: ['href', 'class'],
  })
  // DOMPurify already rejects unsafe hrefs; force a safe rel/target on links.
  return filterClasses(clean).replace(
    /<a\s+href=/gi,
    '<a target="_blank" rel="noopener noreferrer nofollow" href=',
  )
}

/** Alignment → class, or '' for the default. */
export function alignClass(align?: Align): string {
  return align && align !== 'left' && ALIGNMENTS.includes(align) ? ` class="qgg-al-${align}"` : ''
}

export type ParsedBody =
  | { format: 'blocks'; blocks: Block[] }
  | { format: 'markdown'; markdown: string }

const ENVELOPE_FORMAT = 'qgg-blocks'
const ENVELOPE_VERSION = 1

// ── Serialize / parse ────────────────────────────────────────────────────────

export function serializeBlocks(blocks: Block[]): string {
  return JSON.stringify({ format: ENVELOPE_FORMAT, version: ENVELOPE_VERSION, blocks })
}

/**
 * Server-side save gate: re-sanitize every rich paragraph in a guide body so a
 * crafted request can never store unsafe markup. Legacy Markdown bodies pass
 * through untouched (they render through the trusted, admin-only Markdown path).
 */
export function sanitizeGuideBody(body: string): string {
  const parsed = parseGuideBody(body)
  if (parsed.format !== 'blocks') return body
  const blocks = parsed.blocks.map((b) =>
    b.type === 'paragraph' && b.rich ? { ...b, text: sanitizeInline(b.text) } : b,
  )
  return serializeBlocks(blocks)
}

function isBlock(b: unknown): b is Block {
  if (!b || typeof b !== 'object') return false
  const t = (b as { type?: unknown }).type
  return t === 'heading' || t === 'subheading' || t === 'paragraph' || t === 'list' || t === 'image'
}

export function parseGuideBody(body: string | null | undefined): ParsedBody {
  const raw = body ?? ''
  const trimmed = raw.trimStart()
  // Cheap pre-check before a JSON.parse attempt: a blocks envelope always
  // starts with `{` and names the format. Legacy Markdown effectively never does.
  if (trimmed.startsWith('{') && trimmed.includes(`"${ENVELOPE_FORMAT}"`)) {
    try {
      const obj = JSON.parse(raw) as { format?: string; blocks?: unknown }
      if (obj && obj.format === ENVELOPE_FORMAT && Array.isArray(obj.blocks)) {
        return { format: 'blocks', blocks: obj.blocks.filter(isBlock) }
      }
    } catch {
      /* fall through to markdown */
    }
  }
  return { format: 'markdown', markdown: raw }
}

// ── HTML escaping ─────────────────────────────────────────────────────────────

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escAttr(s: string): string {
  return esc(s).replace(/"/g, '&quot;')
}

// Escape, then turn single newlines into <br> so intentional line breaks inside
// a paragraph are preserved.
function escMultiline(s: string): string {
  return esc(s).replace(/\r?\n/g, '<br />')
}

// ── Render: blocks → HTML ─────────────────────────────────────────────────────

/**
 * Render blocks to the same HTML shape the `.guide-prose` stylesheet already
 * styles (h2/h3/p/ul/figure+figcaption). All author text is HTML-escaped, so the
 * result is safe to inject via dangerouslySetInnerHTML. Headings are emitted
 * without ids — the page's existing `extractAndIdHeadings()` pass adds those so
 * the table-of-contents keeps working exactly as it does for Markdown guides.
 */
export function blocksToHtml(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'heading':
          return b.text.trim() ? `<h2${alignClass(b.align)}>${esc(b.text)}</h2>` : ''
        case 'subheading':
          return b.text.trim() ? `<h3${alignClass(b.align)}>${esc(b.text)}</h3>` : ''
        case 'paragraph': {
          // Rich paragraphs hold sanitized inline HTML; re-sanitize at render as
          // a last line of defense. Plain paragraphs are HTML-escaped.
          const innerP = b.rich ? sanitizeInline(b.text) : escMultiline(b.text)
          const textOnly = innerP.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
          return textOnly ? `<p${alignClass(b.align)}>${innerP}</p>` : ''
        }
        case 'list': {
          const items = (b.items ?? []).filter((i) => i.trim())
          if (items.length === 0) return ''
          return `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
        }
        case 'image': {
          if (!b.url) return ''
          const cap = (b.caption ?? '').trim()
          const fig = `<img src="${escAttr(b.url)}" alt="${escAttr(cap)}" loading="lazy" />`
          return `<figure>${fig}${cap ? `<figcaption>${esc(cap)}</figcaption>` : ''}</figure>`
        }
        default:
          return ''
      }
    })
    .filter(Boolean)
    .join('\n')
}

// ── Convert: blocks → Markdown (escape hatch for the editor's "raw" toggle) ───

export function blocksToMarkdown(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'heading':
          return `## ${b.text}`
        case 'subheading':
          return `### ${b.text}`
        case 'paragraph':
          return b.rich ? htmlInlineToMd(b.text) : b.text
        case 'list':
          return (b.items ?? []).filter((i) => i.trim()).map((i) => `- ${i}`).join('\n')
        case 'image':
          return b.url ? `![${b.caption ?? ''}](${b.url})` : ''
        default:
          return ''
      }
    })
    .filter((s) => s.trim())
    .join('\n\n')
}

// Inline Markdown (**bold**, *italic*, [text](url)) → sanitized inline HTML.
function inlineMdToHtml(text: string): string {
  let s = esc(text)
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, (_m, t, url) => `<a href="${escAttr(url)}">${t}</a>`)
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
  s = s.replace(/\r?\n/g, '<br />')
  return sanitizeInline(s)
}

// Sanitized inline HTML → inline Markdown (for the editor's "Switch to Markdown").
function htmlInlineToMd(html: string): string {
  return String(html ?? '')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*(strong|b)\s*>(.*?)<\s*\/\s*\1\s*>/gi, '**$2**')
    .replace(/<\s*(em|i)\s*>(.*?)<\s*\/\s*\1\s*>/gi, '*$2*')
    .replace(/<a\s+[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
}

// ── Convert: Markdown → blocks (best-effort import of legacy guides) ──────────

/**
 * Best-effort importer used when an author clicks "convert to the visual editor"
 * on a legacy Markdown guide. It handles headings, images, bullet lists, and
 * paragraphs. Richer Markdown (tables, callouts, inline emphasis) is flattened
 * to plain text, so the UI warns before converting.
 */
export function markdownToBlocks(md: string): Block[] {
  const lines = (md ?? '').replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let para: string[] = []
  let list: string[] = []

  const flushPara = () => {
    if (para.length) {
      const raw = para.join('\n').trim()
      if (raw) blocks.push({ type: 'paragraph', text: inlineMdToHtml(raw), rich: true })
      para = []
    }
  }
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: 'list', items: list.slice() })
      list = []
    }
  }

  const imageOnly = /^!\[([^\]]*)\]\(([^)\s]+)[^)]*\)\s*$/
  const heading = /^(#{1,6})\s+(.*)$/
  const bullet = /^\s*[-*+]\s+(.*)$/

  for (const line of lines) {
    const trimmed = line.trim()

    const img = trimmed.match(imageOnly)
    if (img) {
      flushPara()
      flushList()
      blocks.push({ type: 'image', url: img[2], caption: img[1] ?? '' })
      continue
    }

    const h = trimmed.match(heading)
    if (h) {
      flushPara()
      flushList()
      const level = h[1].length
      const text = h[2].trim()
      blocks.push({ type: level <= 2 ? 'heading' : 'subheading', text })
      continue
    }

    const bl = line.match(bullet)
    if (bl) {
      flushPara()
      list.push(bl[1].trim())
      continue
    }

    if (trimmed === '') {
      flushPara()
      flushList()
      continue
    }

    // Regular prose line: kept raw; inline Markdown is converted to rich HTML
    // when the paragraph is flushed.
    flushList()
    para.push(line)
  }
  flushPara()
  flushList()
  return blocks
}
