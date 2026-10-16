import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { GfHeroSkill } from '@/src/gf/components/GfHeroBox'
import { GfHeroInteractive } from '@/src/gf/components/GfHeroInteractive'
import JsonLd from '@/app/components/JsonLd'
import QTile from '@/src/qgg/components/QTile'
import QuantumTake from '@/src/qgg/components/QuantumTake'
import { breadcrumbLd, faqLd, GF_CRUMB, pageMeta } from '@/src/lib/seo'
import { RARITY_COLORS, TIER_COLORS } from '@/src/qgg/tiers'
import { gfEntities, getGfHero, getGfHeroSlugs, getGfTieredRoster, titleCase } from '@/src/gf/lib/heroes'
import '../../godforge.css'

// The hero's tier can be saved from the Studio editor (Supabase).
export const revalidate = 60
export const dynamicParams = false

export function generateStaticParams() {
  return getGfHeroSlugs().map((slug) => ({ slug }))
}

const article = (w: string) => (/^[aeiou]/i.test(w) ? 'an' : 'a')

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const hero = getGfHero(slug)
  if (!hero) return {}
  const kind = [hero.rarity, hero.affinity, hero.archetype].filter(Boolean).join(' ')
  return pageMeta({
    title: `${hero.name} Godforge Guide: Skills, Stats & Lore`,
    description: [
      `${hero.name}${hero.title ? `, ${hero.title},` : ''} is ${article(kind)} ${kind} hero of ${titleCase(hero.faction)} in Godforge.`,
      hero.summary,
      'Full kit, stats by rank, ascension and awakening bonuses.',
    ].filter(Boolean).join(' '),
    path: `/games/godforge/heroes/${slug}`,
    image: hero.image_url,
    type: 'article',
  })
}

function LeaderBonus({ skill }: { skill: GfHeroSkill }) {
  return (
    <div className="gfh-leader">
      {skill.icon_url && <img src={skill.icon_url} alt="" />}
      <div>
        <span className="gfh-leader-tag">Leader Bonus</span>
        <p>{skill.description}</p>
      </div>
    </div>
  )
}

export default async function GfHeroPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const hero = getGfHero(slug)
  if (!hero) notFound()

  const roster = await getGfTieredRoster()
  const me = roster.find((h) => h.id === slug)
  const tier = me?.tier ?? null
  const rarityColor = RARITY_COLORS[hero.rarity ?? ''] ?? '#888'
  const leader = hero.skills.find((s) => s.type === 'Leader Bonus')
  const realm = titleCase(hero.faction)
  const path = `/games/godforge/heroes/${slug}`
  const similar = gfEntities(
    roster.filter((h) => h.id !== slug && h.archetype === hero.archetype && h.tier === tier).slice(0, 10),
  )

  const faq = [
    { q: `What rarity is ${hero.name} in Godforge?`, a: `${hero.name} is ${article(hero.rarity ?? '')} ${hero.rarity} hero.` },
    {
      q: `What are ${hero.name}'s affinity, archetype and realm?`,
      a: `${hero.name} is ${article(hero.affinity ?? '')} ${hero.affinity} ${hero.archetype} of ${realm}, aligned with ${hero.allegiance}.`,
    },
    ...(tier ? [{ q: `Is ${hero.name} good?`, a: `${hero.name} is ${tier} tier on Quantum's Godforge tier list, ranked among ${hero.archetype}s.` }] : []),
    ...(leader ? [{ q: `What is ${hero.name}'s leader bonus?`, a: `${leader.description}.` }] : []),
  ]

  return (
    <main>
      <JsonLd data={[breadcrumbLd([GF_CRUMB, ['Hero Tier List', '/games/godforge/hero-tier-list'], [hero.name, path]]), faqLd(faq)]} />

      <section className="gfh-hero" style={{ '--rarity': rarityColor } as React.CSSProperties}>
        <div className="container gfh-hero-inner">
          <nav className="gfh-crumbs" aria-label="Breadcrumb">
            <Link href="/games/godforge">Godforge</Link> › <Link href="/games/godforge/hero-tier-list">Heroes</Link> › <span>{hero.name}</span>
          </nav>
          <div className="gfh-top">
            <div className="gfh-portrait">
              {hero.portrait_url && <img src={hero.portrait_url} alt={hero.name} />}
              {hero.faction_icon && <img className="gfh-corner gfh-corner--tl" src={hero.faction_icon} alt={realm ?? ''} />}
              {hero.archetype_icon && <img className="gfh-corner gfh-corner--tr" src={hero.archetype_icon} alt={hero.archetype ?? ''} />}
              {hero.affinity_icon && <img className="gfh-corner gfh-corner--bl" src={hero.affinity_icon} alt={hero.affinity ?? ''} />}
              {hero.allegiance_icon && <img className="gfh-corner gfh-corner--br" src={hero.allegiance_icon} alt={hero.allegiance ?? ''} />}
            </div>

            <div className="gfh-info">
              <span className="gfh-rarity">{hero.rarity}</span>
              <h1>{hero.name}</h1>
              {hero.title && <p className="gfh-title">{hero.title}</p>}
              <div className="gfh-pills">
                {[
                  { icon: hero.faction_icon, label: realm, desc: 'Realm' },
                  { icon: hero.archetype_icon, label: hero.archetype, desc: 'Archetype' },
                  { icon: hero.affinity_icon, label: hero.affinity, desc: 'Affinity' },
                  { icon: hero.allegiance_icon, label: hero.allegiance, desc: 'Allegiance' },
                ].filter((a) => a.label).map((a) => (
                  <span key={a.desc} className="gfh-pill">
                    {a.icon && <img src={a.icon} alt="" />}
                    <span><small>{a.desc}</small>{a.label}</span>
                  </span>
                ))}
              </div>
              {tier && (
                <Link href="/games/godforge/hero-tier-list" className="gfh-tier">
                  <span className="gfh-tier-badge" style={{ background: TIER_COLORS[tier] }}>{tier}</span>
                  <span><strong>{tier} tier</strong> among {hero.archetype}s<small>Quantum&apos;s Godforge tier list</small></span>
                </Link>
              )}
              {hero.summary && <p className="gfh-summary">{hero.summary}</p>}
              {hero.archetype_description && <p className="gfh-archetype">{hero.archetype}: {hero.archetype_description}.</p>}
            </div>

            {leader && <LeaderBonus skill={leader} />}
          </div>
        </div>
      </section>

      <GfHeroInteractive hero={hero} rarityColor={rarityColor} />

      <div className="container w-section">
        <QuantumTake game="godforge" id={slug} />

        {hero.lore && (
          <section className="w-card">
            <h2>{hero.name} lore</h2>
            <p className="gfh-lore">{hero.lore}</p>
          </section>
        )}

        <section className="w-card">
          <h2>Frequently asked questions</h2>
          {faq.map((f) => (
            <details key={f.q} className="gfh-faq">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>

        {similar.length > 0 && (
          <section className="w-card">
            <h2>Other {tier}-tier {hero.archetype}s</h2>
            <div className="qtb-grid gfh-tight">
              {similar.map((e) => <QTile key={e.id} e={e} tier={tier} size="sm" />)}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
