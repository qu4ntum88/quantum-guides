'use client'

import { useEffect, useRef } from 'react'
import {
  type Align, type Block, ALIGNMENTS, sanitizeInline,
  TEXT_COLORS, TEXT_FONTS, TEXT_SIZES,
} from '@/src/dcdl/lib/guide-blocks'
import { btn, btnQuiet, gold, hint, ImageField, input, label } from './editor-ui'

type ParagraphBlock = Extract<Block, { type: 'paragraph' }>

// ── execCommand output → allowlisted classes ─────────────────────────────────
//
// The browser's execCommand is the only practical way to apply formatting to an
// arbitrary selection (splitting partially-selected nodes correctly is genuinely
// hard). But it emits <font> tags and inline styles, and the sanitizer allows
// neither. So we let the browser do the range surgery, then rewrite its output
// into our fixed class vocabulary and drop the styles.
//
// Sentinels: fontSize 2/3/5 → small/normal/large, foreColor → a swatch hex,
// fontName → the class id itself.

const SIZE_BY_FONT_ATTR: Record<string, string> = { '2': 'qgg-sm', '3': '', '5': 'qgg-lg' }
const COLOR_BY_HEX: Record<string, string> = Object.fromEntries(
  TEXT_COLORS.filter((c) => c.id).map((c) => [c.swatch.toLowerCase(), c.id]),
)
const GROUPS: Record<string, string[]> = {
  size: TEXT_SIZES.map((s) => s.id).filter(Boolean),
  color: TEXT_COLORS.map((c) => c.id).filter(Boolean),
  font: TEXT_FONTS.map((f) => f.id).filter(Boolean),
}

function toHex(value: string): string {
  const m = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (!m) return value.trim().toLowerCase()
  return `#${[1, 2, 3].map((i) => Number(m[i]).toString(16).padStart(2, '0')).join('')}`
}

/** Replace any class from `group` on `el` with `cls` (empty = just remove). */
function setGroupClass(el: HTMLElement, group: keyof typeof GROUPS, cls: string) {
  for (const c of GROUPS[group]) el.classList.remove(c)
  if (cls) el.classList.add(cls)
}

