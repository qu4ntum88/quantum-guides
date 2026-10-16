import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getGameInfo, getGuide, getGuidesFull, getGuidesList, getPatchNotes } from '@/src/dcdl/lib/content-db'
import { renderGuideBody } from '@/src/dcdl/lib/guide-render'
import GuideBody from '@/src/dcdl/components/guide/GuideBody'
import PatchNotesCard from '@/src/dcdl/components/PatchNotesCard'
import WorldHero, { type World } from '@/src/qgg/components/WorldHero'
import JsonLd from '@/app/components/JsonLd'
import { articleLd, breadcrumbLd, GF_CRUMB, INV_CRUMB, pageMeta, VH_CRUMB, type Crumb } from '@/src/lib/seo'
import { guideGame, guidePath, type GuideGame } from '@/src/lib/guide-games'

/**
 * CMS guides, patch notes and codes for the three themed games (Godforge,
 * Invokers, Void Hunters). Each game's `guides/[id]/page.tsx` is a few lines
 * over these; DCDL keeps its own pages. Content comes from Supabase with the
 * same 60s refresh as the DCDL guides, so a guide published in the Site Admin
 * renders on demand without a deploy.
 */

type WorldGame = Exclude<GuideGame, 'dcdl'>

const WORLD: Record<WorldGame, { world: World; crumb: Crumb; short: string; accent: string }> = {
  godforge: { world: 'godforge', crumb: GF_CRUMB, short: 'Godforge', accent: 'var(--w-accent)' },
  invokers: { world: 'invokers', crumb: INV_CRUMB, short: 'Invokers', accent: 'var(--w-accent-2)' },
  voidhunters: { world: 'voidhunters', crumb: VH_CRUMB, short: 'Void Hunters', accent: 'var(--w-accent)' },
}

export async function worldGuideParams(game: WorldGame) {
  const guides = await getGuidesFull(game)
  return guides.map((g) => ({ id: g.id }))
}

export async function worldGuideMetadata(game: WorldGame, id: string) {
  const guide = await getGuide(id, game)
  if (!guide) return {}
  const { short } = WORLD[game]
  return pageMeta({
    title: guide.title.toLowerCase().includes(short.toLowerCase()) ? guide.title : `${guide.title}: ${short} Guide`,
    description: guide.description || `${guide.title}, a ${guideGame(game).label} guide by ${guide.author || 'Quantum'}.`,
    path: guidePath(game, guide.id),
    image: guide.coverImage,
    type: 'article',
  })
}

export async function WorldGuideArticle({ game, id }: { game: WorldGame; id: string }) {
  const guide = await getGuide(id, game)
  if (!guide) return notFound()

  const { world, crumb, short, accent } = WORLD[game]
  const { html, headings } = await renderGuideBody(guide.body)
  const path = guidePath(game, guide.id)
  const byline = [guide.pubDate, guide.author && `by ${guide.author}`].filter(Boolean).join(' · ')

  return (
    // guide-prose and the editor's "Gold" text colour read --gold; use the world's accent.
    <main style={{ '--gold': accent } as React.CSSProperties}>
      <JsonLd
        data={[
          breadcrumbLd([crumb, [guide.title, path]]),
          articleLd({
            title: guide.title,
            description: guide.description,
            path,
            image: guide.coverImage,
            author: guide.author,
            published: guide.pubDate,
          }),
        ]}
      />
      <WorldHero
        world={world}
        overline={`${short} Guide`}
        title={guide.title}
        sub={guide.description || undefined}
        note={byline || undefined}
        art={guide.coverImage}
      >
        <Link href={guideGame(game).hub} className="btn">← {short} Guides</Link>
      </WorldHero>

      <GuideBody guide={guide} html={html} headings={headings} />
    </main>
  )
}

/** The game's written guides as cards, for its hub page. Renders nothing while it has none. */
export async function WorldGuideCards({ game, title = 'Guides' }: { game: GuideGame; title?: string }) {
  const guides = await getGuidesList(game).catch(() => [])
  if (guides.length === 0) return null
  return (
    <section className="w-card">
      <h2>{title}</h2>
      <div className="w-guides">
        {guides.map((g) => (
          <Link key={g.id} href={guidePath(g.game, g.id)} className="w-guide">
            <strong>{g.title}</strong>
            {g.description && <p>{g.description}</p>}
            {(g.pubDate || g.author) && (
              <small>{[g.pubDate, g.author && `by ${g.author}`].filter(Boolean).join(' · ')}</small>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}

/** The game's latest patch notes and any active codes. Renders nothing while it has neither. */
export async function WorldGameNews({ game }: { game: GuideGame }) {
  const [notes, info] = await Promise.all([
    getPatchNotes(game).catch(() => []),
    getGameInfo(game).catch(() => ({ latestServer: '', patchNotes: '', gameCodes: [] as string[] })),
  ])
  const latest = notes[0]
  if (!latest && info.gameCodes.length === 0) return null
  return (
    <>
      {info.gameCodes.length > 0 && (
        <section className="w-card">
          <h2>Active codes</h2>
          <div className="w-codes">
            {info.gameCodes.map((c) => <code key={c}>{c}</code>)}
          </div>
        </section>
      )}
      {latest && (
        <div style={{ '--gold': 'var(--w-accent)' } as React.CSSProperties}>
          <PatchNotesCard
            patchNotes={latest.body}
            title={latest.title && latest.title !== 'Patch Notes' ? latest.title : 'Latest Patch Notes'}
          />
        </div>
      )}
    </>
  )
}
