import { notFound } from 'next/navigation'
import { getResolvedHeros } from '@/src/dcdl/lib/data'
import LegacyPieceBox from '@/src/dcdl/components/LegacyPieceBox'
import VotingWidget from '@/src/dcdl/components/VotingWidget'
import PageTierBadges from '@/src/dcdl/components/PageTierBadges'
import RarityBadge from '@/src/dcdl/components/RarityBadge'
import type { LegacyResolved } from '@/src/dcdl/lib/data'

export function generateStaticParams() {
  return getResolvedHeros().map((h) => ({ id: h.id }))
}

const G = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{children}</span>
)
const Null = () => <span style={{ color: '#ef4444', fontWeight: 700 }}>null</span>

export default async function HeroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const allHeros = getResolvedHeros().slice().sort((a, b) => a.name.localeCompare(b.name))
  const hero = allHeros.find((h) => h.id === id)
  if (!hero) return notFound()

  const idx = allHeros.indexOf(hero)
  const prevHero = allHeros[(idx - 1 + allHeros.length) % allHeros.length]
  const nextHero = allHeros[(idx + 1) % allHeros.length]

  const classSrc = '/dcdl/role_images/' + hero.class + '.png'
  const firstName = hero.name.split('(')[0].trim()

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
            backgroundSize: 'auto 100%',
            backgroundPosition: '115% top',
            backgroundRepeat: 'no-repeat',
            opacity: 0.2,
          }}
        />
      )}

      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Prev / Next nav — top */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <a href={`/games/dc-dark-legion/heros/${prevHero.id}`} className="btn" style={{ padding: '0.5rem 1.25rem', background: 'var(--purple)', borderColor: 'var(--purple)', fontFamily: 'Unbounded, sans-serif', textTransform: 'uppercase', fontSize: '0.72rem' }}>
            ← {prevHero.name.split('(')[0].trim()}
          </a>
          <a href="/games/dc-dark-legion" style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>Back to Champion List</a>
          <a href={`/games/dc-dark-legion/heros/${nextHero.id}`} className="btn" style={{ padding: '0.5rem 1.25rem', background: 'var(--purple)', borderColor: 'var(--purple)', fontFamily: 'Unbounded, sans-serif', textTransform: 'uppercase', fontSize: '0.72rem' }}>
            {nextHero.name.split('(')[0].trim()} →
          </a>
        </div>

        {/* Hero header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <img src={classSrc} alt={hero.class} style={{ height: '3rem', objectFit: 'contain' }} />
            <h1 style={{ fontSize: '3rem', margin: 0 }}>{hero.name.split('(')[0]}</h1>
            {hero.rarity && <RarityBadge rarity={hero.rarity} />}
          </div>
          {hero.name.match(/\((.*)\)/)?.pop() && (
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--gold)' }}>
              {hero.name.match(/\((.*)\)/)?.pop()}
            </div>
          )}
          <PageTierBadges quantumTier={hero.tier} entityType="champion" entityId={id} />
          {/* Factions */}
          {hero.tagSynergies.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'center', marginTop: '0.5rem' }}>
              {hero.tagSynergies.map((t) => (
                <div key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src={t.image} alt={t.name} style={{ width: '2.5rem' }} />
                  <span>{t.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quantum's Take */}
        <div className="card">
          <h2>Quantum&apos;s Take</h2>
          <p style={{ marginBottom: hero.quantumsTake ? '1rem' : 0 }}>
            <G>{firstName}</G> is a{' '}
            {hero.rarity ? <G>{hero.rarity} </G> : <><Null />{' '}</>}
            <G>{hero.class}</G> Champion who does{' '}
            {hero.damageType ? <G>{hero.damageType}</G> : <Null />} damage.{' '}
            <G>{firstName}</G> is best used in{' '}
            {hero.gameModes && hero.gameModes.length > 0 ? <G>{hero.gameModes.join(', ')}</G> : <Null />}.{' '}
            They can be obtained in{' '}
            {hero.sourcesWhereAvailable && hero.sourcesWhereAvailable.length > 0
              ? <G>{hero.sourcesWhereAvailable.join(', ')}</G>
              : <Null />}.{' '}
            You should focus on the following transmutes for <G>{firstName}</G>:{' '}
            {hero.transmutePriorities && hero.transmutePriorities.length > 0
              ? <G>{hero.transmutePriorities.join(', ')}</G>
              : <Null />}.
          </p>
          {hero.quantumsTake && <p style={{ margin: 0 }}>{hero.quantumsTake}</p>}
        </div>

        {/* Recommended Legacy Pieces */}
        <div className="card">
          <h4>Recommended Legacy Pieces</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            {hero.recommendedLegacyPieces?.map((p) => (
              <div key={p.id} style={{ width: '10rem' }}>
                <LegacyPieceBox piece={p as LegacyResolved} />
              </div>
            ))}
          </div>
        </div>

        {/* Champion Abilities */}
        <div className="card">
          <h2>Champion Abilities</h2>

          {hero.ultimate && (
            <>
              <h4>Ultimate</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <img src={hero.ultimate.image} alt={hero.ultimate.name} style={{ width: '3.5rem' }} />
                <div>
                  <div style={{ fontWeight: 'bold' }}>{hero.ultimate.name}</div>
                  <div>{hero.ultimate.description}</div>
                </div>
              </div>
            </>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
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

          {hero.upgrades && hero.upgrades.length > 0 && (
            <>
              <h4>Multiversal Force Enhancements</h4>
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

        <VotingWidget entityType="champion" entityId={id} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <a href={`/games/dc-dark-legion/heros/${prevHero.id}`} className="btn" style={{ padding: '0.5rem 1.25rem', background: 'var(--purple)', borderColor: 'var(--purple)', fontFamily: 'Unbounded, sans-serif', textTransform: 'uppercase', fontSize: '0.72rem' }}>
            ← {prevHero.name.split('(')[0].trim()}
          </a>
          <a href="/games/dc-dark-legion" style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>Back to Champion List</a>
          <a href={`/games/dc-dark-legion/heros/${nextHero.id}`} className="btn" style={{ padding: '0.5rem 1.25rem', background: 'var(--purple)', borderColor: 'var(--purple)', fontFamily: 'Unbounded, sans-serif', textTransform: 'uppercase', fontSize: '0.72rem' }}>
            {nextHero.name.split('(')[0].trim()} →
          </a>
        </div>
      </div>
    </main>
  )
}
