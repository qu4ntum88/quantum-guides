import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'
import type { GfHero, GfHeroSkill } from '@/src/gf/components/GfHeroBox'
import { GfHeroInteractive } from '@/src/gf/components/GfHeroInteractive'
import '../../game.css'

function getAllHeroes(): GfHero[] {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/gf/data/heroes-api.json'), 'utf8'))
    return (data.heroes as (GfHero & { _error?: boolean })[]).filter(h => !h._error)
  } catch { return [] }
}

export function generateStaticParams() {
  return getAllHeroes().map(h => ({ id: String(h.id) }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const hero = getAllHeroes().find(h => String(h.id) === id)
  if (!hero) return { title: 'Hero Not Found' }
  return {
    title: `${hero.name} — Godforge | Quantum Game Guides`,
    description: hero.title ?? undefined,
  }
}

const RARITY_STYLES: Record<string, { border: string; glow: string; bg: string; color: string }> = {
  Legendary: { border: '#f59e0b', glow: 'rgba(245,158,11,0.4)',  bg: 'linear-gradient(to bottom, #2d1f00, #111)', color: '#f59e0b' },
  Epic:      { border: '#a855f7', glow: 'rgba(168,85,247,0.4)',  bg: 'linear-gradient(to bottom, #1e0a3c, #111)', color: '#a855f7' },
  Rare:      { border: '#3b82f6', glow: 'rgba(59,130,246,0.4)',  bg: 'linear-gradient(to bottom, #0a1929, #111)', color: '#3b82f6' },
  Uncommon:  { border: '#22c55e', glow: 'rgba(34,197,94,0.4)',   bg: 'linear-gradient(to bottom, #0a1f0a, #111)', color: '#22c55e' },
  Common:    { border: '#6b7280', glow: 'rgba(107,114,128,0.3)', bg: 'linear-gradient(to bottom, #1a1a1a, #111)', color: '#6b7280' },
}

const LEADER_BONUS_ICONS: Record<string, string> = {
  'Accuracy':    '/godforge/leader_bonus/leader-acc.png',
  'Attack':      '/godforge/leader_bonus/leader-atk.png',
  'Crit Damage': '/godforge/leader_bonus/leader-cdmg.png',
  'Crit Rate':   '/godforge/leader_bonus/leader-crate.png',
  'Defense':     '/godforge/leader_bonus/leader-def.png',
  'Faith':       '/godforge/leader_bonus/leader-fth.png',
  'Health (HP)': '/godforge/leader_bonus/leader-hp.png',
  'Resistance':  '/godforge/leader_bonus/leader-res.png',
  'Speed':       '/godforge/leader_bonus/leader-spd.png',
}

function LeaderBonusCard({ skill }: { skill: GfHeroSkill }) {
  const iconUrl = skill.icon_url ?? (LEADER_BONUS_ICONS[skill.effects?.[0]?.effect_name ?? ''] ?? null)
  return (
    <div style={{
      background: '#0f0f0f',
      border: '1px solid #ec489933',
      borderRadius: '0.75rem',
      overflow: 'hidden',
      width: '15rem',
      flexShrink: 0,
      alignSelf: 'flex-start',
    }}>
      <div style={{ height: '2px', background: 'linear-gradient(90deg, #ec4899, #ec489944, transparent)' }} />
      <div style={{ padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        {iconUrl
          ? <img src={iconUrl} alt="Leader Bonus" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.35rem', objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.35rem', background: '#ec489922', border: '1px solid #ec489933', flexShrink: 0 }} />
        }
        <div>
          <span style={{
            display: 'inline-block', marginBottom: '0.35rem',
            background: '#ec489922', border: '1px solid #ec489955',
            color: '#ec4899', fontSize: '0.58rem', fontWeight: 700,
            padding: '0.1rem 0.4rem', borderRadius: '999px',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>Leader Bonus</span>
          <p style={{ color: '#ccc', fontSize: '0.8rem', lineHeight: 1.55, margin: 0 }}>{skill.description}</p>
        </div>
      </div>
    </div>
  )
}

function cornerIcon(src: string, alt: string) {
  return (
    <img src={src} alt={alt} style={{
      width: '1.75rem', height: '1.75rem', objectFit: 'contain',
      filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.95)) drop-shadow(0 0 8px rgba(255,255,255,0.5)) drop-shadow(0 1px 3px rgba(0,0,0,0.9))',
      flexShrink: 0,
    }} />
  )
}

export default async function GfHeroDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const hero = getAllHeroes().find(h => String(h.id) === id)
  if (!hero) notFound()

  const rarity = hero.rarity ? (RARITY_STYLES[hero.rarity] ?? null) : null
  const imgSrc = hero.portrait_url ?? hero.image_url ?? ''
  const leaderBonus = hero.skills?.find(s => s.type === 'Leader Bonus')
  const cardBorder = rarity
    ? { border: `2px solid ${rarity.border}`, boxShadow: `0 0 20px 4px ${rarity.glow}, 0 0 6px 2px ${rarity.border}` }
    : { border: '2px solid #2a2a2a' }

  return (
    <main style={{ '--game-accent': '#a855f7' } as React.CSSProperties}>

      {/* ── Hero Banner (static) ── */}
      <section className="gh-hero" style={{ minHeight: 'auto' }}>
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', width: '100%' }}>
          <Link href="/games/godforge/heroes" style={{ color: '#555', fontSize: '0.72rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
            ← All Heroes
          </Link>

          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Portrait card */}
            <div style={{ position: 'relative', width: '9rem', aspectRatio: '3 / 4', borderRadius: '0.65rem', overflow: 'hidden', background: hero.portrait_url && rarity ? rarity.bg : '#111', flexShrink: 0, ...cardBorder }}>
              {imgSrc && <img src={imgSrc} alt={hero.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
              <div style={{ position: 'absolute', top: '0.1rem', left: '0.1rem' }}>
                {hero.faction_icon && cornerIcon(hero.faction_icon, hero.faction ?? 'Faction')}
              </div>
              <div style={{ position: 'absolute', top: '0.1rem', right: '0.1rem' }}>
                {hero.archetype_icon && cornerIcon(hero.archetype_icon, hero.archetype ?? 'Archetype')}
              </div>
              <div style={{ position: 'absolute', bottom: '0.1rem', left: '0.1rem' }}>
                {hero.affinity_icon && cornerIcon(hero.affinity_icon, hero.affinity ?? 'Affinity')}
              </div>
              <div style={{ position: 'absolute', bottom: '0.1rem', right: '0.1rem' }}>
                {hero.allegiance_icon && cornerIcon(hero.allegiance_icon, hero.allegiance ?? 'Allegiance')}
              </div>
            </div>

            {/* Hero info */}
            <div style={{ flex: 1, minWidth: '16rem' }}>
              {rarity && (
                <div style={{ color: rarity.color, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: '0.3rem' }}>
                  {hero.rarity}
                </div>
              )}
              <h1 style={{ color: '#fff', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, margin: '0 0 0.25rem', lineHeight: 1.1 }}>
                {hero.name}
              </h1>
              {hero.title && (
                <p style={{ color: '#777', fontSize: '0.9rem', margin: '0 0 1.25rem', fontStyle: 'italic' }}>{hero.title}</p>
              )}

              {/* Attribute pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {[
                  { icon: hero.faction_icon,    label: hero.faction,    desc: 'Faction' },
                  { icon: hero.archetype_icon,  label: hero.archetype,  desc: 'Archetype' },
                  { icon: hero.affinity_icon,   label: hero.affinity,   desc: 'Affinity' },
                  { icon: hero.allegiance_icon, label: hero.allegiance, desc: 'Allegiance' },
                ].filter(a => a.label).map((attr, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ffffff0d', border: '1px solid #ffffff1a', borderRadius: '999px', padding: '0.3rem 0.75rem 0.3rem 0.4rem' }}>
                    {attr.icon && <img src={attr.icon} alt="" style={{ width: '1.3rem', height: '1.3rem', objectFit: 'contain', filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.5))' }} />}
                    <div>
                      <div style={{ color: '#444', fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1 }}>{attr.desc}</div>
                      <div style={{ color: '#ddd', fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.3 }}>{attr.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {hero.archetype_description && (
                <p style={{ color: '#555', fontSize: '0.72rem', marginTop: '0.75rem', lineHeight: 1.5, fontStyle: 'italic', maxWidth: '36rem' }}>
                  {hero.archetype_description}
                </p>
              )}
            </div>

            {/* Leader Bonus */}
            {leaderBonus && <LeaderBonusCard skill={leaderBonus} />}

          </div>
        </div>
      </section>

      {/* ── All interactive content ── */}
      <GfHeroInteractive hero={hero} rarityColor={rarity?.color} />

    </main>
  )
}
