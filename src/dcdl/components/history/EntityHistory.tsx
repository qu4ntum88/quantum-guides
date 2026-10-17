import TakeBody from '@/src/dcdl/components/TakeBody'
import type { HistoryEntry, HistoryKind } from '@/src/dcdl/lib/history-db'
import './history.css'

export const HISTORY_KINDS: Record<HistoryKind, { label: string; color: string }> = {
  release: { label: 'Release', color: '#f5c542' },
  rework: { label: 'Rework', color: '#a855f7' },
  buff: { label: 'Buff', color: '#22c55e' },
  nerf: { label: 'Nerf', color: '#ef4444' },
  rerun: { label: 'Rerun', color: '#3b82f6' },
  change: { label: 'Change', color: '#94a3b8' },
}

const fmt = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })

/**
 * A champion's or legacy piece's History: dated entries, newest first, each
 * written like a short post with Quantum's take underneath. Renders nothing until
 * at least one entry has been approved.
 */
export default function EntityHistory({ name, entries }: { name: string; entries: HistoryEntry[] }) {
  if (entries.length === 0) return null
  return (
    <section className="card eh" aria-labelledby="history-heading">
      <h2 id="history-heading">{name} History</h2>
      <ol className="eh-list">
        {entries.map((e) => {
          const k = HISTORY_KINDS[e.kind] ?? HISTORY_KINDS.change
          return (
            <li key={e.id} className="eh-entry" style={{ '--eh-c': k.color } as React.CSSProperties}>
              <article>
                <header className="eh-head">
                  <span className="eh-kind">{k.label}</span>
                  <time dateTime={e.eventDate}>{fmt(e.eventDate)}</time>
                  {e.servers && <span className="eh-servers">{e.servers}</span>}
                </header>
                <h3 className="eh-title">{e.title}</h3>
                {e.body && <TakeBody text={e.body} />}
                {e.take && (
                  <div className="eh-take">
                    <div className="eh-take-label">Quantum&apos;s take</div>
                    <TakeBody text={e.take} />
                  </div>
                )}
                <footer className="eh-byline">By {e.author}</footer>
              </article>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
