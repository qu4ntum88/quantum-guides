'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import type { LegacyResolved } from '../lib/data'

const RATINGS = ['S+', 'S', 'A+', 'A', 'B', 'C', 'D']

const ratingColor: Record<string, string> = {
  'S+': '#FF6EC7', S: '#FF415C', 'A+': '#FA8319', A: '#FDCE3B', B: '#CB4CDA', C: '#43B3ED', D: '#39D196',
}

const ratingDesc: Record<string, string> = {
  'S+': 'The absolute best champions — meta-defining and dominant in every game mode.',
  S: 'Top tier characters that make an impact in every game mode.',
  'A+': 'Top tier in one or some game modes, but not all.',
  A: 'Great champions that, while not top tier, are still very good in many situations.',
  B: "Solid middle of the road champions — don't particularly excel anywhere but still overall good picks.",
  C: "Champions that excel in the early game but perform considerably worse later on. Also champions that have a well defined niche but don't particularly stand out outside of it, so they aren't worth building unless you have a developed roster.",
  D: 'Champions that fail to have meaningful impact in any content.',
}

const POINTS: Record<string, number> = { 'S+': 7, S: 6, 'A+': 5, A: 4, B: 3, C: 2, D: 1 }

type PieceTally = Record<string, number> & { winner: string; total: number; weightedAvg: number }

export default function LegacyCommunityTierClient({ pieces }: { pieces: LegacyResolved[] }) {
  const { isSignedIn, isLoaded } = useUser()
  const [tallies, setTallies] = useState<Record<string, PieceTally>>({})
  const [myVotes, setMyVotes] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/votes/tally?type=legacy')
      .then((r) => r.json())
      .then((data) => setTallies(data ?? {}))
  }, [])

  useEffect(() => {
    if (!isSignedIn) return
    fetch('/api/votes?type=legacy')
      .then((r) => r.json())
      .then((data: { entity_id: string; rating: string }[]) => {
        const map: Record<string, string> = {}
        data.forEach((v) => { map[v.entity_id] = v.rating })
        setMyVotes(map)
      })
  }, [isSignedIn])

  async function vote(entityId: string, rating: string) {
    if (!isSignedIn || saving) return
    setSaving(entityId + rating)
    const res = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_type: 'legacy', entity_id: entityId, rating }),
    })
    if (res.ok) {
      setMyVotes((prev) => ({ ...prev, [entityId]: rating }))
      fetch('/api/votes/tally?type=legacy')
        .then((r) => r.json())
        .then((data) => setTallies(data ?? {}))
    }
    setSaving(null)
  }

  return (
    <>
      <details style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid #222', borderRadius: '0.75rem', padding: '0.75rem 1.25rem' }}>
        <summary style={{ cursor: 'pointer', fontSize: '0.82rem', color: '#aaa', userSelect: 'none' }}>
          Tier explanations
        </summary>
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {RATINGS.map((r) => (
            <div key={r} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.82rem', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 700, color: ratingColor[r], minWidth: '2.2rem', flexShrink: 0 }}>{r}</span>
              <span style={{ color: '#ccc' }}>{ratingDesc[r]}</span>
            </div>
          ))}
        </div>
      </details>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {pieces.map((piece) => {
          const tally = tallies[piece.id]
          const total = tally?.total ?? 0
          const myVote = myVotes[piece.id]

          return (
            <div
              key={piece.id}
              id={piece.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid #222',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                scrollMarginTop: '1.5rem',
              }}
            >
              {/* Piece header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1.25rem',
                background: 'linear-gradient(90deg, rgba(124,58,237,0.15) 0%, transparent 100%)',
                borderBottom: '1px solid #222',
                flexWrap: 'wrap',
              }}>
                {piece.image && (
                  <img src={piece.image} alt={piece.name} style={{ width: '2.5rem', height: '2.5rem', objectFit: 'contain', flexShrink: 0 }} />
                )}
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontFamily: 'Unbounded, sans-serif', letterSpacing: '0.04em', color: '#f0f0f0', flex: 1 }}>
                  {piece.name}
                </h3>
                {tally && total > 0 && (
                  <span style={{ fontSize: '0.8rem', color: '#aaa', flexShrink: 0 }}>
                    {total} vote{total !== 1 ? 's' : ''} ·{' '}
                    <span style={{ color: ratingColor[tally.winner] ?? 'var(--gold)', fontWeight: 700 }}>
                      {tally.winner}
                    </span>
                  </span>
                )}
              </div>

              <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Vote bars */}
                {tally && total > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {RATINGS.map((r) => {
                      const count = tally[r] ?? 0
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0
                      const pts = count * POINTS[r]
                      return (
                        <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                          <span style={{ width: '2rem', fontWeight: 700, color: ratingColor[r], flexShrink: 0 }}>{r}</span>
                          <div style={{ flex: 1, height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: ratingColor[r], borderRadius: '3px', transition: 'width 0.4s' }} />
                          </div>
                          <span style={{ width: '2.5rem', color: '#888', textAlign: 'right', flexShrink: 0 }}>{count}</span>
                          <span style={{ width: '3.5rem', color: '#555', textAlign: 'right', fontSize: '0.75rem', flexShrink: 0 }}>{pts}pts</span>
                        </div>
                      )
                    })}
                    <details style={{ marginTop: '0.4rem' }}>
                      <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: '#555', userSelect: 'none' }}>
                        How is this calculated?
                      </summary>
                      <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#888', lineHeight: 1.6, background: '#111', borderRadius: '0.375rem', padding: '0.5rem 0.7rem' }}>
                        Each tier is assigned point values (S+=7, S=6, A+=5, A=4, B=3, C=2, D=1).
                        The weighted average is calculated by dividing the total points by the number of votes.
                        The tier whose midpoint range the average falls into wins.
                        <br />
                        <span style={{ color: '#aaa' }}>
                          Weighted average:{' '}
                          <strong style={{ color: 'var(--gold)' }}>{tally.weightedAvg.toFixed(2)}</strong>
                          {' → '}
                          <strong style={{ color: ratingColor[tally.winner] }}>{tally.winner}</strong>
                        </span>
                      </div>
                    </details>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: '#555', fontStyle: 'italic', margin: 0 }}>No votes yet — be the first!</p>
                )}

                {/* Vote buttons */}
                {!isLoaded ? null : isSignedIn ? (
                  <div>
                    <p style={{ fontSize: '0.82rem', color: '#aaa', marginBottom: '0.4rem', margin: '0 0 0.4rem' }}>
                      {myVote ? 'Your vote: ' : 'Cast your vote:'}
                      {myVote && <span style={{ color: ratingColor[myVote], fontWeight: 700 }}>{myVote}</span>}
                    </p>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {RATINGS.map((r) => (
                        <button
                          key={r}
                          onClick={() => vote(piece.id, r)}
                          disabled={saving !== null}
                          style={{
                            padding: '0.35rem 0.75rem', borderRadius: '4px', border: '2px solid',
                            borderColor: myVote === r ? ratingColor[r] : '#444',
                            background: myVote === r ? ratingColor[r] : 'transparent',
                            color: myVote === r ? '#000' : ratingColor[r],
                            fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.85rem',
                            transition: 'all 0.15s',
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: '#888', margin: 0 }}>
                    <a href="/sign-in" style={{ color: 'var(--gold)' }}>Sign in</a> to cast your vote.
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
