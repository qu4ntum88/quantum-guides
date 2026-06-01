'use client'

import { useState, useMemo } from 'react'
import GfHeroBox, { type GfHero } from './GfHeroBox'
import { STATUS_EFFECTS, extractEffectIds, EFFECT_COLOR, INSTANT_EFFECTS } from '../lib/statusEffects'

const RARITIES   = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common']
const AFFINITIES = ['Cunning', 'Eternal', 'Strength', 'Wisdom']
const ALLEGIANCES = ['Chaos', 'Order']
const ARCHETYPES = ['Brawler', 'Defender', 'Disruptor', 'Invoker', 'Slayer']
const FACTIONS = ['Aaru', 'Asgard', 'Avalon', 'Ekur', 'Izumo', 'Olympus', 'Omeyocan', 'Tian', 'Vyraj']

const RARITY_ORDER: Record<string, number> = { Legendary: 0, Epic: 1, Rare: 2, Uncommon: 3, Common: 4 }

const BUFFS   = STATUS_EFFECTS.filter(e => e.category === 'buff')
const DEBUFFS = STATUS_EFFECTS.filter(e => e.category === 'debuff')
const DISABLES = STATUS_EFFECTS.filter(e => e.category === 'disable')

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

const selectStyle: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '0.375rem',
  color: '#aaa',
  fontSize: '0.75rem',
  padding: '0.25rem 0.5rem',
  cursor: 'pointer',
  minWidth: '9rem',
  appearance: 'none' as const,
  WebkitAppearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.5rem center',
  paddingRight: '1.5rem',
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

function EffectSelect({
  label, effects, value, onChange, color,
}: {
  label: string
  effects: typeof STATUS_EFFECTS
  value: string
  onChange: (v: string) => void
  color: string
}) {
  const active = value !== ''
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', minWidth: '5.5rem' }}>
        {label}
      </span>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            ...selectStyle,
            borderColor: active ? `${color}88` : '#333',
            color: active ? color : '#aaa',
          }}
        >
          <option value="">All</option>
          {effects.map(e => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>
      {active && (
        <button
          type="button"
          onClick={() => onChange('')}
          style={{ ...btnBase, color: '#f87171', borderColor: '#7f1d1d', padding: '0.2rem 0.45rem', fontSize: '0.65rem' }}
        >
          ✕
        </button>
      )}
    </div>
  )
}

function heroInstantEffectSet(hero: GfHero): Set<string> {
  const set = new Set<string>()
  for (const skill of (hero.skills ?? [])) {
    for (const eff of (skill.effects ?? [])) {
      set.add(eff.effect_name)
    }
  }
  return set
}

function heroSkillText(hero: GfHero): string {
  const parts: string[] = []
  for (const skill of (hero.skills ?? [])) {
    if (skill.description) parts.push(skill.description)
    for (const aw of (skill.awakening_bonuses ?? [])) {
      if (aw.upgrade_description) parts.push(aw.upgrade_description)
    }
  }
  for (const aw of (hero.awakening_bonuses ?? [])) {
    if (aw.description) parts.push(aw.description)
  }
  return parts.join(' ')
}

