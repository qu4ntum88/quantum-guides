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
 * This module is isomorphic (no fs / no DOM) — imported by the client editor
 * and the server-rendered guide page alike.
 */

export type Block =
  | { type: 'heading'; text: string } // section header → <h2>
  | { type: 'subheading'; text: string } // sub header → <h3>
  | { type: 'paragraph'; text: string } // body copy → <p>
  | { type: 'list'; items: string[] } // bulleted list → <ul>
  | { type: 'image'; url: string; caption: string } // <figure> + italic <figcaption>

export type ParsedBody =
  | { format: 'blocks'; blocks: Block[] }
  | { format: 'markdown'; markdown: string }

const ENVELOPE_FORMAT = 'qgg-blocks'
const ENVELOPE_VERSION = 1

// ── Serialize / parse ────────────────────────────────────────────────────────

export function serializeBlocks(blocks: Block[]): string {
  return JSON.stringify({ format: ENVELOPE_FORMAT, version: ENVELOPE_VERSION, blocks })
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
          return b.text.trim() ? `<h2>${esc(b.text)}</h2>` : ''
        case 'subheading':
          return b.text.trim() ? `<h3>${esc(b.text)}</h3>` : ''
        case 'paragraph':
          return b.text.trim() ? `<p>${escMultiline(b.text)}</p>` : ''
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
          return b.text
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
      const text = para.join('\n').trim()
      if (text) blocks.push({ type: 'paragraph', text })
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

    // Regular prose line: strip the most common inline Markdown markers so the
    // visual paragraph reads cleanly.
    flushList()
    para.push(line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/(?<!\*)\*(?!\*)(.+?)\*/g, '$1'))
  }
  flushPara()
  flushList()
  return blocks
}
