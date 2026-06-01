import { getSynergies, getResolvedHeros } from '@/src/dcdl/lib/data'

export const metadata = { title: 'Factions — DC: Dark Legion' }

export default function FactionsPage() {
  const synergies = getSynergies()
  const heroes = getResolvedHeros()

  const factions = synergies.map((s) => ({
    ...s,
    championCount: heroes.filter((h) => h.tagSynergies.some((t) => t.id === s.id)).length,
  }))

  return (
    <main>
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <h1 style={{ marginBottom: '0.35rem' }}>Factions</h1>
        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Browse champions by faction. Each faction page shows tier rankings, star breakpoints, transmute priorities, AC/DC investments, and more.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '1rem',
        }}>
          {factions.map((faction) => (
            <a
              key={faction.id}
              href={`/games/dc-dark-legion/factions/${faction.id}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '1.25rem 0.75rem',
                background: 'var(--light-bg)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              className="faction-card"
            >
              {faction.image && (
                <img
                  src={faction.image}
                  alt={faction.name}
                  style={{ width: '3.5rem', height: '3.5rem', objectFit: 'contain' }}
                />
              )}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', lineHeight: 1.3 }}>{faction.name}</div>
                <div style={{ color: '#888', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                  {faction.championCount} {faction.championCount === 1 ? 'champion' : 'champions'}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <style>{`
        .faction-card:hover {
          border-color: rgba(204,164,83,0.5);
          background: rgba(204,164,83,0.06);
        }
      `}</style>
    </main>
  )
}
