'use client'

import { useState } from 'react'

const TIERS = ['S', 'A', 'B', 'C', 'D (Food)'] as const
const COLS  = ['Brawler', 'Defender', 'Disruptor', 'Invoker', 'Slayer', 'Imprint'] as const

const TIER_COLORS: Record<string, string> = {
  S: '#FF415C', A: '#FDCE3B', B: '#CB4CDA', C: '#43B3ED', 'D (Food)': '#39D196',
}
const RARITY_COLORS: Record<string, string> = {
  Legendary: '#f59e0b', Epic: '#a855f7', Rare: '#3b82f6',
}

export type GfTierEntry = {
  id: string
  name: string
  rarity: string
  archetype: string | null
  portrait: string | null
  fullArt: string
  gfTier: string
  gfTierColumn: string
}

function TierGrid({ heroes, rarity }: { heroes: GfTierEntry[]; rarity: string }) {
  const filtered = heroes.filter((h) => h.rarity === rarity && h.gfTier && h.gfTierColumn)
  const color = RARITY_COLORS[rarity] ?? '#888'

  if (filtered.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#444', fontSize: '0.9rem', padding: '3rem 0' }}>
        No {rarity} heroes have been ranked yet.
      </div>
    )
  }

  const grouped: Record<string, Record<string, GfTierEntry[]>> = {}
  for (const tier of TIERS) {
    grouped[tier] = {}
    for (const col of COLS) {
      grouped[tier][col] = filtered.filter((h) => h.gfTier === tier && h.gfTierColumn === col)
    }
  }

  const activeTiers = TIERS.filter((tier) => COLS.some((col) => (grouped[tier][col]?.length ?? 0) > 0))

  const LABEL_W = 52
  const COL_MIN = 130

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: LABEL_W + COLS.length * (COL_MIN + 4) + 20 }}>

        {/* Column headers */}
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ width: LABEL_W, flexShrink: 0 }} />
          {COLS.map((col) => (
            <div key={col} style={{
              flex: 1, minWidth: COL_MIN, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
              background: 'rgba(255,255,255,0.04)', borderRadius: 6,
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em',
              color: '#ccc', fontFamily: 'Unbounded, sans-serif',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              {col !== 'Imprint' && (
                <img src={`/godforge/gf_heroes/archetypes/Archetype_${col}.png`} alt={col}
                  style={{ width: 18, height: 18, objectFit: 'contain', opacity: 0.8 }} />
              )}
              {col}
            </div>
          ))}
        </div>

        {activeTiers.map((tier) => (
          <div key={tier} style={{ display: 'flex', gap: 4 }}>
            {/* Tier label */}
            <div style={{
              width: LABEL_W, flexShrink: 0, borderRadius: 6, minHeight: 80,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: TIER_COLORS[tier], color: 'white',
              fontFamily: 'Unbounded, sans-serif', fontWeight: 700,
              textShadow: '-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000',
              gap: 2,
            }}>
              <span style={{ fontSize: '0.9rem' }}>{tier.split(' ')[0]}</span>
              {tier.includes('(') && <span style={{ fontSize: '0.55rem', opacity: 0.85, letterSpacing: '0.02em' }}>{tier.slice(tier.indexOf('('))}</span>}
            </div>

            {COLS.map((col) => {
              const items = grouped[tier][col] ?? []
              const circular = col === 'Imprint'
              return (
                <div key={col} style={{
                  flex: 1, minWidth: COL_MIN, minHeight: 80, padding: 5, borderRadius: 6,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', flexWrap: 'wrap', gap: 4, alignContent: 'flex-start',
                }}>
                  {items.map((item) => {
                    const imgSrc = item.portrait ?? item.fullArt
                    return (
                      <div key={item.id} title={item.name} style={{
                        width: 56, height: circular ? 56 : 70, flexShrink: 0,
                        borderRadius: circular ? '50%' : 6, overflow: 'hidden',
                        border: circular ? `2px solid ${color}` : `1px solid ${color}55`,
                        background: '#1a1a1a', position: 'relative',
                        boxShadow: circular ? `0 0 10px 3px ${color}44` : 'none',
                      }}>
                        {imgSrc && (
                          <img src={imgSrc} alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                        )}
                        {!circular && (
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: 'rgba(0,0,0,0.8)', padding: '2px 3px',
                            fontSize: '0.52rem', color: '#ddd', textAlign: 'center',
                            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                          }}>{item.name}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TierListClient({ heroes }: { heroes: GfTierEntry[] }) {
  const [rarity, setRarity] = useState<'Legendary' | 'Epic' | 'Rare'>('Legendary')

  return (
    <>
      {/* Rarity tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '2rem', borderBottom: '2px solid #222' }}>
        {(['Legendary', 'Epic', 'Rare'] as const).map((r) => (
          <button key={r} type="button" onClick={() => setRarity(r)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0.6rem 1.5rem', marginBottom: '-2px',
            fontSize: '0.85rem', fontWeight: rarity === r ? 700 : 400,
            color: rarity === r ? RARITY_COLORS[r] : '#555',
            borderBottom: rarity === r ? `2px solid ${RARITY_COLORS[r]}` : '2px solid transparent',
            fontFamily: rarity === r ? 'Unbounded, sans-serif' : 'inherit',
            transition: 'color 0.15s',
          }}>
            {r}
          </button>
        ))}
      </div>

      <TierGrid heroes={heroes} rarity={rarity} />
    </>
  )
}
