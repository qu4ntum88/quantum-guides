import { notFound } from 'next/navigation'
import { getResolvedHeros } from '@/src/dcdl/lib/data'
import LegacyPieceBox from '@/src/dcdl/components/LegacyPieceBox'
import VotingWidget from '@/src/dcdl/components/VotingWidget'
import PageTierBadges from '@/src/dcdl/components/PageTierBadges'
import type { LegacyResolved } from '@/src/dcdl/lib/data'

export function generateStaticParams() {
  return getResolvedHeros().map((h) => ({ id: h.id }))
}

export default async function HeroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const hero = getResolvedHeros().find((h) => h.id === id)
  if (!hero) return notFound()

  const classSrc = '/dcdl/role_images/' + hero.class + '.png'

  const rarityMap: Record<string, string> = {
    'Mythic +': '/dcdl/heros/rarity_images/mythic+.png',
    Mythic: '/dcdl/heros/rarity_images/Mythic.png',
    Legendary: '/dcdl/heros/rarity_images/legendary.png',
  }
  const raritySrc = rarityMap[hero.rarity] ?? rarityMap['Legendary']

  return (
    <main>
      {/* Full-art background */}
      {hero.imageFull && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: -1,
            backgroundImage: `url('${hero.imageFull}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            opacity: 0.2,
          }}
        />
      )}

      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Hero header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <img src={raritySrc} alt={hero.rarity} style={{ height: '1.5rem' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={classSrc} alt={hero.class} style={{ height: '3rem', objectFit: 'contain' }} />
            <h1 style={{ fontSize: '3rem', margin: 0 }}>{hero.name.split('(')[0]}</h1>
          </div>
          <PageTierBadges quantumTier={hero.tier} entityType="champion" entityId={id} />
          {hero.name.match(/\((.*)\)/)?.pop() && (
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444' }}>
              {hero.name.match(/\((.*)\)/)?.pop()}
            </div>
          )}
        </div>

        {/* Factions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          {hero.tagSynergies.map((t) => (
            <div key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src={t.image} alt={t.name} style={{ width: '2.5rem' }} />
              <span>{t.name}</span>
            </div>
          ))}
        </div>

        {/* Quantum's Take */}
        <div className="card">
          <h2>Quantum&apos;s Take</h2>
          <p>{hero.quantumsTake ?? 'Analysis coming soon.'}</p>
        </div>

        {/* Stats */}
        <div className="card">
          <h4>Damage Type</h4>
          <p>{hero.damageType}</p>
          <h4 style={{ marginTop: '1rem' }}>Sources Where Available</h4>
          <p>{hero.sourcesWhereAvailable?.join(', ')}</p>
        </div>

        {/* Transmute */}
        {hero.transmutePriorities && hero.transmutePriorities.length > 0 && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <img src="/dcdl/resource_icons/mirror cell.png" alt="Mirror Cell" style={{ height: '2.5rem', objectFit: 'contain' }} />
              <h2 style={{ margin: 0, fontSize: '1.4rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Transmute Priorities</h2>
              <img src="/dcdl/resource_icons/inertron.png" alt="Inertron" style={{ height: '2.5rem', objectFit: 'contain' }} />
            </div>
            <p>{hero.transmutePriorities.join(', ')}</p>
          </div>
        )}

        {/* Legacy & Upgrades */}
        <div className="card">
          <h4>Recommended Legacy Pieces</h4>
          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '20rem', marginTop: '0.5rem' }}>
            {hero.recommendedLegacyPieces?.map((p) => (
              <LegacyPieceBox key={p.id} piece={p as LegacyResolved} />
            ))}
          </div>
          {hero.upgrades && hero.upgrades.length > 0 && (
            <>
              <h4 style={{ marginTop: '1.5rem' }}>Multiversal Force Upgrades</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {hero.upgrades.map((u) => (
                  <div key={u.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={u.image} alt={u.name} style={{ width: '5rem' }} />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                      <div>{u.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Skills */}
        <div className="card">
          <h4>Ultimate</h4>
          {hero.ultimate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <img src={hero.ultimate.image} alt={hero.ultimate.name} style={{ width: '3.5rem' }} />
              <div>
                <div style={{ fontWeight: 'bold' }}>{hero.ultimate.name}</div>
                <div>{hero.ultimate.description}</div>
              </div>
            </div>
          )}

          {hero.globalSkill && (
            <>
              <h4>Global Skill</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <img src={hero.globalSkill.image} alt={hero.globalSkill.name} style={{ width: '3.5rem' }} />
                <div>
                  <div style={{ fontWeight: 'bold' }}>{hero.globalSkill.name}</div>
                  <div>{hero.globalSkill.description}</div>
                </div>
              </div>
            </>
          )}

          {hero.skills && hero.skills.length > 0 && (
            <>
              <h4>Skills</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {hero.skills.map((s) => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={s.image} alt={s.name} style={{ width: '3.5rem' }} />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{s.name}</div>
                      <div>{s.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <VotingWidget entityType="champion" entityId={id} />

        <a href="/games/dc-dark-legion" style={{ color: 'var(--gold)' }}>← Back to Character List</a>
      </div>
    </main>
  )
}
