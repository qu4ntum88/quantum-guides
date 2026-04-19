import { notFound } from 'next/navigation'
import { getResolvedLegacy, getResolvedHeros } from '@/src/dcdl/lib/data'
import HeroBox from '@/src/dcdl/components/HeroBox'
import VotingWidget from '@/src/dcdl/components/VotingWidget'
import PageTierBadges from '@/src/dcdl/components/PageTierBadges'
import RarityBadge from '@/src/dcdl/components/RarityBadge'

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
          {legacy.rank && <RarityBadge rarity={legacy.rank} />}
        </div>
        {legacy.tier && <PageTierBadges quantumTier={legacy.tier} entityType="legacy" entityId={id} />}

        {/* Image + Gear Effects row */}
        {(() => {
          const roleClassMap: Record<string, string[]> = {
            'Guardian | Warrior': ['Guardian', 'Warrior'],
            'Magical | Assassin | Firepower': ['Magical', 'Assassin', 'Firepower'],
            'Supporter | Intimidator': ['Supporter', 'Intimidator'],
          }
          const roleClasses = legacy.role ? (roleClassMap[legacy.role] ?? []) : []
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              {/* Gear Effects stacked on the left */}
              {legacy.gearEffects && legacy.gearEffects.length > 0 && (
                <div className="card" style={{ margin: 0, minWidth: '8rem' }}>
                  <h4>Gear Effects</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
                    {legacy.gearEffects.map((g) => (
                      <span key={g} style={{ fontSize: '0.95rem' }}>{g}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Centre: large image + role icons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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
            </div>
          )
        })()}

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

        <div className="card">
          <h4>Recommended Champions</h4>
          <div className="grid w-full max-w-4xl grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5" style={{ marginTop: '0.5rem' }}>
            {legacy.champions.map((h) => h && <HeroBox key={h.id} hero={h} />)}
          </div>
        </div>

        <VotingWidget entityType="legacy" entityId={id} />

        <a href="/games/dc-dark-legion/legacy" style={{ color: 'var(--gold)' }}>← Back to Legacy Pieces</a>
      </div>
    </main>
  )
}