function normalizeRichHtml(html: string): string {
  if (typeof window === 'undefined') return html
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  if (!root) return html

  // <font size|color|face> → <span class="…">
  for (const font of Array.from(root.querySelectorAll('font'))) {
    const span = doc.createElement('span')
    const size = font.getAttribute('size')
    if (size && size in SIZE_BY_FONT_ATTR) setGroupClass(span, 'size', SIZE_BY_FONT_ATTR[size])
    const color = font.getAttribute('color')
    if (color) setGroupClass(span, 'color', COLOR_BY_HEX[toHex(color)] ?? '')
    const face = font.getAttribute('face')
    if (face && GROUPS.font.includes(face.trim())) setGroupClass(span, 'font', face.trim())
    while (font.firstChild) span.appendChild(font.firstChild)
    font.replaceWith(span)
  }

  // Inline styles → classes / semantic tags, then strip the style attribute.
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[style]'))) {
    const s = el.style
    if (s.color) setGroupClass(el, 'color', COLOR_BY_HEX[toHex(s.color)] ?? '')
    const face = s.fontFamily.replace(/["']/g, '').trim()
    if (face && GROUPS.font.includes(face)) setGroupClass(el, 'font', face)
    if (s.fontSize) {
      const px = parseFloat(s.fontSize)
      if (s.fontSize.includes('small') || (px && px < 15)) setGroupClass(el, 'size', 'qgg-sm')
      else if (s.fontSize.includes('large') || (px && px > 18)) setGroupClass(el, 'size', 'qgg-lg')
    }

    // Some browsers express bold/italic/underline as CSS rather than tags
    // (execCommand's styleWithCSS mode). Those styles are about to be dropped,
    // so re-express them as the semantic tags the sanitizer keeps — otherwise
    // the formatting silently disappears on save.
    const wraps: string[] = []
    if (/^(bold|[6-9]00)$/.test(s.fontWeight)) wraps.push('strong')
    if (s.fontStyle === 'italic') wraps.push('em')
    if (s.textDecorationLine.includes('underline') || s.textDecoration.includes('underline')) wraps.push('u')
    for (const tag of wraps) {
      const w = doc.createElement(tag)
      while (el.firstChild) w.appendChild(el.firstChild)
      el.appendChild(w)
    }

    el.removeAttribute('style')
  }

  // Drop spans that ended up carrying nothing.
  for (const span of Array.from(root.querySelectorAll('span'))) {
    if (span.attributes.length === 0) span.replaceWith(...Array.from(span.childNodes))
  }

  return root.innerHTML
}

const fmtBtn: React.CSSProperties = {
  ...btnQuiet, padding: '0.2rem 0.55rem', fontSize: '0.8rem', minWidth: '1.9rem',
  fontFamily: 'Georgia, serif', lineHeight: 1,
}
const ribbonSelect: React.CSSProperties = {
  ...input, width: 'auto', padding: '0.2rem 0.4rem', fontSize: '0.72rem', lineHeight: 1.4,
}
const ribbonGroup: React.CSSProperties = {
  display: 'flex', gap: '0.25rem', alignItems: 'center',
  paddingRight: '0.5rem', marginRight: '0.15rem',
  borderRight: '1px solid rgba(255,255,255,0.12)',
}

const ALIGN_ICON: Record<Align, string> = { left: '⭰', center: '⭲', right: '⭱', justify: '☰' }
const ALIGN_LABEL: Record<Align, string> = {
  left: 'Align left', center: 'Align center', right: 'Align right', justify: 'Justify',
}

/** Shared alignment control — paragraphs and both heading levels use it. */
function AlignButtons({ value, onChange }: { value?: Align; onChange: (a: Align) => void }) {
  const current: Align = value ?? 'left'
  return (
    <div style={{ display: 'flex', gap: '0.25rem' }}>
      {ALIGNMENTS.map((a) => (
        <button
          key={a}
          type="button"
          title={ALIGN_LABEL[a]}
          aria-label={ALIGN_LABEL[a]}
          aria-pressed={current === a}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange(a)}
          style={{
            ...fmtBtn,
            fontFamily: 'inherit',
            borderColor: current === a ? gold : 'rgba(255,255,255,0.2)',
            color: current === a ? gold : '#ccc',
          }}
        >
          {ALIGN_ICON[a]}
        </button>
      ))}
    </div>
  )
}

/**
 * Rich paragraph: a contentEditable box with a formatting ribbon — bold,
 * italic, underline, text size, font, colour, link, and alignment.
 *
 * Kept UNCONTROLLED (initial HTML set once via ref) so React never re-writes the
 * DOM mid-edit and jumps the cursor; edits are read back, normalized into the
 * allowlisted class vocabulary, sanitized, and pushed up as rich inline HTML.
 * Paste is forced to plain text and Enter inserts a line break, so nothing
 * outside the safe inline subset can ever exist.
 */
