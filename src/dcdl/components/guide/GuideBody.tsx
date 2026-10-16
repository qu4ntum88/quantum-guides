import GuideToc from '@/app/games/dc-dark-legion/guides/GuideToc'
import type { GuideFull } from '@/src/dcdl/lib/content-db'
import type { Heading } from '@/src/dcdl/lib/guide-render'
import '@/app/games/dc-dark-legion/guides/guide-prose.css'

/**
 * A guide's article column (event summary box + body) and its sticky table of
 * contents. Shared by every game's guide page; each page supplies its own hero.
 */

function SummaryLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'Unbounded, sans-serif',
      fontSize: '0.58rem',
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--gold)',
      marginBottom: '0.3rem',
      opacity: 0.85,
    }}>
      {children}
    </div>
  )
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <SummaryLabel>{label}</SummaryLabel>
      <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.82)', lineHeight: 1.5 }}>{value}</div>
    </div>
  )
}

function EventSummaryBox({ guide }: { guide: GuideFull }) {
  const keyRewards = guide.keyRewards ?? []
  return (
    <div style={{
      background: 'rgba(204, 164, 83, 0.055)',
      border: '1px solid rgba(204, 164, 83, 0.22)',
      borderTop: '2px solid rgba(204, 164, 83, 0.55)',
      borderRadius: '8px',
      padding: '1.25rem 1.5rem',
      marginBottom: '2rem',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '1rem',
    }}>
      {guide.eventType ? <SummaryField label="Event Type" value={guide.eventType} /> : null}
      {guide.eventDates ? <SummaryField label="Dates" value={guide.eventDates} /> : null}
      {guide.recommendedFor ? <SummaryField label="Recommended For" value={guide.recommendedFor} /> : null}
      {keyRewards.length > 0 && (
        <div style={{ gridColumn: '1 / -1' }}>
          <SummaryLabel>Key Rewards</SummaryLabel>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
            {keyRewards.map((reward, i) => (
              <span key={i} style={{
                background: 'rgba(204, 164, 83, 0.1)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.82rem',
                padding: '0.2rem 0.65rem',
                borderRadius: '4px',
                border: '1px solid rgba(204, 164, 83, 0.2)',
              }}>
                {reward}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function GuideBody({ guide, html, headings }: { guide: GuideFull; html: string; headings: Heading[] }) {
  const hasToc = headings.length >= 2
  const hasSummary = !!(guide.eventType || guide.eventDates || guide.recommendedFor || guide.keyRewards?.length)

  return (
    <div
      className="container"
      style={{ maxWidth: hasToc ? '1080px' : '820px', paddingTop: '2.5rem', paddingBottom: '4rem' }}
    >
      <div className={hasToc ? 'guide-layout guide-layout--toc' : 'guide-layout'}>
        <div>
          {hasSummary && <EventSummaryBox guide={guide} />}
          <article className="guide-prose" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
        {hasToc && (
          <div className="guide-toc-col">
            <GuideToc headings={headings} />
          </div>
        )}
      </div>
    </div>
  )
}
