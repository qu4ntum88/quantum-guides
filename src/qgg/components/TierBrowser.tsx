'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import FilterBar, { type FilterGroup, type FilterPill } from '@/src/dcdl/components/FilterBar'
import ViewToggle, { useViewMode, CONTROL_INPUT } from '@/src/dcdl/components/tier/ViewToggle'
import QTile, { type TileEntity } from './QTile'
import { RARITY_ORDER, TIER_COLORS, type BoardRow } from '../tiers'

export interface BrowserEntity extends TileEntity {
  /** The board column this entity sits in (class / archetype / role). */
  group: string | null
  /** Filterable values by filter key, e.g. { element: 'Fire', faction: 'Magi' }. */
  facets: Record<string, string | null>
  /** Extra words that count as a search match (effects, titles…). */
  search?: string
}

export interface BrowserFilter {
  key: string
  label: string
  /** URL param that preselects it (?element=Fire). */
  param: string
  options: string[]
}

type Sort = 'tier' | 'name' | 'rarity'

/**
 * The tier list / database page shared by every game except DC: Dark Legion: a tier
 * board (tier rows × class columns) or a filterable grid, in a Quantum-branded frame.
 * Filters dim non-matches on the board and remove them in the grid. The game's look
 * comes from the `data-world` wrapper (see src/qgg/worlds.css).
 */
