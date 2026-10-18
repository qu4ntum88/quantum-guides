import { FACT_LABELS, formatDate, getChampionTimeline } from '@/src/dcdl/lib/event-history'
import './event-strip.css'

/**
 * Champion page: this champion's dated release / rerun / event facts from the event + Bleed
 * history, linking to the full page. Renders nothing when the history has no facts for them.
 */
export default function ChampionEventStrip({ id, name }: { id: string; name: string }) {
  const { facts, events } = getChampionTimeline(id)
  // An event the champion debuted in is already covered by their "Event debut" fact.
  const featured = events.filter((e) => !e.isNew)
  if (facts.length === 0 && featured.length === 0) return null

  const rows = [
    ...facts.map((f) => ({ date: f.date, kind: FACT_LABELS[f.type], text: f.servers ? `${f.what} (Servers: ${f.servers}.)` : f.what })),
    ...featured.map((e) => ({ date: e.start, kind: 'Featured', text: `Featured in the ${e.name} event.` })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <section className="card" aria-labelledby="ces-heading">
      <h2 id="ces-heading">{name} Release and Event History</h2>
      <ol className="ces-list">
        {rows.map((r) => (
          <li key={r.date + r.kind + r.text}>
            <time dateTime={r.date}>{formatDate(r.date)}</time>
            <span><span className="ces-kind">{r.kind}</span>{r.text}</span>
          </li>
        ))}
      </ol>
      <div className="ces-foot">
        <span>From the official announcements. Bleed dates differ per server.</span>
        <a href="/games/dc-dark-legion/event-history">Full event and Bleed history →</a>
      </div>
    </section>
  )
}
