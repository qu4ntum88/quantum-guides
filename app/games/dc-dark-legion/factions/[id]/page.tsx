import { notFound } from 'next/navigation'
import { getSynergies, getResolvedHeros } from '@/src/dcdl/lib/data'
import TierBadge from '@/src/dcdl/components/TierBadge'
import RarityBadge from '@/src/dcdl/components/RarityBadge'

export function generateStaticParams() {
  return getSynergies().map((s) => ({ id: s.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const faction = getSynergies().find((s) => s.id === id)
  return { title: faction ? `${faction.name} — DC: Dark Legion Factions` : 'Faction' }
}

const PLACEHOLDER = '/dcdl/heros/headshot_images/_placeholder.png'

function Stars({ count }: { count: number }) {
  return (
    <span style={{ display: 'flex', gap: '1px' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ fontSize: '1rem', color: i < count ? '#f59e0b' : '#3a3a3a', lineHeight: 1 }}>★</span>
      ))}
    </span>
  )
}

export default async function FactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const synergies = getSynergies()
  const faction = synergies.find((s) => s.id === id)
  if (!faction) return notFound()

  const allHeroes = getResolvedHeros()
  const champions = allHeroes
    .filter((h) => h.tagSynergies.some((t) => t.id === id))
    .sort((a, b) => {
      const tierOrder = ['S+', 'S', 'A+', 'A', 'B', 'C', 'D']
      const ai = a.tier ? tierOrder.indexOf(a.tier) : 99
      const bi = b.tier ? tierOrder.indexOf(b.tier) : 99
      if (ai !== bi) return ai - bi
      return a.name.localeCompare(b.name)
    })

  return (
    <main>
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          {faction.image && (
            <img src={faction.image} alt={faction.name} style={{ height: '3.5rem', objectFit: 'contain' }} />
          )}
          <div>
            <h1 style={{ margin: 0 }}>{faction.name}</h1>
            <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>
              {champions.length} {champions.length === 1 ? 'champion' : 'champions'}
            </p>
          </div>
        </div>

        <a href="/games/dc-dark-legion/factions" style={{ color: 'var(--gold)', fontSize: '0.85rem', display: 'inline-block', marginBottom: '2rem' }}>
          ← All Factions
        </a>

        {/* Infographic */}
        {faction.infographic && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Star Priority</h2>
            <img
              src={faction.infographic}
              alt={`${faction.name} star priority infographic`}
              style={{ maxWidth: '100%', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
        )}

        {/* Champion list */}
        {champions.length === 0 ? (
          <p style={{ color: '#666' }}>No champions tagged with this faction yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {champions.map((hero) => (
              <div
                key={hero.id}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  background: 'var(--light-bg)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                }}
              >
                {/* Portrait */}
                <a href={`/games/dc-dark-legion/heros/${hero.id}`} style={{ flexShrink: 0 }}>
                  <img
                    src={hero.imageHeadshot ?? PLACEHOLDER}
                    alt={hero.name}
                    style={{ width: '80px', height: '100px', objectFit: 'cover', display: 'block' }}
                  />
                </a>

                {/* Info */}
                <div style={{ flex: 1, padding: '0.75rem 0.75rem 0.75rem 0', minWidth: 0 }}>
                  {/* Name row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <a href={`/games/dc-dark-legion/heros/${hero.id}`} style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', textDecoration: 'none' }}>
                      {hero.name}
                    </a>
                    {hero.rarity && <RarityBadge rarity={hero.rarity} />}
                    <TierBadge tier={hero.tier} />
                    {hero.starBreakpoint && <Stars count={hero.starBreakpoint} />}
                  </div>

                  {/* Info grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.4rem 1rem' }}>
                    {hero.acDcPriority && hero.acDcPriority.length > 0 && (
                      <InfoRow label="AC/DC Priority" value={hero.acDcPriority.join(', ')} highlight />
                    )}
                    {hero.transmutePriorities && hero.transmutePriorities.length > 0 && (
                      <InfoRow label="Transmutes" value={hero.transmutePriorities.join(', ')} />
                    )}
                    {hero.sourcesWhereAvailable && hero.sourcesWhereAvailable.length > 0 && (
                      <InfoRow label="Sources" value={hero.sourcesWhereAvailable.join(', ')} />
                    )}
                    {hero.recommendedLegacyPieces && hero.recommendedLegacyPieces.length > 0 && (
                      <InfoRow label="Legacy Pieces" value={hero.recommendedLegacyPieces.map((l) => l.name).join(', ')} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '0.68rem', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{
        fontSize: '0.8rem',
        color: highlight ? 'var(--gold)' : '#ccc',
        fontWeight: highlight ? 700 : 400,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>{value}</div>
    </div>
  )
}
