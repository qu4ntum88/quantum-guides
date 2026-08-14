import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getResolvedHeros, getLegacy } from '@/src/dcdl/lib/data'
import { applyTierList, getPublishedTierLists, getTierList, TIERS } from '@/src/dcdl/lib/tier-db'
import TierBoard from '@/src/dcdl/components/tier/TierBoard'
import '../../../godforge/game.css'

/**
 * A single community tier list. Published lists only — `getTierList` filters on
 * `published`, so unpublishing one removes the page as well as the card.
 */

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const lists = await getPublishedTierLists()
  return lists.map((l) => ({ slug: l.id }))
}

// Lists change whenever their creator saves, so re-check on the same 60s cadence
// the rest of the CMS-backed content uses.
export const revalidate = 60
export const dynamicParams = true

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const list = await getTierList(slug)
  if (!list) return { title: 'Tier List · Quantum Game Guides' }
  const title = `${list.creatorName}'s ${list.title}`
  return {
    title: `${title} · Quantum Game Guides`,
    description: list.description || `${title} for DC: Dark Legion.`,
  }
}

export default async function CommunityTierListPage({ params }: Params) {
  const { slug } = await params
  const list = await getTierList(slug)
  if (!list) notFound()

  const isLegacy = list.entityType === 'legacy'
  const items = isLegacy
    ? applyTierList(getLegacy(), list.entries).map((l) => ({
        id: l.id,
        name: l.name,
        img: l.image ?? null,
        tier: l.tier as string,
        href: `/games/dc-dark-legion/legacy/${l.id}`,
      }))
    : applyTierList(getResolvedHeros(), list.entries).map((h) => ({
        id: h.id,
        name: h.name,
        img: h.imageHeadshot ?? null,
        tier: h.tier as string,
        href: `/games/dc-dark-legion/heros/${h.id}`,
      }))

  const title = `${list.creatorName}'s ${list.title}`
  const updated = list.updatedAt
    ? new Date(list.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <main>
      <section className="gh-hero" style={{ '--game-accent': '#4f8ef7' } as React.CSSProperties}>
        <div className="container">
          <p className="gh-overline">Community Tier List</p>
          <h1 className="gh-hero-title">{title}</h1>
          {list.description && <p className="gh-hero-sub">{list.description}</p>}
          <div className="gh-hero-divider" />
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {updated && (
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', fontFamily: 'monospace' }}>
                Updated: {updated}
              </span>
            )}
            <Link href="/games/dc-dark-legion/tier-list" style={{ fontSize: '0.78rem', color: 'var(--gold)', opacity: 0.85, textDecoration: 'none' }}>
              ← All tier lists
            </Link>
          </div>
        </div>
      </section>

      <section style={{ padding: '2.5rem 0 1.5rem' }}>
        <div className="container">
          <TierBoard
            title={title}
            subtitle={list.description || undefined}
            dateLine={updated ? `Updated ${updated}` : undefined}
            items={items}
            tiers={TIERS}
            fit={isLegacy ? 'contain' : 'cover'}
            filename={list.id}
          />
          <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#888', fontStyle: 'italic', lineHeight: 1.6 }}>
            This ranking is the opinion of {list.creatorName}, a Quantum Game Guides{' '}
            {isLegacy ? 'contributor' : 'contributor'} — not the site&rsquo;s official list. See{' '}
            <Link href="/games/dc-dark-legion/tier-list" style={{ color: 'var(--gold)', fontStyle: 'normal' }}>
              Quantum&rsquo;s tier list
            </Link>{' '}for that.
          </p>
        </div>
      </section>
    </main>
  )
}
