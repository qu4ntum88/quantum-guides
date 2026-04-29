'use client'

export type GfHero = {
  id: string
  name: string
  fullArt: string
  affinity: string | null
  allegiance: string | null
  archetype: string | null
  faction: string | null
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
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        background: '#111',
        border: '1px solid #2a2a2a',
        aspectRatio: '3 / 4',
        cursor: 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.transform = 'scale(1.03)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.6)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.transform = ''
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = ''
      }}
    >
      {/* Portrait */}
      <img
        src={hero.fullArt}
        alt={hero.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