export default function GfHeroGrid({ heroes }: { heroes: GfHero[] }) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [filterRarity, setFilterRarity] = useState<string[]>([])
  const [filterAffinity, setFilterAffinity] = useState<string[]>([])
  const [filterAllegiance, setFilterAllegiance] = useState<string[]>([])
  const [filterArchetype, setFilterArchetype] = useState<string[]>([])
  const [filterFaction, setFilterFaction] = useState<string[]>([])
  const [filterBuff, setFilterBuff] = useState('')
  const [filterDebuff, setFilterDebuff] = useState('')
  const [filterDisable, setFilterDisable] = useState('')
  const [filterInstant, setFilterInstant] = useState('')

  function toggle(list: string[], set: (v: string[]) => void, val: string) {
    set(list.includes(val) ? list.filter((x) => x !== val) : [...list, val])
  }

  // Pre-compute effect ID sets and instant effect sets per hero
  const heroEffectSets = useMemo(() => {
    const map = new Map<number, Set<string>>()
    for (const hero of heroes) {
      map.set(hero.id, extractEffectIds(heroSkillText(hero)))
    }
    return map
  }, [heroes])

  const heroInstantSets = useMemo(() => {
    const map = new Map<number, Set<string>>()
    for (const hero of heroes) {
      map.set(hero.id, heroInstantEffectSet(hero))
    }
    return map
  }, [heroes])

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
    if (filterBuff)
      result = result.filter(h => heroEffectSets.get(h.id)?.has(filterBuff))
    if (filterDebuff)
      result = result.filter(h => heroEffectSets.get(h.id)?.has(filterDebuff))
    if (filterDisable)
      result = result.filter(h => heroEffectSets.get(h.id)?.has(filterDisable))
    if (filterInstant)
      result = result.filter(h => heroInstantSets.get(h.id)?.has(filterInstant))

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
  }, [heroes, query, sortKey, filterRarity, filterAffinity, filterAllegiance, filterArchetype, filterFaction, filterBuff, filterDebuff, filterDisable, filterInstant, heroEffectSets, heroInstantSets])

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
    filterArchetype.length > 0 || filterFaction.length > 0 || query ||
    filterBuff || filterDebuff || filterDisable || filterInstant

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

      {/* Attribute filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <FilterRow label="Rarity" options={RARITIES} active={filterRarity} onToggle={(v) => toggle(filterRarity, setFilterRarity, v)} onClear={() => setFilterRarity([])} />
        <FilterRow label="Affinity" options={AFFINITIES} active={filterAffinity} onToggle={(v) => toggle(filterAffinity, setFilterAffinity, v)} onClear={() => setFilterAffinity([])} />
        <FilterRow label="Allegiance" options={ALLEGIANCES} active={filterAllegiance} onToggle={(v) => toggle(filterAllegiance, setFilterAllegiance, v)} onClear={() => setFilterAllegiance([])} />
        <FilterRow label="Archetype" options={ARCHETYPES} active={filterArchetype} onToggle={(v) => toggle(filterArchetype, setFilterArchetype, v)} onClear={() => setFilterArchetype([])} />
        <FilterRow label="Faction" options={FACTIONS} active={filterFaction} onToggle={(v) => toggle(filterFaction, setFilterFaction, v)} onClear={() => setFilterFaction([])} />
      </div>

      {/* Status effect filters */}
      <div style={{ borderTop: '1px solid #1e1e1e', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Filter by Status Effect</span>
        <EffectSelect label="Buff" effects={BUFFS} value={filterBuff} onChange={setFilterBuff} color={EFFECT_COLOR.buff} />
        <EffectSelect label="Debuff" effects={DEBUFFS} value={filterDebuff} onChange={setFilterDebuff} color={EFFECT_COLOR.debuff} />
        <EffectSelect label="Disable" effects={DISABLES} value={filterDisable} onChange={setFilterDisable} color={EFFECT_COLOR.disable} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', minWidth: '5.5rem' }}>Instant</span>
          <div style={{ position: 'relative' }}>
            <select
              value={filterInstant}
              onChange={e => setFilterInstant(e.target.value)}
              style={{ ...selectStyle, borderColor: filterInstant ? '#f59e0b88' : '#333', color: filterInstant ? '#f59e0b' : '#aaa' }}
            >
              <option value="">All</option>
              {INSTANT_EFFECTS.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          {filterInstant && (
            <button type="button" onClick={() => setFilterInstant('')}
              style={{ ...btnBase, color: '#f87171', borderColor: '#7f1d1d', padding: '0.2rem 0.45rem', fontSize: '0.65rem' }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Results count + reset */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: '#666' }}>{filtered.length} heroes</span>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery(''); setFilterRarity([]); setFilterAffinity([]); setFilterAllegiance([]);
              setFilterArchetype([]); setFilterFaction([]);
              setFilterBuff(''); setFilterDebuff(''); setFilterDisable(''); setFilterInstant('')
            }}
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