export default function TierBrowser({
  entities,
  rows,
  tierOrder,
  columns,
  filters,
  icons,
  storageKey,
  boardTitle,
  boardNote,
  listNav,
  unrankedLabel = 'Not ranked yet',
  searchPlaceholder = 'Search…',
}: {
  entities: BrowserEntity[]
  rows: BoardRow[]
  tierOrder: readonly string[]
  columns: { key: string; label: string; icon?: string | null }[]
  filters: BrowserFilter[]
  icons: Record<string, string>
  storageKey: string
  boardTitle: string
  boardNote?: string | null
  listNav?: { label: string; items: { href: string; label: string; active: boolean }[] }
  unrankedLabel?: string
  searchPlaceholder?: string
}) {
  const [view, setView] = useViewMode(storageKey)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('tier')
  const [selected, setSelected] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(filters.map((f) => [f.key, []])),
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const init = Object.fromEntries(
      filters.map((f) => [f.key, params.getAll(f.param).flatMap((v) => v.split(',')).filter((v) => f.options.includes(v))]),
    )
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL after mount
    if (Object.values(init).some((v) => v.length)) setSelected(init)
  }, [filters])

  const byId = useMemo(() => new Map(entities.map((e) => [e.id, e])), [entities])
  const tierOf = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of rows) for (const g of r.groups) for (const id of g.members) m.set(id, r.tier)
    return m
  }, [rows])
  const tierRank = (t: string | undefined) => {
    const i = t ? tierOrder.indexOf(t) : -1
    return i < 0 ? tierOrder.length : i
  }

  const q = query.trim().toLowerCase()
  const active = filters.some((f) => selected[f.key]?.length) || q.length > 0
  const matches = (e: BrowserEntity) =>
    filters.every((f) => !selected[f.key]?.length || selected[f.key].includes(e.facets[f.key] ?? '')) &&
    (!q || e.name.toLowerCase().includes(q) || (e.search ?? '').toLowerCase().includes(q))

  const toggle = (key: string, v: string) =>
    setSelected((s) => ({ ...s, [key]: s[key].includes(v) ? s[key].filter((x) => x !== v) : [...s[key], v] }))

  const groups: FilterGroup[] = filters.map((f) => ({
    id: f.key,
    label: f.label,
    count: selected[f.key]?.length ?? 0,
    onClear: () => setSelected((s) => ({ ...s, [f.key]: [] })),
    content: f.options.map((v) => (
      <button
        key={v}
        type="button"
        className={`qtb-chip${selected[f.key]?.includes(v) ? ' is-on' : ''}`}
        onClick={() => toggle(f.key, v)}
      >
        {icons[v] && <img src={icons[v]} alt="" />}
        {v}
      </button>
    )),
  }))
  const pills: FilterPill[] = filters.flatMap((f) =>
    (selected[f.key] ?? []).map((v) => ({ key: `${f.key}:${v}`, label: v, icon: icons[v], onRemove: () => toggle(f.key, v) })),
  )

  const unranked = entities.filter((e) => !tierOf.has(e.id))
  const matchCount = entities.filter(matches).length
  const shown = entities
    .filter(matches)
    .sort((a, b) =>
      sort === 'name'
        ? a.name.localeCompare(b.name)
        : sort === 'rarity'
          ? RARITY_ORDER.indexOf(a.rarity ?? '') - RARITY_ORDER.indexOf(b.rarity ?? '') || a.name.localeCompare(b.name)
          : tierRank(tierOf.get(a.id)) - tierRank(tierOf.get(b.id)) || a.name.localeCompare(b.name),
    )
  const orderedRows = [...rows].sort((a, b) => tierRank(a.tier) - tierRank(b.tier))

  return (
    <div className="qtb">
      {listNav && (
        <nav className="qtb-lists" aria-label={listNav.label}>
          <span className="qtb-lists-label">{listNav.label}</span>
          {listNav.items.map((it) => (
            <Link key={it.href} href={it.href} className={`qtb-list${it.active ? ' is-on' : ''}`} aria-current={it.active ? 'page' : undefined}>
              {it.label}
            </Link>
          ))}
        </nav>
      )}

      <div className="qtb-controls">
        <ViewToggle view={view} onChange={setView} />
        <input
          type="search"
          className="qtb-search"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={CONTROL_INPUT}
          aria-label="Search"
        />
        {view === 'grid' && (
          <select className="qtb-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort by">
            <option value="tier">Sort: Tier</option>
            <option value="rarity">Sort: Rarity</option>
            <option value="name">Sort: Name</option>
          </select>
        )}
      </div>

      {filters.length > 0 && (
        <FilterBar
          groups={groups}
          pills={pills}
          after={active ? <span className="qtb-count">{matchCount} of {entities.length} match</span> : undefined}
        />
      )}

      <section className="qtb-frame" aria-label={boardTitle}>
        <span className="q-corner q-corner--tl" aria-hidden="true" />
        <span className="q-corner q-corner--tr" aria-hidden="true" />
        <span className="q-corner q-corner--bl" aria-hidden="true" />
        <span className="q-corner q-corner--br" aria-hidden="true" />
        <header className="qtb-head">
          <img src="/images/site/Q GOLD ICON.png" alt="" className="qtb-head-q" />
          <span className="qtb-head-title">{boardTitle}</span>
          {boardNote && <span className="qtb-head-note">{boardNote}</span>}
        </header>
        <div className="qtb-ornament" aria-hidden="true" />

        {view === 'tier' ? (
          <div className="qtb-board" style={{ '--cols': columns.length } as React.CSSProperties}>
            <div className="qtb-colhead">
              <span />
              {columns.map((c) => (
                <span key={c.key} className="qtb-col">
                  {c.icon && <img src={c.icon} alt="" />}
                  {c.label}
                </span>
              ))}
            </div>
            {orderedRows.map((r) => (
              <div key={r.tier} className="qtb-row" style={{ '--tier': TIER_COLORS[r.tier] ?? '#666' } as React.CSSProperties}>
                <span className="qtb-plate">
                  <span className="qtb-plate-letter">{r.tier}</span>
                </span>
                {columns.map((c) => {
                  const members = r.groups.find((g) => g.role === c.key)?.members ?? []
                  return (
                    <div key={c.key} className={`qtb-cell${members.length ? '' : ' is-empty'}`}>
                      {members.length > 0 && (
                        <span className="qtb-cell-label">
                          {c.icon && <img src={c.icon} alt="" />}
                          {c.label}
                        </span>
                      )}
                      {members.map((id) => {
                        const e = byId.get(id)
                        return e ? <QTile key={id} e={e} size="sm" dimmed={active && !matches(e)} /> : null
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
            {unranked.length > 0 && (
              <div className="qtb-row qtb-row--unranked">
                <span className="qtb-plate qtb-plate--none">
                  <span className="qtb-plate-letter">{unrankedLabel}</span>
                </span>
                <div className="qtb-cell qtb-cell--wide">
                  {unranked.map((e) => (
                    <QTile key={e.id} e={e} size="sm" dimmed={active && !matches(e)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="qtb-grid">
            {shown.map((e) => (
              <QTile key={e.id} e={e} tier={tierOf.get(e.id) ?? null} />
            ))}
            {shown.length === 0 && <p className="qtb-empty">Nothing matches those filters. Clear one to see more.</p>}
          </div>
        )}
      </section>
    </div>
  )
}
