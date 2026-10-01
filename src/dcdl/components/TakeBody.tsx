import { Fragment, type ReactNode } from 'react'

/**
 * Renders a champion's `quantumsTake` text. Most takes are a single paragraph,
 * but long-form write-ups use a tiny Markdown-ish subset:
 *   - blank line        → new paragraph
 *   - `## Heading`      → section heading
 *   - `- item` lines    → bulleted list
 *   - `**bold**`        → bold
 * Everything is rendered as React text nodes (never raw HTML), so the take
 * can't inject markup.
 */

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4
      ? <strong key={i} style={{ color: 'var(--gold)' }}>{part.slice(2, -2)}</strong>
      : <Fragment key={i}>{part}</Fragment>,
  )
}

export default function TakeBody({ text }: { text: string }) {
  const chunks = text.replace(/\r\n/g, '\n').split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', lineHeight: 1.65 }}>
      {chunks.map((chunk, i) => {
        if (chunk.startsWith('## ')) {
          return (
            <h3 key={i} style={{ margin: i === 0 ? 0 : '0.75rem 0 0', fontSize: '1.15rem', color: 'var(--gold)' }}>
              {chunk.slice(3).trim()}
            </h3>
          )
        }
        const lines = chunk.split('\n')
        if (lines.every((l) => /^\s*-\s+/.test(l))) {
          return (
            <ul key={i} style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*-\s+/, ''))}</li>)}
            </ul>
          )
        }
        return <p key={i} style={{ margin: 0 }}>{inline(lines.join(' '))}</p>
      })}
    </div>
  )
}
