'use client'

import { useState, type CSSProperties } from 'react'
import HunterBox, { type Hunter } from './HunterBox'

const VH_CLASSES   = ['Attacker', 'Balanced', 'Support', 'Tank']
const VH_HOMELANDS = ['Archlands', 'Crucible', 'Dragana', 'Free Tribes', 'Frostheim', 'Holy Order', 'Moonlight Clan', 'Pandemonium']
const VH_SPECIES   = ['Beastman', 'Construct', 'Creature', 'Dwarf', 'Elf', 'Goblin', 'Human', 'Orc']
const VH_OTHER     = ['Artificer', 'Assassin', 'Blademaster', 'Consumed', 'Healer', 'Homonculus', 'Inquisition', 'Knight', 'Mimic', 'Miner', 'Minstrel', 'Monk', 'Noble', 'Outlaw', 'Priest', 'Sage', 'Seasoned', 'Sentinel', 'Sharpshooter', 'Tainted', 'Carnivale', 'Wanderer']

const LABEL: CSSProperties = {
  fontSize: '0.9rem',
  fontFamily: 'Unbounded, sans-serif',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  opacity: 0.8,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  width: '9rem',
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: selected ? 'rgba(124,58,237,0.35)' : 'transparent',
        border: selected ? '2px solid var(--gold)' : '2px solid #444',
        borderRadius: '0.5rem',
        padding: '0.3rem 0.65rem',
        cursor: 'pointer',
        color: selected ? 'var(--gold)' : '#888',
        fontFamily: 'Unbounded, sans-serif',
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        transition: 'all 0.15s',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

function AllChip({ selected, onClick }: { selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: selected ? 'rgba(124,58,237,0.35)' : 'transparent',
        border: selected ? '2px solid var(--gold)' : '2px solid #444',
        borderRadius: '0.5rem',
        padding: '0.3rem 0.65rem',
        cursor: 'pointer',
        color: selected ? 'var(--gold)' : '#888',
        fontFamily: 'Unbounded, sans-serif',
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        transition: 'all 0.15s',
        flexShrink: 0,
        height: '2.1rem',
      }}
    >
      ALL
    </button>
  )
}

function toggle(arr: string[], val: string, set: (v: string[]) => void) {
  set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val])
}

export default function HunterGrid({ hunters }: { hunters: Hunter[] }) {
  const [query, setQuery]                       = useState('')
  const [sortBy, setSortBy]                     = useState('name')
  const [sortOrder, setSortOrder]               = useState<'asc' | 'desc'>('asc')
  const [selectedClasses, setSelectedClasses]   = useState<string[]>([])
  const [selectedHomelands, setSelectedHomelands] = useState<string[]>([])
  const [selectedSpecies, setSelectedSpecies]   = useState<string[]>([])
  const [selectedOther, setSelectedOther]       = useState<string[]>([])

  const reset = () => {
    setSortBy('name'); setSortOrder('asc')
    setSelectedClasses([]); setSelectedHomelands([])
    setSelectedSpecies([]); setSelectedOther([])
    setQuery('')
  }

  const filtered = hunters
    .filter((h) => {
      if (query && !h.name.toLowerCase().includes(query.toLowerCase())) return false
      if (selectedClasses.length > 0 && !selectedClasses.includes(h.class)) return false
      if (selectedHomelands.length > 0 && !selectedHomelands.includes(h.homeland)) return false
      if (selectedSpecies.length > 0 && !selectedSpecies.includes(h.species)) return false
      if (selectedOther.length > 0 && !selectedOther.some((o) => h.other.includes(o))) return false
      return true
    })
    .sort((a, b) => {
      const dir = sortOrder === 'asc' ? 1 : -1
      if (sortBy === 'class')    return dir * a.class.localeCompare(b.class)
      if (sortBy === 'homeland') return dir * a.homeland.localeCompare(b.homeland)
      if (sortBy === 'species')  return dir * a.species.localeCompare(b.species)
      return dir * a.name.localeCompare(b.name)
    })

  const SORT_OPTIONS = [
    { value: 'name',     label: 'Alphabetical' },
    { value: 'class',    label: 'Class' },
    { value: 'homeland', label: 'Homeland' },
    { value: 'species',  label: 'Species' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '64rem' }}>
      <input
        type="search"
        placeholder="Search hunters..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          background: '#1a1a1a', border: '1px solid #444', borderRadius: '0.5rem',
          color: '#fff', padding: '0.6rem 1rem', fontSize: '0.95rem', width: '100%',
        }}
      />

      {/* Sort row */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={LABEL}>Sort By</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          {SORT_OPTIONS.map(({ value, label }) => (
            <Chip key={value} label={label} selected={sortBy === value} onClick={() => setSortBy(value)} />
          ))}
          <Chip label="↑ Asc"  selected={sortOrder === 'asc'}  onClick={() => setSortOrder('asc')} />
          <Chip label="↓ Desc" selected={sortOrder === 'desc'} onClick={() => setSortOrder('desc')} />
          <button
            type="button"
            onClick={reset}
            style={{
              background: 'transparent', border: '1px solid #444', borderRadius: '0.5rem',
              color: '#888', cursor: 'pointer', padding: '0.3rem 0.75rem',
              fontSize: '0.75rem', fontFamily: 'inherit',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Class filter */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={LABEL}>Class</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          <AllChip selected={selectedClasses.length === 0} onClick={() => setSelectedClasses([])} />
          {VH_CLASSES.map((c) => (
            <Chip key={c} label={c} selected={selectedClasses.includes(c)} onClick={() => toggle(selectedClasses, c, setSelectedClasses)} />
          ))}
        </div>
      </div>

      {/* Homeland filter */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={LABEL}>Homeland</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          <AllChip selected={selectedHomelands.length === 0} onClick={() => setSelectedHomelands([])} />
          {VH_HOMELANDS.map((h) => (
            <Chip key={h} label={h} selected={selectedHomelands.includes(h)} onClick={() => toggle(selectedHomelands, h, setSelectedHomelands)} />
          ))}
        </div>
      </div>

      {/* Species filter */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={LABEL}>Species</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          <AllChip selected={selectedSpecies.length === 0} onClick={() => setSelectedSpecies([])} />
          {VH_SPECIES.map((s) => (
            <Chip key={s} label={s} selected={selectedSpecies.includes(s)} onClick={() => toggle(selectedSpecies, s, setSelectedSpecies)} />
          ))}
        </div>
      </div>

      {/* Other tags filter */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <span style={{ ...LABEL, paddingTop: '0.35rem' }}>Tags</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          <AllChip selected={selectedOther.length === 0} onClick={() => setSelectedOther([])} />
          {VH_OTHER.map((o) => (
            <Chip key={o} label={o} selected={selectedOther.includes(o)} onClick={() => toggle(selectedOther, o, setSelectedOther)} />
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0
        ? <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '1rem' }}>No hunters match your filters.</p>
        : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(9rem, 1fr))',
            gap: '0.75rem',
            marginTop: '0.5rem',
          }}>
            {filtered.map((h) => <HunterBox key={h.id} hunter={h} />)}
          </div>
        )
      }
    </div>
  )
}
