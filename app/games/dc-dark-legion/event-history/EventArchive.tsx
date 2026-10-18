'use client'

import { useMemo, useState } from 'react'
import type { ArchiveItem, ChampionRef, Source } from '@/src/dcdl/lib/event-history'

const FILTERS = [
  { id: 'themed', label: 'Themed events' },
  { id: 'all', label: 'Everything' },
  { id: 'new', label: 'New champion' },
  { id: 'rerun', label: 'Reruns' },
  { id: 'minor', label: 'Small events' },
  { id: 'collection', label: 'Collections' },
] as const
type FilterId = (typeof FILTERS)[number]['id']

const MECHANICS: Record<string, string> = {
  'shell-dig': 'Dig for prizes',
  'dice board': 'Dice board',
  pinball: 'Pinball',
  merge: 'Merge',
  'stone-breaking': 'Break stones',
  'ornament draw': 'Ornament draw',
  'multi-part': 'Multi-part',
  'slot battle': 'Slot battle',
}

const fmt = (d: string) =>
  d.length === 7
    ? new Date(`${d}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    : new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

export function SourceLine({ sources }: { sources: Source[] }) {
  const dates = [...new Set(sources.map((s) => s.postedAt).filter((d): d is string => !!d))].sort()
  if (dates.length === 0) return null
  return <div className="evh-src">Official post{dates.length > 1 ? 's' : ''}: {dates.map(fmt).join(', ')}</div>
}

function Portrait({ c, isNew }: { c: ChampionRef; isNew?: boolean }) {
  const name = c.name
  return (
    <a href={`/games/dc-dark-legion/heros/${c.id}`} className={`evh-chip${isNew ? ' is-new' : ''}`} title={c.name}>
      {c.image && <img src={c.image} alt="" loading="lazy" />}
      <span>{isNew ? `New: ${name}` : name}</span>
    </a>
  )
}

function Row({ e }: { e: ArchiveItem }) {
  const r = e.rewards
  const rewardBits = [
    r?.baseSkin && `${r.baseSkin} base skin`,
    r?.room && (r.room.toLowerCase().includes('style') ? r.room : `${r.room} room style`),
    r?.frame,
    r?.magicEyes && 'Magic Eyes',
    r?.worldAnvilFragments && 'World Anvil Fragments',
    ...(r?.other ?? []),
  ].filter(Boolean) as string[]
  return (
    <li className={`evh-row kind-${e.kind}`}>
      <div className="evh-row-date">
        <time dateTime={e.start}>{fmt(e.start)}</time>
        {e.end && <span> to {fmt(e.end)}</span>}
      </div>
      <div className="evh-row-main">
        <div className="evh-row-head">
          <h3>{e.name}</h3>
          {e.kind === 'minor' && <span className="evh-tag">Small event</span>}
          {e.kind === 'collection' && <span className="evh-tag">Limited collection</span>}
          {e.mechanic && <span className="evh-tag">{MECHANICS[e.mechanic] ?? e.mechanic}</span>}
          {e.rerun && <span className="evh-tag is-rerun">Rerun · {e.rerun.days} days after {fmt(e.rerun.previous)}</span>}
        </div>
        {(e.newChampions.length > 0 || e.featured.length > 0) && (
          <div className="evh-chips">
            {e.newChampions.map((c) => <Portrait key={c.id} c={c} isNew />)}
            {e.featured.map((c) => <Portrait key={c.id} c={c} />)}
          </div>
        )}
        {rewardBits.length > 0 && (
          <p className="evh-rewards"><span>Top rewards:</span> {rewardBits.join(' · ')}</p>
        )}
        {(e.notes || e.servers) && (
          <p className="evh-notes">{[e.servers && `Servers: ${e.servers}.`, e.notes].filter(Boolean).join(' ')}</p>
        )}
        <SourceLine sources={e.sources} />
      </div>
    </li>
  )
}

export default function EventArchive({ items }: { items: ArchiveItem[] }) {
  const [filter, setFilter] = useState<FilterId>('themed')
  const shown = useMemo(() => items.filter((e) => {
    switch (filter) {
      case 'all': return true
      case 'new': return e.newChampions.length > 0
      case 'rerun': return !!e.rerun
      default: return e.kind === filter
    }
  }), [items, filter])
  const years = [...new Set(shown.map((e) => e.start.slice(0, 4)))]

  return (
    <div>
      <div className="evh-filters" role="group" aria-label="Filter events">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" aria-pressed={filter === f.id} className={filter === f.id ? 'is-on' : ''} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      {years.map((y) => (
        <div key={y} className="evh-year">
          <h3 className="evh-year-label">{y}</h3>
          <ol className="evh-rows">
            {shown.filter((e) => e.start.startsWith(y)).map((e) => <Row key={e.id} e={e} />)}
          </ol>
        </div>
      ))}
      {shown.length === 0 && <p className="evh-muted">Nothing matches this filter yet.</p>}
    </div>
  )
}
