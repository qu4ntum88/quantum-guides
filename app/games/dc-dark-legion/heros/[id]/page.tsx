import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getResolvedHeros } from '@/src/dcdl/lib/data'
import LegacyPieceBox from '@/src/dcdl/components/LegacyPieceBox'
import VotingWidget from '@/src/dcdl/components/VotingWidget'
import PageTierBadges from '@/src/dcdl/components/PageTierBadges'
import RarityBadge from '@/src/dcdl/components/RarityBadge'
import { PageEntryBadges } from '@/src/dcdl/components/EntryBadges'
import type { LegacyResolved } from '@/src/dcdl/lib/data'
import SynergyTooltip from '@/src/dcdl/components/SynergyTooltip'

export function generateStaticParams() {
  return getResolvedHeros().map((h) => ({ id: h.id }))
}

// Unique per-champion metadata, assembled only from existing champion data
// (no invented copy). Keeps each of the ~69 champion pages distinct for search
// engines instead of inheriting the generic site title/description.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const hero = getResolvedHeros().find((h) => h.id === id)
  if (!hero) return {}

  const canonical = `/games/dc-dark-legion/heros/${hero.id}`

  // Build a factual description from fields that are actually present.
  let desc = `${hero.name} is a`
  if (hero.rarity) desc += ` ${hero.rarity}`
  desc += ` ${hero.class} champion in DC: Dark Legion`
  if (hero.damageType) desc += ` dealing ${hero.damageType} damage`
  if (hero.gameModes && hero.gameModes.length > 0) desc += `, best used in ${hero.gameModes.join(', ')}`
  desc += '.'
  if (hero.tier) desc += ` Quantum's tier rating: ${hero.tier}.`
  desc += ' Abilities, recommended legacy pieces, and community tier votes.'

  const ogImage = hero.imageFull || hero.imageHeadshot

  return {
    title: `${hero.name} — DC: Dark Legion Tier & Guide | Quantum Game Guides`,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title: `${hero.name} — DC: Dark Legion`,
      description: desc,
      url: canonical,
      type: 'article',
      ...(ogImage ? { images: [{ url: ogImage, alt: hero.name }] } : {}),
    },
  }
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

  const linkedAscended = hero.ascendsTo ? (allHeros.find((h) => h.id === hero.ascendsTo) ?? null) : null
  const linkedBase = hero.ascendedFrom ? (allHeros.find((h) => h.id === hero.ascendedFrom) ?? null) : null

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
          <PageEntryBadges isNew={hero.isNew} isP2W={hero.isP2W} previousTier={hero.previousTier} currentTier={hero.tier} />
          {hero.starBreakpoint && (
            <div style={{ display: 'flex', gap: '2px', fontSize: '1.6rem', lineHeight: 1 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} style={{ color: i < hero.starBreakpoint! ? '#f59e0b' : '#3a3a3a' }}>★</span>
              ))}
            </div>
          )}
          {/* Factions */}
          {hero.tagSynergies.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'center', marginTop: '0.5rem' }}>
              {hero.tagSynergies.map((t) => (
                <SynergyTooltip
                  key={t.id}
                  name={t.name}
                  tagImage={t.image}
                  descImage={t.descriptionImage}
                />
              ))}
            </div>
          )}
        </div>

        {/* Ascension banner */}
        {(linkedBase || linkedAscended) && (
          <div style={{
            background: 'rgba(168,85,247,0.12)',
            border: '1px solid rgba(168,85,247,0.4)',
            borderRadius: '0.5rem',
            padding: '0.75rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}>
            {linkedBase && (
              <div style={{ fontSize: '0.9rem' }}>
                ↑ Ascended from:{' '}
                <a href={`/games/dc-dark-legion/heros/${linkedBase.id}`} style={{ color: 'var(--gold)', fontWeight: 700 }}>
                  {linkedBase.name} ({linkedBase.rarity})
                </a>
              </div>
            )}
            {linkedAscended && (
              <div style={{ fontSize: '0.9rem' }}>
                ↑ Ascends to:{' '}
                <a href={`/games/dc-dark-legion/heros/${linkedAscended.id}`} style={{ color: 'var(--gold)', fontWeight: 700 }}>
                  {linkedAscended.name} ({linkedAscended.rarity})
                </a>
              </div>
            )}
          </div>
        )}

        {/* Quantum's Take */}
        <div className="card">
          <h2>Quantum&apos;s Take</h2>
          <p style={{ marginBottom: '1rem' }}>
            <G>{firstName}</G> is a{' '}
            {hero.rarity ? <G>{hero.rarity} </G> : <><Null />{' '}</>}
            <G>{hero.class}</G> Champion who does{' '}
            {hero.damageType ? <G>{hero.damageType}</G> : <Null />} damage.{' '}
            <G>{firstName}</G> is best used in{' '}
            {hero.gameModes && hero.gameModes.length > 0 ? <G>{hero.gameModes.join(', ')}</G> : <Null />}.
          </p>
          <p style={{ marginBottom: '1rem' }}>
            They can be obtained in{' '}
            {hero.sourcesWhereAvailable && hero.sourcesWhereAvailable.length > 0
              ? <G>{hero.sourcesWhereAvailable.join(', ')}</G>
              : <Null />}.{' '}
            {hero.whaleOrSkipValue && (
              <>Based on our analysis, <G>{firstName}</G> is <G>{hero.whaleOrSkipValue}</G>. Plan your spending decisions for Anvils and Selector Shards accordingly.</>
            )}
          </p>
          <p style={{ marginBottom: hero.quantumsTake ? '1rem' : 0 }}>
            You should focus on the following transmutes for <G>{firstName}</G>:{' '}
            {hero.transmutePriorities && hero.transmutePriorities.length > 0
              ? <G>{hero.transmutePriorities.join(', ')}</G>
              : <Null />}.
          </p>
          {hero.quantumsTake && <p style={{ margin: 0 }}>{hero.quantumsTake}</p>}
          {(hero.starBreakpoint || (hero.acDcPriority && hero.acDcPriority.length > 0)) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {hero.starBreakpoint && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Star Breakpoint</span>
                  <div style={{ display: 'flex', gap: '2px', marginTop: '0.2rem' }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} style={{ fontSize: '1.25rem', color: i < hero.starBreakpoint! ? '#f59e0b' : '#3a3a3a', lineHeight: 1 }}>★</span>
                    ))}
                  </div>
                </div>
              )}
              {hero.acDcPriority && hero.acDcPriority.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AC/DC Priority</span>
                  <div style={{ marginTop: '0.2rem', color: 'var(--gold)', fontWeight: 700, fontSize: '0.95rem' }}>{hero.acDcPriority.join(', ')}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recommended Legacy Pieces */}
        <div className="card">
          <h4>Recommended Legacy Pieces</h4>
          {hero.uniqueLegacyRequired && (
            <p style={{ marginTop: '0.75rem', marginBottom: 0, lineHeight: 1.65 }}>
              <G>{firstName}</G> requires their unique legacy piece to operate at full capacity. Until you equip it, this champion may not work as well as intended. The other legacy pieces recommended in this section are simply meant to be placeholders to use until you can afford the magic eye investment if this is a champion you plan to invest heavily into.
            </p>
          )}
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
