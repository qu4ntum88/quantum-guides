'use client'

import { useState } from 'react'

const TIER_RANK: Record<string, number> = { 'S+': 0, S: 1, 'A+': 2, A: 3, B: 4, C: 5, D: 6 }

type Size = 'sm' | 'md' | 'lg'

const SZ = {
  sm:  { newFont: '0.5rem',  circleSize: '0.85rem', circleFont: '0.55rem', arrowFont: '0.65rem' },
  md:  { newFont: '0.85rem', circleSize: '1.2rem',  circleFont: '0.8rem',  arrowFont: '0.9rem'  },
  lg:  { newFont: '1.75rem', circleSize: '2rem',    circleFont: '1.25rem', arrowFont: '1.4rem'  },
}

function NewBadge({ size = 'md' }: { size?: Size }) {
  const s = SZ[size]
  return (
    <span style={{
      fontFamily: "'Bangers', cursive",
      fontSize: s.newFont,
      color: '#ef4444',
      textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white',
      letterSpacing: '0.06em',
      lineHeight: 1,
      userSelect: 'none',
      display: 'block',
    }}>
      NEW
    </span>
  )
}

function P2WBadge({ size = 'md' }: { size?: Size }) {
  const s = SZ[size]
  return (
    <div style={{
      width: s.circleSize,
      height: s.circleSize,
      borderRadius: '50%',
      background: '#16a34a',
      border: '1.5px solid white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 900,
      fontSize: s.circleFont,
      lineHeight: 1,
      userSelect: 'none' as const,
      flexShrink: 0,
      boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
    }}>
      $
    </div>
  )
}

function TierChangeBadge({
  previousTier,
  currentTier,
  size = 'md',
}: {
  previousTier: string
  currentTier: string
  size?: Size
}) {
  const [hovered, setHovered] = useState(false)
  const s = SZ[size]
  const prevRank = TIER_RANK[previousTier] ?? 99
  const currRank = TIER_RANK[currentTier] ?? 99
  const isUp = prevRank > currRank
  const arrow = isUp ? '▲' : '▼'

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{
        fontSize: s.arrowFont,
        color: '#fbbf24',
        textShadow: '0 0 6px #fbbf24, 0 0 14px rgba(251,191,36,0.67), -1px -1px 0 rgba(0,0,0,0.8), 1px 1px 0 rgba(0,0,0,0.8)',
        lineHeight: 1,
        userSelect: 'none' as const,
        cursor: 'default',
        display: 'block',
      }}>
        {arrow}
      </span>
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 4px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a1a2e',
          border: '1px solid rgba(251,191,36,0.5)',
          borderRadius: '0.375rem',
          padding: '0.3rem 0.5rem',
          fontSize: '0.7rem',
          color: '#fbbf24',
          whiteSpace: 'nowrap',
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
        }}>
          {previousTier} → {currentTier}
        </div>
      )}
    </div>
  )
}

export function EntryBadgeGroup({
  isNew,
  isP2W,
  previousTier,
  currentTier,
  size = 'md',
  tierBottom = '2.5rem',
}: {
  isNew?: boolean
  isP2W?: boolean
  previousTier?: string
  currentTier?: string
  size?: Size
  tierBottom?: string
}) {
  const showTierChange =
    !!previousTier &&
    !!currentTier &&
    previousTier !== currentTier &&
    TIER_RANK[previousTier] !== undefined &&
    TIER_RANK[currentTier] !== undefined

  if (!isNew && !isP2W && !showTierChange) return null

  return (
    <>
      {(isNew || isP2W) && (
        <div style={{
          position: 'absolute',
          top: '0.25rem',
          right: '0.25rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.15rem',
          zIndex: 10,
        }}>
          {isNew && <NewBadge size={size} />}
          {isP2W && <P2WBadge size={size} />}
        </div>
      )}
      {showTierChange && (
        <div style={{
          position: 'absolute',
          bottom: tierBottom,
          right: '0.25rem',
          zIndex: 10,
        }}>
          <TierChangeBadge previousTier={previousTier!} currentTier={currentTier!} size={size} />
        </div>
      )}
    </>
  )
}

export function PageEntryBadges({
  isNew,
  isP2W,
  previousTier,
  currentTier,
}: {
  isNew?: boolean
  isP2W?: boolean
  previousTier?: string
  currentTier?: string
}) {
  const showTierChange =
    !!previousTier &&
    !!currentTier &&
    previousTier !== currentTier &&
    TIER_RANK[previousTier] !== undefined &&
    TIER_RANK[currentTier] !== undefined

  if (!isNew && !isP2W && !showTierChange) return null

  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.25rem' }}>
      {isNew && <NewBadge size="lg" />}
      {isP2W && <P2WBadge size="lg" />}
      {showTierChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <TierChangeBadge previousTier={previousTier!} currentTier={currentTier!} size="lg" />
          <span style={{ color: '#fbbf24', fontSize: '0.9rem' }}>Tier moved from {previousTier}</span>
        </div>
      )}
    </div>
  )
}
