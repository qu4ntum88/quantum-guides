'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { getResolvedHeros, getResolvedLegacy } from '@/src/dcdl/lib/data'

const RATINGS = ['S+', 'S', 'A+', 'A', 'B', 'C', 'D']
const ratingColor: Record<string, string> = {
  'S+': '#FF6EC7', S: '#FF415C', 'A+': '#FA8319', A: '#FDCE3B', B: '#CB4CDA', C: '#43B3ED', D: '#39D196',
}
const ratingDesc: Record<string, string> = {
  'S+': 'The absolute best champions — meta-defining and dominant in every game mode.',
  S: 'Top tier characters that make an impact in every game mode.',
  'A+': 'Top tier in one or some game modes, but not all.',
  A: "Great champions that, while not top tier, are still very good in many situations.",
  B: "Solid middle of the road champions — don't particularly excel anywhere but still overall good picks.",
  C: "Champions that excel in the early game but perform considerably worse later on. Also champions that have a well defined niche but don't particularly stand out outside of it, so they aren't worth building unless you have a developed roster.",
  D: 'Champions that fail to have meaningful impact in any content.',
}

type VoteMap = Record<string, string>

function RatingPicker({ value, onChange }: { value: string; onChange: (r: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
      {RATINGS.map((r) => (
        <button key={r} type="button" onClick={() => onChange(r)} style={{
          padding: '0.25rem 0.6rem', borderRadius: '4px', border: '2px solid',
          borderColor: value === r ? ratingColor[r] : '#444',
          background: value === r ? ratingColor[r] : 'transparent',
          color: value === r ? '#000' : ratingColor[r],
          fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.15s',
        }}>{r}</button>
      ))}
    </div>
  )
}

export default function MembersPage() {
  const { isSignedIn, isLoaded, user } = useUser()
  const [tab, setTab] = useState<'champions' | 'legacy'>('champions')
  const [votes, setVotes] = useState<VoteMap>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const heroes = getResolvedHeros()
  const legacyPieces = getResolvedLegacy()

  useEffect(() => {
    if (!isSignedIn) return
    Promise.all([
      fetch('/api/votes?type=champion').then((r) => r.json()),
      fetch('/api/votes?type=legacy').then((r) => r.json()),
    ]).then(([champVotes, legacyVotes]) => {
      const map: VoteMap = {}
      for (const v of champVotes) map[`champion_${v.entity_id}`] = v.rating
      for (const v of legacyVotes) map[`legacy_${v.entity_id}`] = v.rating
      setVotes(map)
    })
  }, [isSignedIn])

  async function castVote(type: 'champion' | 'legacy', entityId: string, rating: string) {
    const key = `${type}_${entityId}`
    setVotes((prev) => ({ ...prev, [key]: rating }))
    setSaving(key)
    await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_type: type, entity_id: entityId, rating }),
    })
    setSaving(null)
    setSaved(key)
    setTimeout(() => setSaved(null), 1500)
  }

  if (!isLoaded) return <main><div className="container"><p style={{ color: '#888' }}>Loading...</p></div></main>

  if (!isSignedIn) {
    return (
      <main>
        <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h1>Members Area</h1>
          <p style={{ color: '#aaa', marginBottom: '2rem' }}>Sign in to vote on champion and legacy piece tiers.</p>
          <a href="/sign-in" className="btn">Sign In</a>
        </div>
      </main>
    )
  }

  const items = tab === 'champions' ? heroes : legacyPieces
  const type = tab === 'champions' ? 'champion' : 'legacy'

  return (
    <main>
      <div className="container" style={{ maxWidth: '900px', paddingTop: '2rem', paddingBottom: '4rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Members Area</h1>
        <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Welcome, {user?.firstName ?? user?.username ?? 'member'}! Vote on the tier ranking for each champion and legacy piece.
          Your vote can be changed at any time.
        </p>

        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', borderBottom: '2px solid #333' }}>
          {(['champions', 'legacy'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '0.6rem 1.25rem',
              fontSize: '0.9rem', fontWeight: tab === t ? 700 : 400,
              color: tab === t ? 'var(--gold)' : '#888',
              borderBottom: tab === t ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: '-2px',
              fontFamily: tab === t ? 'Unbounded, sans-serif' : 'inherit',
            }}>
              {t === 'champions' ? 'Champions' : 'Legacy Pieces'}
            </button>
          ))}
        </div>

        {/* Tier key */}
        <details style={{ marginBottom: '1.5rem' }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map((item) => {
            const key = `${type}_${item.id}`
            const currentVote = votes[key] ?? ''
            const isSaving = saving === key
            const isSaved = saved === key
            const imgSrc = tab === 'champions'
              ? (item as ReturnType<typeof getResolvedHeros>[0]).imageHeadshot
              : (item as ReturnType<typeof getResolvedLegacy>[0]).image

            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: 'var(--light-bg)', border: '1px solid #333',
                borderRadius: '0.5rem', padding: '0.75rem 1rem',
              }}>
                {imgSrc && (
                  <img src={imgSrc} alt={item.name} style={{ width: '3rem', height: '3rem', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                  <RatingPicker value={currentVote} onChange={(r) => castVote(type, item.id, r)} />
                </div>
                <div style={{ width: '3.5rem', textAlign: 'right', fontSize: '0.75rem', flexShrink: 0 }}>
                  {isSaving && <span style={{ color: '#888' }}>Saving...</span>}
                  {isSaved && <span style={{ color: '#22c55e' }}>Saved!</span>}
                  {!isSaving && !isSaved && currentVote && (
                    <span style={{ color: ratingColor[currentVote], fontWeight: 700, fontSize: '1rem' }}>{currentVote}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