function RichParagraph({
  block, onChange,
}: { block: ParagraphBlock; onChange: (patch: Partial<ParagraphBlock>) => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (block.rich) el.innerHTML = sanitizeInline(block.text)
    else el.textContent = block.text // legacy plain paragraph → shown literally
    // Ask for TAG-based output (<b>/<i>/<u>, <font>) rather than inline styles:
    // the semantic tags survive sanitization directly, and <font> is normalized
    // into our classes. normalizeRichHtml still handles the style form in case a
    // browser ignores this.
    try { document.execCommand('styleWithCSS', false, 'false') } catch { /* not supported */ }
    // Load once on mount; parent updates must not reset the live editing DOM.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emit = () => {
    const el = ref.current
    if (!el) return
    const normalized = normalizeRichHtml(el.innerHTML)
    // Reflect the normalized markup back so the box shows exactly what will be
    // saved — otherwise the browser's raw <font>/style output lingers visually.
    if (normalized !== el.innerHTML) el.innerHTML = normalized
    onChange({ text: sanitizeInline(normalized), rich: true })
  }

  const exec = (command: string, value?: string) => {
    ref.current?.focus()
    document.execCommand(command, false, value)
    emit()
  }

  /**
   * Apply one formatting group to the selection. Empty value clears it: we
   * re-apply the group's neutral sentinel so the browser removes its own
   * markup, then normalization drops the class.
   */
  const applyGroup = (group: 'size' | 'color' | 'font', id: string) => {
    if (group === 'size') return exec('fontSize', id === 'qgg-sm' ? '2' : id === 'qgg-lg' ? '5' : '3')
    if (group === 'color') {
      const swatch = TEXT_COLORS.find((c) => c.id === id)?.swatch ?? '#e8e8e8'
      return exec('foreColor', swatch)
    }
    return exec('fontName', id || 'inherit')
  }

  const addLink = () => {
    let url = window.prompt('Link URL')?.trim()
    if (!url) return
    if (!/^(https?:\/\/|\/|mailto:)/i.test(url)) url = `https://${url}`
    exec('createLink', url)
  }

  return (
    <div>
      <div style={{
        display: 'flex', gap: '0.25rem', marginBottom: '0.45rem', flexWrap: 'wrap',
        alignItems: 'center', padding: '0.35rem 0.4rem', borderRadius: '0.4rem',
        background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={ribbonGroup}>
          <button type="button" style={fmtBtn} title="Bold (Ctrl+B)" aria-label="Bold" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')}><b>B</b></button>
          <button type="button" style={fmtBtn} title="Italic (Ctrl+I)" aria-label="Italic" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')}><i>I</i></button>
          <button type="button" style={fmtBtn} title="Underline (Ctrl+U)" aria-label="Underline" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')}><u>U</u></button>
        </div>

        <div style={ribbonGroup}>
          <select
            style={ribbonSelect}
            title="Text size"
            aria-label="Text size"
            defaultValue=""
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => { applyGroup('size', e.target.value); e.currentTarget.selectedIndex = 0 }}
          >
            <option value="" disabled>Size</option>
            {TEXT_SIZES.map((s) => <option key={s.label} value={s.id}>{s.label}</option>)}
          </select>
          <select
            style={ribbonSelect}
            title="Font"
            aria-label="Font"
            defaultValue=""
            onChange={(e) => { applyGroup('font', e.target.value); e.currentTarget.selectedIndex = 0 }}
          >
            <option value="" disabled>Font</option>
            {TEXT_FONTS.map((f) => <option key={f.label} value={f.id}>{f.label}</option>)}
          </select>
        </div>

        <div style={ribbonGroup}>
          {TEXT_COLORS.map((c) => (
            <button
              key={c.label}
              type="button"
              title={`${c.label} text`}
              aria-label={`${c.label} text`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyGroup('color', c.id)}
              style={{
                width: '1.15rem', height: '1.15rem', borderRadius: '50%', cursor: 'pointer',
                background: c.swatch, border: '1px solid rgba(255,255,255,0.35)', padding: 0,
              }}
            />
          ))}
        </div>

        <div style={ribbonGroup}>
          <AlignButtons value={block.align} onChange={(align) => onChange({ align })} />
        </div>

        <button type="button" style={{ ...fmtBtn, fontFamily: 'inherit' }} title="Add link" onMouseDown={(e) => e.preventDefault()} onClick={addLink}>🔗 Link</button>
      </div>

      <div
        ref={ref}
        className={`qgg-rte${block.align && block.align !== 'left' ? ` qgg-al-${block.align}` : ''}`}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Write a paragraph…"
        onInput={emit}
        onBlur={emit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); document.execCommand('insertLineBreak'); emit() }
        }}
        onPaste={(e) => {
          e.preventDefault()
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
        }}
        style={{ ...input, minHeight: '5rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
      />
    </div>
  )
}

/**
 * Visual, block-based body editor for guides. The author adds typed blocks —
 * Section header, Sub-header, Paragraph, Bulleted list, Image (with an italic
 * caption/credit) — reorders them, and never touches Markdown. The parent owns
 * the block array; this component just renders and mutates it.
 */

const cardStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '0.6rem',
  background: 'rgba(255,255,255,0.02)',
  padding: '0.85rem 0.9rem',
  marginBottom: '0.75rem',
}
const blockLabel: React.CSSProperties = {
  fontFamily: 'Unbounded, sans-serif', fontSize: '0.58rem', fontWeight: 700,
  letterSpacing: '0.12em', textTransform: 'uppercase', color: gold,
}
const iconBtn: React.CSSProperties = {
  ...btnQuiet, padding: '0.2rem 0.5rem', fontSize: '0.85rem', lineHeight: 1,
  fontFamily: 'inherit',
}

