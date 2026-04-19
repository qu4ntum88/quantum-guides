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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
          {legacy.image && <img src={legacy.image} alt={legacy.name} style={{ height: '3rem', objectFit: 'contain' }} />}
          <h1 style={{ fontSize: '3rem', margin: 0 }}>{legacy.name.split('(')[0]}</h1>
        </div>
        <div style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444' }}>{legacy.rank}</div>
        {legacy.tier && <PageTierBadges quantumTier={legacy.tier} entityType="legacy" entityId={id} />}

        {legacy.image && (
          <img src={legacy.image} alt={legacy.name} style={{ height: '10rem', objectFit: 'contain', alignSelf: 'center' }} />
        )}

        <div className="card">
          <h4>Role</h4>
          <p>{legacy.role}</p>
          <h4 style={{ marginTop: '1rem' }}>Recommended Champions</h4>
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
