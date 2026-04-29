'use client'

import { useState, useMemo } from 'react'
import GfHeroBox, { type GfHero } from './GfHeroBox'

const RARITIES   = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common']
const AFFINITIES = ['Cunning', 'Eternal', 'Strength', 'Wisdom']
const ALLEGIANCES = ['Chaos', 'Order']
const ARCHETYPES = ['Brawler', 'Defender', 'Disrupter', 'Invoker', 'Slayer']
const FACTIONS = ['AARU', 'ASGARD', 'AVALON', 'EKUR', 'IZUMO', 'OLYMPUS', 'OMEYOCAN', 'TIAN', 'VYRAJ']

const RARITY_ORDER: Record<string, number> = { Legendary: 0, Epic: 1, Rare: 2, Uncommon: 3, Common: 4 }

type SortKey = 'name' | 'rarity' | 'affinity' | 'allegiance' | 'archetype' | 'faction'

const btnBase: React.CSSProperties = {
  background: 'none',
  border: '1px solid #444',
  borderRadius: '0.375rem',
  color: '#aaa',
  cursor: 'pointer',
  fontSize: '0.75rem',
  padding: '0.25rem 0.6rem',
  transition: 'background 0.1s, color 0.1s',
  whiteSpace: 'nowrap',
}

const btnActive: React.CSSProperties = {
  background: 'var(--purple, #6d28d9)',
  border: '1px solid var(--purple, #6d28d9)',
  color: '#fff',
}

function FilterRow({
  label, options, active, onToggle, onClear,
}: {
  label: string
  options: string[]
  active: string[]
  onToggle: (v: string) => void
  onClear: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', minWidth: '5.5rem' }}>
        {label}
      </span>
      <button
        type="button"
        onClick={onClear}
        style={{ ...btnBase, ...(active.length === 0 ? btnActive : {}) }}
      >
        ALL
      </button>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          style={{ ...btnBase, ...(active.includes(opt) ? btnActive : {}) }}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export default function GfHeroGrid({ heroes }: { heroes: GfHero[] }) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [filterRarity, setFilterRarity] = useState<string[]>([])
  const [filterAffinity, setFilterAffinity] = useState<string[]>([])
  const [filterAllegiance, setFilterAllegiance] = useState<string[]>([])
  const [filterArchetype, setFilterArchetype] = useState<string[]>([])
  const [filterFaction, setFilterFaction] = useState<string[]>([])

  function toggle(list: string[], set: (v: string[]) => void, val: string) {
    set(list.includes(val) ? list.filter((x) => x !== val) : [...list, val])
  }

  const filtered = useMemo(() => {
    let result = heroes

    if (query) {
      const q = query.toLowerCase()
      result = result.filter((h) => h.name.toLowerCase().includes(q))
    }
    if (filterRarity.length > 0)
      result = result.filter((h) => h.rarity && filterRarity.includes(h.rarity))
    if (filterAffinity.length > 0)
      result = result.filter((h) => h.affinity && filterAffinity.includes(h.affinity))
    if (filterAllegiance.length > 0)
      result = result.filter((h) => h.allegiance && filterAllegiance.includes(h.allegiance))
    if (filterArchetype.length > 0)
      result = result.filter((h) => h.archetype && filterArchetype.includes(h.archetype))
    if (filterFaction.length > 0)
      result = result.filter((h) => h.faction && filterFaction.includes(h.faction))

    return [...result].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      if (sortKey === 'rarity') {
        const ar = a.rarity ? (RARITY_ORDER[a.rarity] ?? 99) : 99
        const br = b.rarity ? (RARITY_ORDER[b.rarity] ?? 99) : 99
        return ar !== br ? ar - br : a.name.localeCompare(b.name)
      }
      const av = a[sortKey] ?? 'zzz'
      const bv = b[sortKey] ?? 'zzz'
      const cmp = av.localeCompare(bv)
      return cmp !== 0 ? cmp : a.name.localeCompare(b.name)
    })
  }, [heroes, query, sortKey, filterRarity, filterAffinity, filterAllegiance, filterArchetype, filterFaction])

  const sortKeys: { key: SortKey; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'rarity', label: 'Rarity' },
    { key: 'faction', label: 'Faction' },
    { key: 'archetype', label: 'Archetype' },
    { key: 'affinity', label: 'Affinity' },
    { key: 'allegiance', label: 'Allegiance' },
  ]

  const hasFilters =
    filterRarity.length > 0 || filterAffinity.length > 0 || filterAllegiance.length > 0 ||
    filterArchetype.length > 0 || filterFaction.length > 0 || query

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Search */}
      <input
        type="search"
        placeholder="Search heroes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          background: '#1a1a1a', border: '1px solid #444', borderRadius: '0.5rem',
          color: '#fff', padding: '0.6rem 1rem', fontSize: '0.95rem', width: '100%',
        }}
      />

      {/* Sort */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', minWidth: '5.5rem' }}>Sort by</span>
        {sortKeys.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSortKey(key)}
            style={{ ...btnBase, ...(sortKey === key ? { ...btnActive, background: 'var(--gold, #cca453)', borderColor: 'var(--gold, #cca453)', color: '#111' } : {}) }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <FilterRow label="Rarity" options={RARITIES} active={filterRarity} onToggle={(v) => toggle(filterRarity, setFilterRarity, v)} onClear={() => setFilterRarity([])} />
        <FilterRow label="Affinity" options={AFFINITIES} active={filterAffinity} onToggle={(v) => toggle(filterAffinity, setFilterAffinity, v)} onClear={() => setFilterAffinity([])} />
        <FilterRow label="Allegiance" options={ALLEGIANCES} active={filterAllegiance} onToggle={(v) => toggle(filterAllegiance, setFilterAllegiance, v)} onClear={() => setFilterAllegiance([])} />
        <FilterRow label="Archetype" options={ARCHETYPES} active={filterArchetype} onToggle={(v) => toggle(filterArchetype, setFilterArchetype, v)} onClear={() => setFilterArchetype([])} />
        <FilterRow label="Faction" options={FACTIONS} active={filterFaction} onToggle={(v) => toggle(filterFaction, setFilterFaction, v)} onClear={() => setFilterFaction([])} />
      </div>

      {/* Results count + reset */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: '#666' }}>{filtered.length} heroes</span>
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setQuery(''); setFilterRarity([]); setFilterAffinity([]); setFilterAllegiance([]); setFilterArchetype([]); setFilterFaction([]) }}
            style={{ ...btnBase, color: '#f87171', borderColor: '#7f1d1d' }}
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0
        ? <p style={{ color: '#555', fontSize: '0.9rem' }}>No heroes match the current filters.</p>
        : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(8rem, 1fr))',
            gap: '0.6rem',
          }}>
            {filtered.map((hero) => <GfHeroBox key={hero.id} hero={hero} />)}
          </div>
        )
      }
    </div>
  )
}
