import Link from 'next/link'
import type { Metadata } from 'next'
import PatchNotesCard from '@/src/dcdl/components/PatchNotesCard'
import { getPatchNotes } from '@/src/dcdl/lib/content-db'
import '../../godforge/game.css'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Patch Notes Archive — DC: Dark Legion | Quantum Game Guides',
  description:
    'A running archive of DC: Dark Legion patch notes and update summaries, newest first — every balance change, event, and fix as it shipped.',
  alternates: { canonical: '/games/dc-dark-legion/patch-notes' },
}

function formatDate(d: string | null): string {
  if (!d) return ''
  const parsed = new Date(d + 'T00:00:00Z')
  if (Number.isNaN(parsed.getTime())) return d
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

export default async function PatchNotesArchivePage() {
  const entries = await getPatchNotes()

  return (
    <main style={{ '--game-accent': '#4f8ef7' } as React.CSSProperties}>
      <section className="gh-hero">
        <div className="container">
          <p className="gh-overline">DC: Dark Legion</p>
          <h1 className="gh-hero-title">Patch Notes Archive</h1>
          <p className="gh-hero-sub">
            Every DC: Dark Legion update we&rsquo;ve tracked, newest first — balance changes, events, and fixes as they shipped.
          </p>
          <div className="gh-hero-divider" />
          <div style={{ marginTop: '1rem' }}>
            <Link href="/games/dc-dark-legion/guides" style={{ fontSize: '0.78rem', color: 'var(--gold)', opacity: 0.85, textDecoration: 'none' }}>
              ← Hub
            </Link>
          </div>
        </div>
      </section>

      <section style={{ padding: '2rem 0 4rem' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '820px' }}>
          {entries.length === 0 && (
            <p style={{ color: '#777', fontStyle: 'italic' }}>No patch notes yet.</p>
          )}
          {entries.map((entry, i) => {
            const date = formatDate(entry.publishedAt)
            const heading = date || entry.title || 'Patch Notes'
            const label = i === 0 ? `${heading} · Latest` : heading
            return <PatchNotesCard key={entry.id} patchNotes={entry.body} title={label} />
          })}
        </div>
      </section>
    </main>
  )
}
