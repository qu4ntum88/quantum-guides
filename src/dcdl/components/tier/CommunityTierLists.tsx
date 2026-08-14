import Link from 'next/link'
import type { TierListMeta } from '@/src/dcdl/lib/tier-db'

/**
 * "Community Tier Lists" — the card strip at the bottom of the tier list page,
 * one card per published creator/editor list. Styled to sit alongside the
 * infographic cards rather than compete with the official tables above.
 */

const GOLD = '#c9a01e'

export default function CommunityTierLists({ lists }: { lists: TierListMeta[] }) {
  if (lists.length === 0) return null

  return (
    <section style={{ padding: '1rem 0 3rem' }}>
      <div className="container">
        <h2 style={{
          fontFamily: 'Unbounded, sans-serif', fontSize: 'clamp(1.1rem, 3vw, 1.6rem)',
          fontWeight: 900, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em',
          margin: '0 0 0.4rem',
        }}>
          Community Tier Lists
        </h2>
        <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 1.5rem', maxWidth: '46rem', lineHeight: 1.6 }}>
          Rankings from Quantum Game Guides creators and editors. Every list is that creator&rsquo;s own opinion — open
          one to see the full board, or download it as an image.
        </p>

        <div style={{
          display: 'grid', gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 17rem), 1fr))',
        }}>
          {lists.map((l) => (
            <Link
              key={l.id}
              href={`/games/dc-dark-legion/tier-list/${l.id}`}
              style={{
                display: 'block', textDecoration: 'none', color: 'inherit',
                background: '#120834', border: `2px solid ${GOLD}55`,
                borderRadius: '0.75rem', padding: '1.1rem 1.15rem',
                transition: 'border-color 0.15s, transform 0.15s',
              }}
            >
              <span style={{
                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#0a0a14', background: GOLD, padding: '0.18rem 0.5rem', borderRadius: '999px',
              }}>
                {l.entityType === 'legacy' ? 'Legacy Pieces' : 'Champions'}
              </span>
              <div style={{
                fontFamily: 'Unbounded, sans-serif', fontWeight: 800, fontSize: '0.95rem',
                color: '#fff', margin: '0.7rem 0 0.35rem', lineHeight: 1.35,
              }}>
                {l.creatorName}&rsquo;s {l.title}
              </div>
              {l.description && (
                <p style={{ color: '#9a9a9a', fontSize: '0.8rem', margin: '0 0 0.5rem', lineHeight: 1.55 }}>
                  {l.description}
                </p>
              )}
              <div style={{ color: GOLD, fontSize: '0.75rem', fontWeight: 700, marginTop: '0.6rem' }}>
                View tier list →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
