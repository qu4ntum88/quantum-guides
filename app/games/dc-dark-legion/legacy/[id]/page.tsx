import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getResolvedHeros, getResolvedLegacy, type HeroResolved, type LegacyResolved } from '@/src/dcdl/lib/data'
import { LegacyDetailView, LEGACY_QUALITY, type LegacyDetails } from '@/src/dcdl/components/legacy/LegacyDetail'
import EntityHistory from '@/src/dcdl/components/history/EntityHistory'
import { getEntityHistory } from '@/src/dcdl/lib/history-db'
import JsonLd from '@/app/components/JsonLd'
import { pageMeta, breadcrumbLd, DCDL_CRUMB } from '@/src/lib/seo'
import '../../../godforge/game.css'
import './legacy-page.css'

// One page per legacy piece, built from the game-data export
// (public/dcdl/legacy/details/<id>.json, written by scripts/sync-dcdl-kits.mjs) at
// build time. The tier comes from legacy.json, which the commit hook keeps in step
// with the official tiers, so these pages are fully static.
export const dynamicParams = false

const BASE = '/games/dc-dark-legion/legacy'
const LIST = '/games/dc-dark-legion/legacy-tier-list'
const PLACEHOLDER = '/dcdl/heros/headshot_images/_placeholder.png'

export function generateStaticParams() {
  return getResolvedLegacy().map((l) => ({ id: l.id }))
}

function readDetails(id: string): LegacyDetails | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/dcdl/legacy/details', `${id}.json`), 'utf8'))
  } catch {
    return null
  }
}

const rankOf = (piece: LegacyResolved, d: LegacyDetails | null) => piece.rank || (d ? LEGACY_QUALITY[d.quality] : undefined)

/** "+48% ATK, +36% Energy Gain Bonus" at the highest star. */
function maxStats(d: LegacyDetails | null): { label: string; text: string } | null {
  const g = d?.gearEffects
  const top = g?.rows[g.rows.length - 1]
  if (!g || !top) return null
  return { label: top[0], text: g.stats.map((s, i) => `+${top[i + 1]} ${s.replace(/ %$/, '')}`).join(', ') }
}

const listJoin = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

// The game's guide names champions without the site's variant suffixes ("Batman",
// "Two-Face"). Link a name only when it matches exactly one site champion, preferring
// one the site already recommends this piece for.
const norm = (s: string) => s.split('(')[0].toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
function matchChampion(name: string, heros: HeroResolved[], recommended: HeroResolved[]): HeroResolved | null {
  const hits = heros.filter((h) => norm(h.name) === norm(name))
  if (hits.length === 1) return hits[0]
  return hits.find((h) => recommended.some((r) => r.id === h.id)) ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const piece = getResolvedLegacy().find((l) => l.id === id)
  if (!piece) return {}
  const d = readDetails(id)
  const rank = rankOf(piece, d)
  const stats = maxStats(d)

  let desc = `${piece.name} is a${rank && /^[AEIOU]/.test(rank) ? 'n' : ''} ${rank ? `${rank} ` : ''}legacy piece in DC: Dark Legion`
  if (d?.uniqueTo) desc += `, unique to ${d.uniqueTo}`
  desc += '.'
  if (piece.tier) desc += ` Quantum's tier: ${piece.tier}.`
  if (stats) desc += ` At ${stats.label}: ${stats.text}.`
  desc += ' Gear Effects at every star, skill upgrades and best champions.'

  return pageMeta({
    title: `${piece.name}: DC: Dark Legion Legacy Piece Stats & Skills`,
    description: desc,
    path: `${BASE}/${piece.id}`,
    image: false, // ./opengraph-image.tsx
    type: 'article',
  })
}

export default async function LegacyPiecePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const all = getResolvedLegacy()
  const piece = all.find((l) => l.id === id)
  if (!piece) return notFound()

  const d = readDetails(id)
  const heros = getResolvedHeros()
  const rank = rankOf(piece, d)
  const stats = maxStats(d)
  const path_ = `${BASE}/${piece.id}`
  const history = await getEntityHistory('dcdl', 'legacy', piece.id)

  // Champions to link: the site's own recommendations first, then any the game's
  // guide names that resolve to exactly one site champion.
  const linked = new Map(piece.champions.map((h) => [h.id, h]))
  for (const g of d?.guide ?? []) {
    const h = matchChampion(g.champion, heros, piece.champions)
    if (h) linked.set(h.id, h)
  }
  const champions = [...linked.values()]

  // Other pieces at the same tier (or rank when unranked), for onward browsing.
  const related = all
    .filter((l) => l.id !== piece.id && (piece.tier ? l.tier === piece.tier : l.rank === piece.rank))
    .slice(0, 12)

  // A factual summary assembled from the data; no invented copy.
  const summary = [
    `${piece.name} is a${rank && /^[AEIOU]/.test(rank) ? 'n' : ''} ${rank ? `${rank} ` : ''}legacy piece in DC: Dark Legion${d?.uniqueTo ? `, unique to ${d.uniqueTo}` : ''}.`,
    d && d.classes.length > 0 ? `It can be equipped by ${listJoin(d.classes)} champions.` : '',
    piece.tier ? `Quantum ranks it ${piece.tier} tier on the legacy tier list.` : '',
    stats ? `At ${stats.label} its Gear Effects give ${stats.text}.` : '',
    d && d.skills.length > 0 ? `Its skills are ${listJoin(d.skills.map((s) => s.name).filter(Boolean))}.` : '',
  ].filter(Boolean).join(' ')

  return (
    <main className="lgp-page">
      <JsonLd data={breadcrumbLd([DCDL_CRUMB, ['Legacy Tier List', LIST], [piece.name, path_]])} />
      <div className="container lgp-wrap">
        <nav className="lgp-crumbs" aria-label="Breadcrumb">
          <Link href="/games/dc-dark-legion/guides">DC: Dark Legion</Link>
          <span aria-hidden="true">›</span>
          <Link href={LIST}>Legacy Tier List</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{piece.name}</span>
        </nav>

        <div className="ld-panel">
          <LegacyDetailView
            piece={piece}
            data={d}
            footer={
              <footer className="ld-foot">
                <Link href={`${BASE}/community-tier#${piece.id}`}>Community tier votes →</Link>
                <Link href={LIST}>Full legacy tier list →</Link>
              </footer>
            }
          />
        </div>

        <p className="lgp-summary">{summary}</p>

        <EntityHistory name={piece.name} entries={history} />

        {champions.length > 0 && (
          <section className="lgp-block">
            <h2>Champions who use {piece.name}</h2>
            <div className="lgp-champs">
              {champions.map((h) => (
                <Link key={h.id} href={`/games/dc-dark-legion/heros/${h.id}`} className="lgp-champ">
                  <img src={h.imageHeadshot ?? PLACEHOLDER} alt="" loading="lazy" />
                  <span>{h.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="lgp-block">
            <h2>{piece.tier ? `Other ${piece.tier} tier legacy pieces` : `Other ${piece.rank ?? ''} legacy pieces`}</h2>
            <div className="lgp-related">
              {related.map((l) => (
                <Link key={l.id} href={`${BASE}/${l.id}`} className="lgp-rel">
                  {l.image && <img src={l.image} alt="" loading="lazy" />}
                  <span>{l.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
