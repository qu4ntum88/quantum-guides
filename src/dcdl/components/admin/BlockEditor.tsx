'use client'

import { useEffect, useRef } from 'react'
import { type Block, sanitizeInline } from '@/src/dcdl/lib/guide-blocks'
import { btn, btnQuiet, gold, hint, ImageField, input, label } from './editor-ui'

type ParagraphBlock = Extract<Block, { type: 'paragraph' }>

/**
 * Rich paragraph: a contentEditable box with a Bold / Italic / Link toolbar.
 * Kept UNCONTROLLED (initial HTML set once via ref) so React never re-writes the
 * DOM mid-edit and jumps the cursor; edits are read back, sanitized, and pushed
 * up as rich inline HTML. Paste is forced to plain text and Enter inserts a line
 * break, so only the safe inline subset (bold/italic/link/br) can ever exist.
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
    // Load once on mount; parent updates must not reset the live editing DOM.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emit = () => {
    const el = ref.current
    if (!el) return
    onChange({ text: sanitizeInline(el.innerHTML), rich: true })
  }

  const exec = (command: string, value?: string) => {
    ref.current?.focus()
    document.execCommand(command, false, value)
    emit()
  }

  const addLink = () => {
    let url = window.prompt('Link URL')?.trim()
    if (!url) return
    if (!/^(https?:\/\/|\/|mailto:)/i.test(url)) url = `https://${url}`
    exec('createLink', url)
  }

  const fmtBtn: React.CSSProperties = {
    ...btnQuiet, padding: '0.2rem 0.6rem', fontSize: '0.8rem', minWidth: '2rem',
    fontFamily: 'Georgia, serif', lineHeight: 1,
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.4rem' }}>
        <button type="button" style={fmtBtn} title="Bold (Ctrl+B)" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')}><b>B</b></button>
        <button type="button" style={fmtBtn} title="Italic (Ctrl+I)" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')}><i>I</i></button>
        <button type="button" style={{ ...fmtBtn, fontFamily: 'inherit' }} title="Add link" onMouseDown={(e) => e.preventDefault()} onClick={addLink}>🔗 Link</button>
      </div>
      <div
        ref={ref}
        className="qgg-rte"
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
            <input
              style={{ ...input, fontFamily: 'Unbounded, sans-serif', fontWeight: 700 }}
              value={b.text}
              placeholder="Section header"
              onChange={(e) => update(i, { text: e.target.value })}
            />
          )}

          {b.type === 'subheading' && (
            <input
              style={{ ...input, fontWeight: 700 }}
              value={b.text}
              placeholder="Sub-header"
              onChange={(e) => update(i, { text: e.target.value })}
            />
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
