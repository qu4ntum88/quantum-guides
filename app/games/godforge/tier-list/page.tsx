import fs from 'fs'
import path from 'path'
import TierListClient, { type GfTierEntry } from './TierListClient'
import '../game.css'

function getHeroes(): GfTierEntry[] {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/gf/data/heroes.json'), 'utf8')) as Record<string, unknown>[]
    return raw
      .filter((h) => h.rarity === 'Rare' || h.rarity === 'Epic' || h.rarity === 'Legendary')
      .map((h) => ({
        id: h.id as string,
        name: h.name as string,
        rarity: h.rarity as string,
        archetype: (h.archetype as string | null) ?? null,
        portrait: (h.portrait as string | null) ?? null,
        fullArt: h.fullArt as string,
        gfTier: (h.gfTier as string | undefined) ?? '',
        gfTierColumn: (h.gfTierColumn as string | undefined) ?? '',
      }))
  } catch { return [] }
}

export const metadata = {
  title: 'Godforge Tier List | Quantum Game Guides',
  description: "Quantum's Rare, Epic, and Legendary hero rankings by archetype.",
}

export default function GoforgeTierListPage() {
  const heroes = getHeroes()
  return (
    <main style={{ '--game-accent': '#a855f7' } as React.CSSProperties}>
      <section className="gh-hero">
        <div className="container">
          <p className="gh-overline">{"Quantum's Rankings"}</p>
          <h1 className="gh-hero-title">Godforge Tier List</h1>
          <p className="gh-hero-sub">
            Heroes ranked S → Food by archetype. Circular portrait = Imprint placement.
          </p>
          <div className="gh-hero-divider" />
          <div className="gh-hero-back">
            <a href="/games/godforge" className="btn" style={{ fontSize: '0.78rem', padding: '0.45rem 1rem' }}>
              ← Back to Hub
            </a>
          </div>
        </div>
      </section>

      <section style={{ padding: '2rem 0 4rem' }}>
        <div className="container" style={{ maxWidth: '1160px' }}>
          <TierListClient heroes={heroes} />
        </div>
      </section>
    </main>
  )
}
