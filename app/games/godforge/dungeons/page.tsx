import fs from 'fs'
import path from 'path'
import '../game.css'

type Dungeon = {
  id: number
  name: string
  slug: string
  type: 'ascension_dungeon' | 'equipment_dungeon'
  affinity: string | null
  stage_count: number
  image_url: string
  boss: { name: string }
}

function getDungeons(): Dungeon[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/gf/data/dungeons.json'), 'utf8'))
  } catch { return [] }
}

const AFFINITY_COLORS: Record<string, string> = {
  strength: '#ef4444',
  cunning: '#22c55e',
  wisdom: '#3b82f6',
  eternal: '#a855f7',
}

const AFFINITY_LABELS: Record<string, string> = {
  strength: 'Strength',
  cunning: 'Cunning',
  wisdom: 'Wisdom',
  eternal: 'Eternal',
}

export default function GodorgeDungeonsPage() {
  const dungeons = getDungeons()
  const ascension = dungeons.filter(d => d.type === 'ascension_dungeon')
  const equipment = dungeons.filter(d => d.type === 'equipment_dungeon')

  return (
    <main style={{ '--game-accent': '#a855f7' } as React.CSSProperties}>
      <section className="gh-hero">
        <div className="container">
          <p className="gh-overline">Dungeon Guides</p>
          <h1 className="gh-hero-title">Godforge Dungeons</h1>
          <p className="gh-hero-sub">
            Boss guides, stage breakdowns, wave compositions, and reward information for all Ascension and Equipment dungeons.
          </p>
          <div className="gh-hero-divider" />
          <div className="gh-hero-back">
            <a href="/games/godforge" className="btn" style={{ fontSize: '0.78rem', padding: '0.45rem 1rem' }}>← Back to Hub</a>
          </div>
        </div>
      </section>

      <section style={{ padding: '2.5rem 0 3rem' }}>
        <div className="container">

          {/* Ascension Dungeons */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>Ascension Dungeons</h2>
              <div style={{ flex: 1, height: '1px', background: 'rgba(168,85,247,0.3)' }} />
            </div>
            <p style={{ color: '#999', fontSize: '0.88rem', marginTop: '-0.75rem', marginBottom: '1.5rem' }}>
              Earn Ascension Stones to level up your heroes. Each dungeon is tied to a specific affinity.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {ascension.map(d => (
                <DungeonCard key={d.slug} dungeon={d} />
              ))}
            </div>
          </div>

          {/* Equipment Dungeons */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>Equipment Dungeons</h2>
              <div style={{ flex: 1, height: '1px', background: 'rgba(168,85,247,0.3)' }} />
            </div>
            <p style={{ color: '#999', fontSize: '0.88rem', marginTop: '-0.75rem', marginBottom: '1.5rem' }}>
              Farm gear and crafting materials to build out your heroes&apos; equipment sets.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {equipment.map(d => (
                <DungeonCard key={d.slug} dungeon={d} />
              ))}
            </div>
          </div>

        </div>
      </section>
    </main>
  )
}

function DungeonCard({ dungeon }: { dungeon: Dungeon }) {
  const accentColor = dungeon.affinity ? AFFINITY_COLORS[dungeon.affinity] : '#a855f7'
  const affinityLabel = dungeon.affinity ? AFFINITY_LABELS[dungeon.affinity] : null

  return (
    <a
      href={`/games/godforge/dungeons/${dungeon.slug}`}
      style={{
        display: 'block',
        borderRadius: '10px',
        overflow: 'hidden',
        border: `1px solid rgba(255,255,255,0.08)`,
        background: '#111',
        textDecoration: 'none',
        transition: 'border-color 0.2s, transform 0.2s',
      }}
      className="dungeon-card"
    >
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
        <img
          src={dungeon.image_url}
          alt={dungeon.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.85) 100%)',
        }} />
        {affinityLabel && (
          <div style={{
            position: 'absolute',
            top: '0.6rem',
            right: '0.6rem',
            background: accentColor,
            color: '#fff',
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            fontFamily: 'Unbounded, sans-serif',
          }}>
            {affinityLabel}
          </div>
        )}
        <div style={{
          position: 'absolute',
          bottom: '0.75rem',
          left: '0.75rem',
          right: '0.75rem',
        }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{dungeon.name}</div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.2rem' }}>
            Boss: {dungeon.boss.name}
          </div>
        </div>
      </div>
      <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: '#888' }}>{dungeon.stage_count} stages</span>
        <span style={{ fontSize: '0.78rem', color: accentColor, fontWeight: 600 }}>View Guide →</span>
      </div>
    </a>
  )
}
