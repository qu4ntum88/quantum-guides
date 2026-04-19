'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

const RATINGS = ['S+', 'S', 'A+', 'A', 'B', 'C', 'D']

const ratingColor: Record<string, string> = {
  'S+': '#FF6EC7', S: '#FF415C', 'A+': '#FA8319', A: '#FDCE3B', B: '#CB4CDA', C: '#43B3ED', D: '#39D196',
}

const ratingDesc: Record<string, string> = {
  'S+': 'The absolute best champions — meta-defining and dominant in every game mode.',
  S: 'Top tier characters that make an impact in every game mode.',
  'A+': 'Top tier in one or some game modes, but not all.',
  A: 'Great champions that, while not top tier, are still very good in many situations.',
  B: 'Solid middle of the road champions — don\'t particularly excel anywhere but still overall good picks.',
  C: 'Champions that excel in the early game but perform considerably worse later on. Also champions that have a well defined niche but don\'t particularly stand out outside of it, so they aren\'t worth building unless you have a developed roster.',
  D: 'Champions that fail to have meaningful impact in any content.',
}

type Tally = Record<string, number> & { winner: string; total: number }

export default function VotingWidget({ entityType, entityId }: { entityType: 'champion' | 'legacy'; entityId: string }) {
  const { isSignedIn, isLoaded } = useUser()
  const [tally, setTally] = useState<Tally | null>(null)
  const [myVote, setMyVote] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/votes/tally?type=${entityType}`)
      .then((r) => r.json())
      .then((data) => setTally(data[entityId] ?? null))
  }, [entityType, entityId])

  useEffect(() => {
    if (!isSignedIn) return
    fetch(`/api/votes?type=${entityType}`)
      .then((r) => r.json())
      .then((data: { entity_id: string; rating: string }[]) => {
        const mine = data.find((v) => v.entity_id === entityId)
        if (mine) setMyVote(mine.rating)
      })
  }, [isSignedIn, entityType, entityId])

  async function vote(rating: string) {
    if (!isSignedIn || saving) return
    setSaving(true)
    const res = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_type: entityType, entity_id: entityId, rating }),
    })
    if (res.ok) {
      setMyVote(rating)
      fetch(`/api/votes/tally?type=${entityType}`)
        .then((r) => r.json())
        .then((data) => setTally(data[entityId] ?? null))
    }
    setSaving(false)
  }

  const total = tally?.total ?? 0

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
        <img src="/images/site/JLD.png" alt="JLD" style={{ width: '5.25rem', height: '5.25rem', objectFit: 'contain' }} />
        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Justice League of Discord Community Voted Tier Ranking</h4>
      </div>

      {/* Tier key */}
      <details style={{ marginBottom: '1.25rem' }}>
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

      {tally && total > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '0.5rem' }}>
            {total} vote{total !== 1 ? 's' : ''} · Community tier:&nbsp;
            <span style={{ color: ratingColor[tally.winner] ?? 'var(--gold)', fontWeight: 700 }}>
              {tally.winner}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {RATINGS.map((r) => {
              const count = tally[r] ?? 0
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                  <span style={{ width: '2rem', fontWeight: 700, color: ratingColor[r] }}>{r}</span>
                  <div style={{ flex: 1, height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: ratingColor[r], borderRadius: '3px', transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ width: '2.5rem', color: '#888', textAlign: 'right' }}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!isLoaded ? null : isSignedIn ? (
        <div>
          <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '0.5rem' }}>
            {myVote ? `Your vote: ` : 'Cast your vote:'}
            {myVote && <span style={{ color: ratingColor[myVote], fontWeight: 700 }}>{myVote}</span>}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {RATINGS.map((r) => (
              <button key={r} onClick={() => vote(r)} disabled={saving}
                style={{
                  padding: '0.4rem 0.9rem', borderRadius: '4px', border: '2px solid',
                  borderColor: myVote === r ? ratingColor[r] : '#444',
                  background: myVote === r ? ratingColor[r] : 'transparent',
                  color: myVote === r ? '#000' : ratingColor[r],
                  fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                  transition: 'all 0.15s',
                }}>
                {r}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p style={{ fontSize: '0.85rem', color: '#888' }}>
          <a href="/sign-in" style={{ color: 'var(--gold)' }}>Sign in</a> to cast your vote.
        </p>
      )}
    </div>
  )
}
