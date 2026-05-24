'use client'
import { useState } from 'react'

const secTitle: React.CSSProperties = {
  fontFamily: 'Unbounded, sans-serif', fontSize: '0.65rem', fontWeight: 700,
  letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)',
}

export default function PatchNotesCard({ patchNotes }: { patchNotes: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(204,164,83,0.2)', paddingBottom: '0.5rem', marginBottom: '0.85rem' }}>
        <span style={secTitle}>Latest Patch Notes</span>
        <button
          onClick={() => setExpanded(e => !e)}
          aria-label={expanded ? 'Collapse patch notes' : 'Expand patch notes'}
          title={expanded ? 'Collapse' : 'Expand'}
          style={{
            background: 'rgba(204,164,83,0.08)',
            border: '1px solid rgba(204,164,83,0.3)',
            borderRadius: '0.3rem',
            color: 'var(--gold)',
            cursor: 'pointer',
            padding: '0.25rem 0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.6rem',
            fontFamily: 'Unbounded, sans-serif',
            letterSpacing: '0.05em',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {expanded ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 4.5L6 8L10 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="scale(1,-1) translate(0,-12)" />
                <path d="M2 7.5L6 4L10 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="scale(1,-1) translate(0,-12)" />
              </svg>
              Collapse
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 3.5L6 7L10 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 8.5L6 5L10 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Expand
            </>
          )}
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <pre style={{
          fontFamily: "'VT323', monospace",
          fontSize: '1.1rem',
          color: '#39ff88',
          background: '#040d04',
          border: '1px solid #1a4d1a',
          borderRadius: '0.375rem',
          padding: '1.25rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: 1.55,
          margin: 0,
          maxHeight: expanded ? 'none' : '12.5rem',
          overflow: 'hidden',
        }}>
          {patchNotes}
        </pre>
        {!expanded && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3.5rem',
            background: 'linear-gradient(to bottom, transparent, #040d04)',
            borderRadius: '0 0 0.375rem 0.375rem',
            pointerEvents: 'none',
          }} />
        )}
      </div>
    </div>
  )
}
