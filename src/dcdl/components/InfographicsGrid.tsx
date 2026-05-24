'use client'
import { useState, useEffect } from 'react'

export type Infographic = {
  id: string
  title: string
  description?: string
  image: string | null
  builtin?: string
  credit?: string
}

type StarLevel = { stars: number; shardsNeeded: number; totalShards: number; totalCopies: number }
type StarTier = { tier: string; hexColor: string; levels: StarLevel[] }
export type ShardsData = { title: string; note: string; starTiers: StarTier[] }

const thStyle: React.CSSProperties = {
  padding: '0.35rem 0.5rem', textAlign: 'center',
  fontFamily: 'Unbounded, sans-serif', fontSize: '0.55rem', fontWeight: 700,
  color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em',
}
const tdStyle: React.CSSProperties = { padding: '0.35rem 0.5rem', textAlign: 'center', color: '#aaa' }

function ShardsTable({ shardsData }: { shardsData: ShardsData }) {
  return (
    <div>
      <p style={{ fontSize: '0.75rem', color: '#888', fontStyle: 'italic', margin: '0 0 1rem' }}>
        * {shardsData.note}
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
              <th style={thStyle}>Tier</th>
              <th style={thStyle}>Stars</th>
              <th style={thStyle}>Cost</th>
              <th style={thStyle}>Total Shards</th>
              <th style={thStyle}>Copies</th>
            </tr>
          </thead>
          <tbody>
            {shardsData.starTiers.map((tier) =>
              tier.levels.map((lvl, i) => (
                <tr
                  key={`${tier.tier}-${lvl.stars}`}
                  style={{
                    borderTop: i === 0 ? `2px solid ${tier.hexColor}66` : '1px solid #1e1e1e',
                    background: i === 0 ? `${tier.hexColor}0a` : 'transparent',
                  }}
                >
                  {i === 0 && (
                    <td rowSpan={5} style={{ textAlign: 'center', verticalAlign: 'middle', padding: '0.4rem 0.6rem', borderRight: `3px solid ${tier.hexColor}` }}>
                      <div style={{ width: '1.1rem', height: '1.1rem', borderRadius: '50%', background: tier.hexColor, margin: '0 auto', boxShadow: `0 0 6px ${tier.hexColor}88` }} />
                    </td>
                  )}
                  <td style={tdStyle}>
                    <span style={{ color: tier.hexColor, letterSpacing: '-0.05em', fontSize: '1rem' }}>
                      {'★'.repeat(lvl.stars)}{'☆'.repeat(5 - lvl.stars)}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: '#fff' }}>{lvl.shardsNeeded}</td>
                  <td style={{ ...tdStyle, color: 'var(--gold)', fontWeight: 600 }}>{lvl.totalShards}</td>
                  <td style={tdStyle}>{lvl.totalCopies}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function InfographicsGrid({ infographics, shardsData }: {
  infographics: Infographic[]
  shardsData?: ShardsData
}) {
  const [selected, setSelected] = useState<Infographic | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelected(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selected])

  if (infographics.length === 0) {
    return <p style={{ color: '#666', fontStyle: 'italic' }}>No infographics yet. Add some via the admin panel.</p>
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.25rem',
      }}>
        {infographics.map((ig) => (
          <button
            key={ig.id}
            onClick={() => setSelected(ig)}
            style={{
              background: '#111118',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              cursor: 'pointer',
              textAlign: 'left',
              padding: 0,
              transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.transform = 'translateY(-4px)'
              el.style.borderColor = 'rgba(204,164,83,0.5)'
              el.style.boxShadow = '0 12px 30px rgba(0,0,0,0.5)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.transform = ''
              el.style.borderColor = 'rgba(255,255,255,0.07)'
              el.style.boxShadow = ''
            }}
          >
            <div style={{
              width: '100%',
              aspectRatio: '16/9',
              background: ig.image ? '#000' : 'linear-gradient(135deg, #0a1628 0%, #1a0a2e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {ig.image ? (
                <img src={ig.image} alt={ig.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
                  <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '0.5rem', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Reference Chart</div>
                </div>
              )}
            </div>
            <div style={{ padding: '1rem 1.1rem 1.1rem' }}>
              <div style={{
                fontFamily: 'Unbounded, sans-serif',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#e8e8e8',
                lineHeight: 1.35,
                marginBottom: '0.4rem',
              }}>
                {ig.title}
              </div>
              {ig.description && (
                <p style={{ fontSize: '0.75rem', color: '#777', margin: '0 0 0.5rem', lineHeight: 1.5 }}>
                  {ig.description}
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem' }}>
                {ig.credit ? (
                  <span style={{ fontSize: '0.6rem', color: '#555', fontFamily: 'Unbounded, sans-serif' }}>by {ig.credit}</span>
                ) : <span />}
                <span style={{ fontSize: '0.62rem', color: 'var(--gold)', fontFamily: 'Unbounded, sans-serif', letterSpacing: '0.04em' }}>
                  View →
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0e0e18',
              border: '1px solid rgba(204,164,83,0.25)',
              borderRadius: '1rem',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.1rem 1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              position: 'sticky',
              top: 0,
              background: '#0e0e18',
              zIndex: 1,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', lineHeight: 1.3 }}>
                  {selected.title}
                </div>
                {selected.credit && <div style={{ fontSize: '0.65rem', color: '#555', marginTop: '0.2rem' }}>by {selected.credit}</div>}
              </div>
              {selected.image && (
                <a
                  href={selected.image}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'rgba(204,164,83,0.12)',
                    border: '1px solid rgba(204,164,83,0.4)',
                    borderRadius: '0.375rem',
                    color: 'var(--gold)',
                    padding: '0.4rem 0.9rem',
                    fontSize: '0.7rem',
                    fontFamily: 'Unbounded, sans-serif',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  ↓ Download
                </a>
              )}
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '0.375rem',
                  color: '#aaa',
                  cursor: 'pointer',
                  padding: '0.3rem 0.65rem',
                  fontSize: '1.2rem',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {selected.image ? (
                <img
                  src={selected.image}
                  alt={selected.title}
                  style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '0.5rem' }}
                />
              ) : selected.builtin === 'shards-per-star' && shardsData ? (
                <ShardsTable shardsData={shardsData} />
              ) : (
                <p style={{ color: '#666' }}>No preview available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
