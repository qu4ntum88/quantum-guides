'use client'

import Link from 'next/link'

export type GfHeroStats = {
  hp: number
  atk: number
  def: number
  spd: number
  init: number
  acc: number
  res: number
  initial_divinity: number
}

export type GfHeroEffect = {
  effect_name: string
  target: string
  target_label: string
  chance: number
  hits: number
  duration: number
  visibility: 'Displayed' | 'Hidden'
}

export type GfHeroSkill = {
  id: number
  type: 'Basic' | 'Core' | 'Passive' | 'Ultimate' | 'Imprint' | 'Leader Bonus'
  name?: string
  description: string
  icon_url: string | null
  divinity_cost: number | null
  damage_formula: string[] | null
  cooldown?: number
  effects: GfHeroEffect[]
  awakening_bonuses: { level: number; description: string; upgrade_description: string }[]
}

export type GfHeroAscensionBonus = {
  rank: number
  stat: string
  multiplier: number
  flat_bonus: number
}

export type GfHeroAwakeningBonus = {
  level: number
  type: 'Ability' | 'Stat'
  description: string | null
  stat?: string
  multiplier?: number
  flat_bonus?: number
  skill_id?: number
  skill_type?: string
}

export type GfHero = {
  id: number
  name: string
  title: string | null
  rarity: 'Legendary' | 'Epic' | 'Rare' | 'Uncommon' | 'Common' | null
  affinity: string | null
  affinity_icon: string | null
  allegiance: string | null
  allegiance_icon: string | null
  archetype: string | null
  archetype_icon: string | null
  archetype_description: string | null
  faction: string | null
  faction_icon: string | null
  portrait_url: string | null
  image_url: string | null
  stats: GfHeroStats | null
  ascension_bonuses: GfHeroAscensionBonus[]
  awakening_bonuses: GfHeroAwakeningBonus[]
  skills: GfHeroSkill[]
  quantum_tier: string | null
}

const RARITY_STYLES: Record<string, { border: string; glow: string; bg: string }> = {
  Legendary: { border: '#f59e0b', glow: 'rgba(245,158,11,0.4)',  bg: 'linear-gradient(to bottom, #2d1f00, #111)' },
  Epic:      { border: '#a855f7', glow: 'rgba(168,85,247,0.4)',  bg: 'linear-gradient(to bottom, #1e0a3c, #111)' },
  Rare:      { border: '#3b82f6', glow: 'rgba(59,130,246,0.4)',  bg: 'linear-gradient(to bottom, #0a1929, #111)' },
  Uncommon:  { border: '#22c55e', glow: 'rgba(34,197,94,0.4)',   bg: 'linear-gradient(to bottom, #0a1f0a, #111)' },
  Common:    { border: '#6b7280', glow: 'rgba(107,114,128,0.3)', bg: 'linear-gradient(to bottom, #1a1a1a, #111)' },
}

function cornerIcon(src: string, alt: string) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: '1.75rem',
        height: '1.75rem',
        objectFit: 'contain',
        filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.95)) drop-shadow(0 0 8px rgba(255,255,255,0.5)) drop-shadow(0 1px 3px rgba(0,0,0,0.9))',
        flexShrink: 0,
      }}
    />
  )
}

export default function GfHeroBox({ hero }: { hero: GfHero }) {
  const rarity = hero.rarity ? RARITY_STYLES[hero.rarity] : null
  const imgSrc = hero.portrait_url ?? hero.image_url ?? ''
  const usePortrait = Boolean(hero.portrait_url)

  const borderStyle = rarity
    ? { border: `1px solid ${rarity.border}`, boxShadow: `0 0 10px 2px ${rarity.glow}, 0 0 3px 1px ${rarity.border}` }
    : { border: '1px solid #2a2a2a' }

  return (
    <Link
      href={`/games/godforge/heroes/${hero.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        style={{
          position: 'relative',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          background: usePortrait && rarity ? rarity.bg : '#111',
          ...borderStyle,
          aspectRatio: '3 / 4',
          cursor: 'pointer',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'scale(1.03)'
          if (rarity) {
            el.style.boxShadow = `0 0 18px 5px ${rarity.glow}, 0 0 6px 2px ${rarity.border}`
          } else {
            el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.6)'
          }
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = ''
          el.style.boxShadow = rarity
            ? `0 0 10px 2px ${rarity.glow}, 0 0 3px 1px ${rarity.border}`
            : ''
        }}
      >
        {imgSrc && (
          <img
            src={imgSrc}
            alt={hero.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}

        {/* Bottom gradient + name */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
            padding: '1.5rem 0.4rem 0.4rem',
          }}
        >
          <div style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 700, textAlign: 'center', lineHeight: 1.2, textShadow: '0 1px 3px rgba(0,0,0,1)', letterSpacing: '0.02em' }}>
            {hero.name}
          </div>
        </div>

        {/* Top-left: Faction */}
        <div style={{ position: 'absolute', top: '0.1rem', left: '0.1rem' }}>
          {hero.faction_icon
            ? cornerIcon(hero.faction_icon, hero.faction ?? 'Faction')
            : <div style={{ width: '1.75rem', height: '1.75rem' }} />}
        </div>

        {/* Top-right: Archetype */}
        <div style={{ position: 'absolute', top: '0.1rem', right: '0.1rem' }}>
          {hero.archetype_icon
            ? cornerIcon(hero.archetype_icon, hero.archetype ?? 'Archetype')
            : <div style={{ width: '1.75rem', height: '1.75rem' }} />}
        </div>

        {/* Bottom-left: Affinity */}
        <div style={{ position: 'absolute', bottom: '0.1rem', left: '0.1rem' }}>
          {hero.affinity_icon
            ? cornerIcon(hero.affinity_icon, hero.affinity ?? 'Affinity')
            : <div style={{ width: '1.75rem', height: '1.75rem' }} />}
        </div>

        {/* Bottom-right: Allegiance */}
        <div style={{ position: 'absolute', bottom: '0.1rem', right: '0.1rem' }}>
          {hero.allegiance_icon
            ? cornerIcon(hero.allegiance_icon, hero.allegiance ?? 'Allegiance')
            : <div style={{ width: '1.75rem', height: '1.75rem' }} />}
        </div>
      </div>
    </Link>
  )
}
