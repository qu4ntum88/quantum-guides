'use client'

export type GfHero = {
  id: string
  name: string
  fullArt: string
  portrait: string | null
  rarity: 'Legendary' | 'Epic' | 'Rare' | 'Uncommon' | 'Common' | null
  affinity: string | null
  allegiance: string | null
  archetype: string | null
  faction: string | null
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
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
        flexShrink: 0,
      }}
    />
  )
}

export default function GfHeroBox({ hero }: { hero: GfHero }) {
  const rarity = hero.rarity ? RARITY_STYLES[hero.rarity] : null
  const usePortrait = Boolean(hero.portrait)

  const borderStyle = rarity
    ? { border: `1px solid ${rarity.border}`, boxShadow: `0 0 10px 2px ${rarity.glow}, 0 0 3px 1px ${rarity.border}` }
    : { border: '1px solid #2a2a2a' }

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        background: usePortrait && rarity ? rarity.bg : '#111',
        ...borderStyle,
        aspectRatio: '3 / 4',
        cursor: 'default',
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
      {/* Portrait or full art */}
      <img
        src={usePortrait ? hero.portrait! : hero.fullArt}
        alt={hero.name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: usePortrait ? 'contain' : 'cover',
          display: 'block',
        }}
      />

      {/* Bottom gradient + name */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
          padding: '1.5rem 0.4rem 0.4rem',
        }}
      >
        <div
          style={{
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.2,
            textShadow: '0 1px 3px rgba(0,0,0,1)',
            letterSpacing: '0.02em',
          }}
        >
          {hero.name}
        </div>
      </div>

      {/* Top-left: Faction */}
      <div style={{ position: 'absolute', top: '0.25rem', left: '0.25rem' }}>
        {hero.faction
          ? cornerIcon(`/godforge/gf_heroes/factions/${hero.faction}.png`, hero.faction)
          : <div style={{ width: '1.75rem', height: '1.75rem' }} />}
      </div>

      {/* Top-right: Archetype */}
      <div style={{ position: 'absolute', top: '0.25rem', right: '0.25rem' }}>
        {hero.archetype
          ? cornerIcon(`/godforge/gf_heroes/archetypes/Archetype_${hero.archetype}.png`, hero.archetype)
          : <div style={{ width: '1.75rem', height: '1.75rem' }} />}
      </div>

      {/* Bottom-left: Affinity */}
      <div style={{ position: 'absolute', bottom: '1.75rem', left: '0.25rem' }}>
        {hero.affinity
          ? cornerIcon(`/godforge/gf_heroes/affinity/${hero.affinity}.png`, hero.affinity)
          : <div style={{ width: '1.75rem', height: '1.75rem' }} />}
      </div>

      {/* Bottom-right: Allegiance */}
      <div style={{ position: 'absolute', bottom: '1.75rem', right: '0.25rem' }}>
        {hero.allegiance
          ? cornerIcon(`/godforge/gf_heroes/allegiances/Allegiance_${hero.allegiance}.png`, hero.allegiance)
          : <div style={{ width: '1.75rem', height: '1.75rem' }} />}
      </div>
    </div>
  )
}
