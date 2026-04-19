import type React from 'react'
import { notFound } from 'next/navigation'
import { getResolvedLegacy, getResolvedHeros } from '@/src/dcdl/lib/data'
import HeroBox from '@/src/dcdl/components/HeroBox'
import VotingWidget from '@/src/dcdl/components/VotingWidget'
import PageTierBadges from '@/src/dcdl/components/PageTierBadges'

export function generateStaticParams() {
  return getResolvedLegacy().map((l) => ({ id: l.id }))
}

export default async function LegacyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const legacy = getResolvedLegacy().find((l) => l.id === id)
  if (!legacy) return notFound()

  return (
    <main>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {legacy.image && <img src={legacy.image} alt={legacy.name} style={{ height: '3rem', objectFit: 'contain' }} />}
          <h1 style={{ fontSize: '3rem', margin: 0 }}>{legacy.name.split('(')[0]}</h1>
          {legacy.rank && (() => {
            const rankStyleMap: Record<string, React.CSSProperties> = {
              'Mythic +': {
                background: 'linear-gradient(105deg, #b91c1c 0%, #ef4444 30%, #fca5a5 48%, #ef4444 66%, #b91c1c 100%)',
                boxShadow: '0 0 12px rgba(239,68,68,0.55), inset 0 1px 0 rgba(255,255,255,0.25)',
                color: 'white',
              },
              'Mythic': { background: '#ef4444', color: 'white' },
              'Legendary': { background: '#FACC15', color: '#1a1a1a' },
              'Epic': { background: '#a855f7', color: 'white' },
            }
            const rankStyle = rankStyleMap[legacy.rank] ?? { background: '#555', color: 'white' }
            return (
              <span style={{
                ...rankStyle,
                padding: '0.3rem 0.85rem',
                borderRadius: '0.4rem',
                fontFamily: 'Unbounded, sans-serif',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                {legacy.rank}
              </span>
            )
          })()}
        </div>
        {legacy.tier && <PageTierBadges quantumTier={legacy.tier} entityType="legacy" entityId={id} />}

        {(() => {
          const roleClassMap: Record<string, string[]> = {
            'Guardian | Warrior': ['Guardian', 'Warrior'],
            'Magical | Assassin | Firepower': ['Magical', 'Assassin', 'Firepower'],
            'Supporter | Intimidator': ['Supporter', 'Intimidator'],
          }
          const roleClasses = legacy.role ? (roleClassMap[legacy.role] ?? []) : []
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
              {legacy.image && (
                <img src={legacy.image} alt={legacy.name} style={{ height: '10rem', objectFit: 'contain' }} />
              )}
              {roleClasses.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {roleClasses.map((c) => (
                    <img key={c} src={`/dcdl/role_images/${c}.png`} alt={c} style={{ height: '5rem', objectFit: 'contain' }} />
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        <div className="card">
          <h4>Recommended Champions</h4>
          <div className="grid w-full max-w-4xl grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5" style={{ marginTop: '0.5rem' }}>
            {legacy.champions.map((h) => h && <HeroBox key={h.id} hero={h} />)}
          </div>
        </div>

        <div className="card">
          <h4>Gear Effects</h4>
          <p>{legacy.gearEffects?.join(', ')}</p>
        </div>

        {legacy.legacySkills && legacy.legacySkills.length > 0 && (
          <div className="card">
            <h4>Legacy Piece Skills</h4>
            {legacy.legacySkills.map((s) => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                {s.image && <img src={s.image} alt={s.name} style={{ width: '3.5rem' }} />}
                <div>
                  <div style={{ fontWeight: 'bold' }}>{s.name}</div>
                  <div>{s.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <VotingWidget entityType="legacy" entityId={id} />

        <a href="/games/dc-dark-legion/legacy" style={{ color: 'var(--gold)' }}>← Back to Legacy Pieces</a>
      </div>
    </main>
  )
}
