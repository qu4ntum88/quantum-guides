'use client'

import { useEffect, useState } from 'react'
import TierBadge from './TierBadge'

export default function PageTierBadges({
  quantumTier,
  entityType,
  entityId,
}: {
  quantumTier: string
  entityType: 'champion' | 'legacy'
  entityId: string
}) {
  const [communityTier, setCommunityTier] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/votes/tally?type=${entityType}`)
      .then((r) => r.json())
      .then((data) => {
        const winner = data[entityId]?.winner
        if (winner) setCommunityTier(winner)
      })
  }, [entityType, entityId])

  return (
    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <img src="/images/site/Q GOLD FULL ICON.png" alt="Quantum" style={{ width: '5.25rem', height: '5.25rem', objectFit: 'contain' }} />
        <TierBadge tier={quantumTier} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <img src="/images/site/JLD.png" alt="Community" style={{ width: '5.25rem', height: '5.25rem', objectFit: 'contain' }} />
        <TierBadge tier={communityTier} />
      </div>
    </div>
  )
}
