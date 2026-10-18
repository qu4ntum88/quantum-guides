import { getDataLastUpdated } from '@/src/dcdl/lib/data'
import {
  getArchive, getBleedRules, getCaveats, getChampionFirsts, getChampionReruns, getDevStatements,
  getMilestones, getObservations, getQuantumsTake, formatDate,
} from '@/src/dcdl/lib/event-history'
import TakeBody from '@/src/dcdl/components/TakeBody'
import JsonLd from '@/app/components/JsonLd'
import { pageMeta, breadcrumbLd, DCDL_CRUMB } from '@/src/lib/seo'
import EventArchive, { SourceLine } from './EventArchive'
import '../../godforge/game.css'
import './event-history.css'

const PATH = '/games/dc-dark-legion/event-history'

export const metadata = pageMeta({
  title: 'Event and Bleed History: DC: Dark Legion',
  description:
    'Every DC: Dark Legion themed event, new champion, rerun and Bleed rule change since launch, dated from the official announcements, with the patterns so far.',
  path: PATH,
})

export default function EventHistoryPage() {
  const updated = getDataLastUpdated('event-history.json')
  const archive = getArchive()
  const firsts = getChampionFirsts()
  const { reruns, permanent } = getChampionReruns()
  const observations = getObservations()
  const take = getQuantumsTake()
  const caveats = getCaveats()

  return (
    <main className="evh">
      <JsonLd data={breadcrumbLd([DCDL_CRUMB, ['Event and Bleed History', PATH]])} />
      <section className="gh-hero" style={{ '--game-accent': '#CCA453' } as React.CSSProperties}>
        <div className="container">
          <p className="gh-overline">DC: Dark Legion · History</p>
          <h1 className="gh-hero-title">Events and Bleed History</h1>
          <p className="gh-hero-sub">
            Every themed event, new champion, rerun and Bleed rule change, dated from the official announcements. Use it to judge whether to spend now or wait.
          </p>
          <div className="gh-hero-divider" />
          <div className="evh-hero-meta">
            {updated && <span className="evh-updated">Updated: {updated}</span>}
            <a href="/games/dc-dark-legion/champion-tier-list">← Champion List</a>
          </div>
        </div>
      </section>

      <div className="container evh-body">
        <div className="evh-warn" role="note">
          <strong>Bleed order differs per server.</strong> Champion dates here are when the oldest servers got them; newer servers get each champion later, on their own schedule.
        </div>

        <section className="evh-card evh-obs" aria-labelledby="evh-obs-h">
          <div className="evh-obs-label">Observed patterns · not confirmed by the developers</div>
          <h2 id="evh-obs-h">What the history shows so far</h2>
          <ul>
            {observations.map((o) => (
              <li key={o.text}>
                <p>{o.text}</p>
                <p className="evh-basis">Based on: {o.basis}</p>
              </li>
            ))}
          </ul>
          <p className="evh-muted">Past patterns can break at any time. The developers have said Bleed plans are always subject to change.</p>
          {take && (
            <div className="evh-take">
              <div className="evh-take-label">Quantum&apos;s take: spend now or wait?</div>
              <TakeBody text={take} />
            </div>
          )}
        </section>

        <section className="evh-section" aria-labelledby="evh-events-h">
          <h2 id="evh-events-h">Events by month</h2>
          <p className="evh-lead">Each month&apos;s themed event with its new champions and top rewards. Switch the filter to see small events, reruns and limited collections.</p>
          <EventArchive items={archive} />
        </section>

        <section className="evh-section" aria-labelledby="evh-champs-h">
          <h2 id="evh-champs-h">New champions, newest first</h2>
          <p className="evh-lead">The date of the official reveal or the event where they debuted, and the legacy piece when the patch notes name it.</p>
          <ol className="evh-champs">
            {firsts.map(({ champion, fact, how, legacy }) => (
              <li key={champion.id} className="evh-champ">
                <a href={`/games/dc-dark-legion/heros/${champion.id}`} className="evh-champ-head">
                  {champion.image && <img src={champion.image} alt="" loading="lazy" />}
                  <div>
                    <div className="evh-champ-name">{champion.name}</div>
                    <div className="evh-champ-date">{formatDate(fact.date)} · {how}{fact.servers ? ` · ${fact.servers}` : ''}</div>
                  </div>
                </a>
                <p>{fact.what}</p>
                {legacy && (
                  <p className="evh-champ-legacy">
                    Legacy: <a href={`/games/dc-dark-legion/legacy/${legacy.id}`}>{legacy.name}</a> ({formatDate(legacy.date)})
                  </p>
                )}
                <SourceLine sources={fact.sources} />
              </li>
            ))}
          </ol>
        </section>

        <section className="evh-section" aria-labelledby="evh-reruns-h">
          <h2 id="evh-reruns-h">Reruns and the permanent tracker</h2>
          <p className="evh-lead">
            Only reruns an official post confirms. Regular Bleed reruns happen on each server&apos;s own schedule and are announced in game, not on Discord.
          </p>
          <div className="evh-grid2">
            <div className="evh-card">
              <h3>Confirmed reruns</h3>
              <ul className="evh-list">
                {reruns.map((r) => (
                  <li key={r.champion.id + r.fact.date}>
                    <div className="evh-list-head">
                      <a href={`/games/dc-dark-legion/heros/${r.champion.id}`}>{r.champion.name}</a>
                      <time dateTime={r.fact.date}>{formatDate(r.fact.date)}</time>
                    </div>
                    <p>{r.fact.what}</p>
                    <SourceLine sources={r.fact.sources} />
                  </li>
                ))}
              </ul>
            </div>
            <div className="evh-card">
              <h3>Permanent custom tracker</h3>
              <p className="evh-muted">Pick one as your rate-up champion; it never leaves the Bleed. Older servers got it first.</p>
              <div className="evh-perm">
                {permanent.map((r) => (
                  <a key={r.champion.id} href={`/games/dc-dark-legion/heros/${r.champion.id}`} className="evh-perm-item">
                    {r.champion.image && <img src={r.champion.image} alt="" loading="lazy" />}
                    <span>{r.champion.name}</span>
                    {r.days != null && <small>{r.days} days after {formatDate(r.firstDate!)}</small>}
                  </a>
                ))}
              </div>
              {permanent[0] && <SourceLine sources={permanent[0].fact.sources} />}
            </div>
          </div>
        </section>

        <section className="evh-section" aria-labelledby="evh-rules-h">
          <h2 id="evh-rules-h">Bleed rules and what the developers have said</h2>
          <div className="evh-grid2">
            <div className="evh-card">
              <h3>Bleed rule changes</h3>
              <ul className="evh-list">
                {getBleedRules().map((r) => (
                  <li key={r.date + r.what}>
                    <div className="evh-list-head"><time dateTime={r.date}>{formatDate(r.date)}</time></div>
                    <p>{r.what}</p>
                    <SourceLine sources={r.sources} />
                  </li>
                ))}
              </ul>
            </div>
            <div className="evh-card">
              <h3>Developer statements</h3>
              <ul className="evh-list">
                {getDevStatements().map((r) => (
                  <li key={r.date + r.what}>
                    <div className="evh-list-head"><time dateTime={r.date}>{formatDate(r.date)}</time></div>
                    <p>{r.what}</p>
                    <SourceLine sources={r.sources} />
                  </li>
                ))}
              </ul>
              <h3 style={{ marginTop: '1.5rem' }}>Key dates</h3>
              <ul className="evh-list">
                {getMilestones().map((r) => (
                  <li key={r.date + r.what}>
                    <div className="evh-list-head"><time dateTime={r.date}>{formatDate(r.date)}</time></div>
                    <p>{r.what}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="evh-section evh-about">
          <h2>About this page</h2>
          <ul>
            {caveats.map((c) => <li key={c}>{c}</li>)}
            <li>Every entry comes from an official DC: Dark Legion announcement on Discord; the date under each line is when that post went up.</li>
          </ul>
        </section>
      </div>

      <section className="evh-logos">
        <div className="container">
          <img src="/images/site/Q%20GOLD%20FULL%20ICON.png" alt="Quantum Game Guides" />
          <img src="/dcdl/logos/Game_logo_-_blue_white.png" alt="DC: Dark Legion" />
        </div>
      </section>
    </main>
  )
}