const BLOCK_NAMES: Record<Block['type'], string> = {
  heading: 'Section header',
  subheading: 'Sub-header',
  paragraph: 'Paragraph',
  list: 'Bulleted list',
  image: 'Image',
}

function newBlock(type: Block['type']): Block {
  switch (type) {
    case 'heading': return { type: 'heading', text: '' }
    case 'subheading': return { type: 'subheading', text: '' }
    case 'paragraph': return { type: 'paragraph', text: '' }
    case 'list': return { type: 'list', items: [''] }
    case 'image': return { type: 'image', url: '', caption: '' }
  }
}

export default function BlockEditor({
  blocks, onChange, setStatus,
}: {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
  setStatus: (s: string) => void
}) {
  const update = (i: number, patch: Partial<Block>) =>
    onChange(blocks.map((b, j) => (j === i ? ({ ...b, ...patch } as Block) : b)))
  const remove = (i: number) => onChange(blocks.filter((_, j) => j !== i))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= blocks.length) return
    const next = blocks.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const add = (type: Block['type']) => onChange([...blocks, newBlock(type)])

  return (
    <div>
      {blocks.length === 0 && (
        <p style={{ ...hint, marginTop: 0, marginBottom: '0.75rem' }}>
          No content yet. Add your first block below.
        </p>
      )}

      {blocks.map((b, i) => (
        <div key={i} style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.55rem' }}>
            <span style={blockLabel}>{BLOCK_NAMES[b.type]}</span>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              <button type="button" style={iconBtn} title="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button type="button" style={iconBtn} title="Move down" disabled={i === blocks.length - 1} onClick={() => move(i, 1)}>↓</button>
              <button type="button" style={{ ...iconBtn, color: '#ef4444', borderColor: 'rgba(239,68,68,0.35)' }} title="Delete block" onClick={() => remove(i)}>✕</button>
            </div>
          </div>

          {b.type === 'heading' && (
            <>
              <div style={{ marginBottom: '0.4rem' }}>
                <AlignButtons value={b.align} onChange={(align) => update(i, { align })} />
              </div>
              <input
                style={{ ...input, fontFamily: 'Unbounded, sans-serif', fontWeight: 700, textAlign: b.align ?? 'left' }}
                value={b.text}
                placeholder="Section header"
                onChange={(e) => update(i, { text: e.target.value })}
              />
            </>
          )}

          {b.type === 'subheading' && (
            <>
              <div style={{ marginBottom: '0.4rem' }}>
                <AlignButtons value={b.align} onChange={(align) => update(i, { align })} />
              </div>
              <input
                style={{ ...input, fontWeight: 700, textAlign: b.align ?? 'left' }}
                value={b.text}
                placeholder="Sub-header"
                onChange={(e) => update(i, { text: e.target.value })}
              />
            </>
          )}

          {b.type === 'paragraph' && (
            <RichParagraph block={b} onChange={(patch) => update(i, patch)} />
          )}

          {b.type === 'list' && (
            <>
              <textarea
                style={{ ...input, minHeight: '5rem', lineHeight: 1.6 }}
                value={b.items.join('\n')}
                placeholder={'One bullet per line'}
                onChange={(e) => update(i, { items: e.target.value.split('\n') })}
              />
              <p style={hint}>One bullet per line.</p>
            </>
          )}

          {b.type === 'image' && (
            <>
              <ImageField value={b.url} onChange={(url) => update(i, { url })} setStatus={setStatus} />
              <label style={{ ...label, marginTop: '0.7rem' }}>Caption / credit (italic, shown below the image)</label>
              <input
                style={input}
                value={b.caption}
                placeholder="e.g. Splash art — credit @artist"
                onChange={(e) => update(i, { caption: e.target.value })}
              />
            </>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        {(Object.keys(BLOCK_NAMES) as Block['type'][]).map((t) => (
          <button key={t} type="button" style={{ ...btn, background: 'transparent', color: gold, fontSize: '0.72rem', padding: '0.4rem 0.8rem' }} onClick={() => add(t)}>
            + {BLOCK_NAMES[t]}
          </button>
        ))}
      </div>
    </div>
  )
}
