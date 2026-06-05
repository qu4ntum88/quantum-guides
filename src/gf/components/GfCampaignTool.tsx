'use client'

import { useState, useMemo } from 'react'
import type { GfHero } from './GfHeroBox'
import { STORY_CHAPTERS, ADVENTURE_CHAPTERS, type ChapterData, type StageData, type StarRequirement } from '../data/campaign'

// ── Constants ──────────────────────────────────────────────────────────────────

const AFFINITIES  = ['Cunning', 'Eternal', 'Strength', 'Wisdom']
const ALLEGIANCES = ['Chaos', 'Order']
const ARCHETYPES  = ['Brawler', 'Defender', 'Disruptor', 'Invoker', 'Slayer']
const FACTIONS    = ['Aaru', 'Asgard', 'Avalon', 'Ekur', 'Izumo', 'Olympus', 'Omeyocan', 'Tian', 'Vyraj']
const RARITIES    = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common']

const RARITY_ORDER: Record<string, number> = { Legendary: 0, Epic: 1, Rare: 2, Uncommon: 3, Common: 4 }

const RARITY_COLOR: Record<string, string> = {
  Legendary: '#f59e0b',
  Epic:      '#a855f7',
  Rare:      '#3b82f6',
  Uncommon:  '#22c55e',
  Common:    '#6b7280',
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div style={{
      display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
      padding: '0.6rem 1rem',
      background: '#0e0e0e', border: '1px solid #222',
      borderRadius: '0.5rem', marginBottom: '0.25rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ color: '#f59e0b', fontSize: '1rem' }}>★</span>
        <span style={{ fontSize: '0.72rem', color: '#c0a050', fontWeight: 600 }}>Requirement Met</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ color: '#3a2800', fontSize: '1rem' }}>★</span>
        <span style={{ fontSize: '0.72rem', color: '#777', fontWeight: 600 }}>Requirements Not Met</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ color: '#252525', fontSize: '1rem' }}>☆</span>
        <span style={{ fontSize: '0.72rem', color: '#444', fontWeight: 600 }}>In-Game Action Only</span>
      </div>
    </div>
  )
}

// ── Requirement row ───────────────────────────────────────────────────────────

function RequirementRow({ req, met }: { req: StarRequirement; met: boolean }) {
  const starColor  = met ? '#f59e0b'  : req.canEvaluate ? '#3a2800' : '#252525'
  const starGlyph  = met ? '★' : req.canEvaluate ? '★' : '☆'
  const textColor  = met ? '#f0f0f0'  : req.canEvaluate ? '#666'    : '#3a3a3a'

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.2rem 0' }}>
      <span style={{ color: starColor, fontSize: '0.8rem', flexShrink: 0, marginTop: '0.05rem', lineHeight: 1.5 }}>
        {starGlyph}
      </span>
      <span style={{ fontSize: '0.72rem', color: textColor, lineHeight: 1.5, transition: 'color 0.2s' }}>
        {req.description}
      </span>
    </div>
  )
}

// ── Stage card ────────────────────────────────────────────────────────────────

function StageCard({ stage, team }: { stage: StageData; team: GfHero[] }) {
  const autoFilled = team.length >= 2
  const results = stage.requirements.map(req => {
    if (req.autoFill && autoFilled) return true
    return req.canEvaluate && req.evaluate ? req.evaluate(team) : false
  })
  const metCount = results.filter(Boolean).length
  const allMet   = metCount === 3

  const accentColor  = stage.isBoss ? '#c97b2e' : '#7c3aed'
  const accentDim    = stage.isBoss ? '#3d2200' : '#2d1a4a'
  const headerGrad   = stage.isBoss
    ? 'linear-gradient(to right, #1f1200 0%, #130d00 100%)'
    : 'linear-gradient(to right, #150d25 0%, #0e0a18 100%)'
  const outerBorder  = allMet ? accentColor : accentDim
  const outerGlow    = allMet
    ? (stage.isBoss ? '0 0 12px 2px rgba(201,123,46,0.25)' : '0 0 12px 2px rgba(124,58,237,0.25)')
    : 'none'

  return (
    <div style={{
      borderRadius: '0.55rem',
      overflow: 'hidden',
      border: `1px solid ${outerBorder}`,
      boxShadow: outerGlow,
      transition: 'border-color 0.25s, box-shadow 0.25s',
      display: 'flex',
    }}>
      {/* Left accent stripe */}
      <div style={{ width: '3px', flexShrink: 0, background: accentColor, opacity: allMet ? 1 : 0.35, transition: 'opacity 0.25s' }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.5rem 0.8rem',
          background: headerGrad,
          borderBottom: `1px solid ${accentDim}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {stage.isBoss ? (
              <span style={{
                fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: 'rgba(201,123,46,0.2)', border: '1px solid #c97b2e',
                color: '#f5a832', padding: '0.1rem 0.45rem', borderRadius: '0.25rem',
              }}>
                ⚔ Boss
              </span>
            ) : (
              <span style={{
                fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: 'rgba(124,58,237,0.18)', border: '1px solid #5b21b6',
                color: '#c4b5fd', padding: '0.1rem 0.45rem', borderRadius: '0.25rem',
              }}>
                Stage {stage.stageNumber}
              </span>
            )}
          </div>

          {/* Stars */}
          <div style={{ display: 'flex', gap: '0.15rem' }}>
            {results.map((met, i) => {
              const req = stage.requirements[i]
              const color = met ? '#f59e0b' : req.canEvaluate ? '#3a2800' : '#252525'
              return (
                <span key={i} style={{ color, fontSize: '1.05rem', lineHeight: 1, transition: 'color 0.2s' }}>
                  {met ? '★' : req.canEvaluate ? '★' : '☆'}
                </span>
              )
            })}
          </div>
        </div>

        {/* Requirements */}
        <div style={{ padding: '0.45rem 0.8rem 0.55rem', background: '#070707' }}>
          {stage.requirements.map((req, i) => (
            <RequirementRow key={i} req={req} met={results[i]} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Chapter tab ───────────────────────────────────────────────────────────────

function ChapterTab({ chapter, active, onClick }: { chapter: ChapterData; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
        padding: '0.5rem 0.65rem',
        background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
        border: `1px solid ${active ? '#7c3aed' : '#1e1e1e'}`,
        borderRadius: '0.55rem', cursor: 'pointer',
        color: active ? '#e9d5ff' : '#666',
        transition: 'all 0.15s',
        minWidth: '5.25rem', flexShrink: 0,
        boxShadow: active ? '0 0 12px rgba(124,58,237,0.2)' : 'none',
      }}
    >
      <img
        src={`/godforge/gf_heroes/factions/${chapter.factionKey}.png`}
        alt={chapter.faction}
        style={{ width: '2.25rem', height: '2.25rem', objectFit: 'contain', opacity: active ? 1 : 0.35, transition: 'opacity 0.15s' }}
      />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.57rem', color: active ? '#9d6ad6' : '#3a3a3a', marginBottom: '0.08rem' }}>
          Ch. {chapter.chapterNumber}
        </div>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{chapter.faction}</div>
      </div>
    </button>
  )
}

// ── Mini hero picker card ─────────────────────────────────────────────────────

function HeroPickerCard({ hero, selected, onToggle }: { hero: GfHero; selected: boolean; onToggle: () => void }) {
  const imgSrc = hero.portrait_url ?? hero.image_url ?? ''
  const rarityColor = hero.rarity ? RARITY_COLOR[hero.rarity] : '#2a2a2a'

  return (
    <button
      type="button"
      onClick={onToggle}
      title={selected ? `Remove ${hero.name}` : hero.name}
      style={{
        position: 'relative', padding: 0, background: 'none', border: 'none', cursor: 'pointer',
        borderRadius: '0.375rem', overflow: 'hidden',
        outline: selected ? `2px solid ${rarityColor}` : '2px solid transparent',
        outlineOffset: '1px', transition: 'outline 0.1s',
        aspectRatio: '3 / 4', display: 'block', width: '100%',
      }}
    >
      {imgSrc ? (
        <img src={imgSrc} alt={hero.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#333', fontSize: '0.6rem' }}>?</span>
        </div>
      )}
      <div style={{ position: 'absolute', inset: 0, background: selected ? 'transparent' : 'rgba(0,0,0,0.45)', transition: 'background 0.1s' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 100%)', padding: '1rem 0.25rem 0.25rem' }}>
        <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.2, textShadow: '0 1px 2px #000' }}>
          {hero.name}
        </div>
      </div>
      {selected && (
        <div style={{
          position: 'absolute', top: '0.2rem', right: '0.2rem',
          background: rarityColor, borderRadius: '50%',
          width: '1.1rem', height: '1.1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6rem', color: '#000', fontWeight: 900,
        }}>✓</div>
      )}
    </button>
  )
}

// ── Team slot ─────────────────────────────────────────────────────────────────

function TeamSlot({ hero, onRemove }: { hero: GfHero | null; onRemove?: () => void }) {
  const imgSrc = hero ? (hero.portrait_url ?? hero.image_url ?? '') : ''
  const rarityColor = hero?.rarity ? RARITY_COLOR[hero.rarity] : '#222'

  return (
    <div style={{
      position: 'relative', aspectRatio: '3 / 4', borderRadius: '0.5rem', overflow: 'hidden',
      border: hero ? `1px solid ${rarityColor}` : '1px dashed #222',
      background: hero ? '#111' : '#0a0a0a',
    }}>
      {hero ? (
        <>
          {imgSrc && <img src={imgSrc} alt={hero.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)', padding: '1.2rem 0.2rem 0.25rem' }}>
            <div style={{ fontSize: '0.5rem', fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>{hero.name}</div>
          </div>
          <button
            type="button" onClick={onRemove} title="Remove"
            style={{ position: 'absolute', top: '0.2rem', right: '0.2rem', background: 'rgba(0,0,0,0.75)', border: 'none', borderRadius: '50%', width: '1.1rem', height: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '0.6rem', lineHeight: 1, padding: 0 }}
          >×</button>
        </>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#252525', fontSize: '1.25rem', lineHeight: 1 }}>+</span>
        </div>
      )}
    </div>
  )
}

// ── Filter select ─────────────────────────────────────────────────────────────

function FilterSelect({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  const active = value !== ''
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      <label style={{ fontSize: '0.6rem', color: '#777', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{
          background: '#111', border: `1px solid ${active ? '#6d28d9' : '#252525'}`,
          borderRadius: '0.375rem', color: active ? '#e9d5ff' : '#666',
          fontSize: '0.72rem', padding: '0.3rem 1.5rem 0.3rem 0.5rem',
          cursor: 'pointer', width: '100%', appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23555'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.4rem center',
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function GfCampaignTool({ heroes }: { heroes: GfHero[] }) {
  const [mode, setMode]         = useState<'story' | 'adventure'>('story')
  const [chapterIdx, setChapterIdx] = useState(0)
  const [team, setTeam]         = useState<GfHero[]>([])
  const [filterAffinity,   setFilterAffinity]   = useState('')
  const [filterAllegiance, setFilterAllegiance] = useState('')
  const [filterArchetype,  setFilterArchetype]  = useState('')
  const [filterFaction,    setFilterFaction]    = useState('')
  const [filterRarity,     setFilterRarity]     = useState('')
  const [query, setQuery]       = useState('')

  const chapters: ChapterData[] = mode === 'story' ? STORY_CHAPTERS : ADVENTURE_CHAPTERS
  const chapter = chapters[chapterIdx]

  const filteredHeroes = useMemo(() => {
    return heroes
      .filter(h => {
        if (query && !h.name.toLowerCase().includes(query.toLowerCase())) return false
        if (filterAffinity   && h.affinity   !== filterAffinity)                          return false
        if (filterAllegiance && h.allegiance !== filterAllegiance)                        return false
        if (filterArchetype  && h.archetype  !== filterArchetype)                         return false
        if (filterFaction    && h.faction?.toLowerCase() !== filterFaction.toLowerCase()) return false
        if (filterRarity     && h.rarity     !== filterRarity)                            return false
        return true
      })
      .sort((a, b) => {
        const ar = a.rarity ? (RARITY_ORDER[a.rarity] ?? 99) : 99
        const br = b.rarity ? (RARITY_ORDER[b.rarity] ?? 99) : 99
        return ar !== br ? ar - br : a.name.localeCompare(b.name)
      })
  }, [heroes, query, filterAffinity, filterAllegiance, filterArchetype, filterFaction, filterRarity])

  const hasFilters = query || filterAffinity || filterAllegiance || filterArchetype || filterFaction || filterRarity

  function toggleHero(hero: GfHero) {
    if (team.some(h => h.id === hero.id)) {
      setTeam(team.filter(h => h.id !== hero.id))
    } else if (team.length < 4) {
      setTeam([...team, hero])
    }
  }

  function resetFilters() {
    setQuery(''); setFilterAffinity(''); setFilterAllegiance('')
    setFilterArchetype(''); setFilterFaction(''); setFilterRarity('')
  }

  const chapterMetCount = chapter.stages.reduce((sum, stage) =>
    sum + stage.requirements.filter(req => req.canEvaluate && req.evaluate ? req.evaluate(team) : false).length, 0)
  const chapterEvalTotal = chapter.stages.reduce((sum, stage) =>
    sum + stage.requirements.filter(req => req.canEvaluate).length, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Mode Tabs ── */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {(['story', 'adventure'] as const).map(m => (
          <button
            key={m} type="button"
            onClick={() => { setMode(m); setChapterIdx(0) }}
            style={{
              padding: '0.5rem 1.4rem',
              background: mode === m ? 'linear-gradient(135deg, #6d28d9, #4c1d95)' : 'transparent',
              border: `1px solid ${mode === m ? '#7c3aed' : '#2a2a2a'}`,
              borderRadius: '0.5rem', cursor: 'pointer',
              color: mode === m ? '#fff' : '#666',
              fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em',
              boxShadow: mode === m ? '0 0 12px rgba(109,40,217,0.35)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {m === 'story' ? 'Story Mode' : 'Adventure Mode'}
          </button>
        ))}
        {mode === 'adventure' && (
          <span style={{ fontSize: '0.7rem', color: '#555', marginLeft: '0.25rem' }}>
            Unlocked after completing Story Mode
          </span>
        )}
      </div>

      {/* ── Chapter Tabs ── */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'thin', scrollbarColor: '#2a2a2a #0a0a0a' }}>
        {chapters.map((ch, i) => (
          <ChapterTab key={ch.faction} chapter={ch} active={chapterIdx === i} onClick={() => setChapterIdx(i)} />
        ))}
      </div>

      {/* ── Chapter banner ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '0.75rem 1.25rem',
        background: 'linear-gradient(to right, #150d25, #0e0a18)',
        border: '1px solid #2d1a4a', borderRadius: '0.6rem',
      }}>
        <img src={`/godforge/gf_heroes/factions/${chapter.factionKey}.png`} alt={chapter.faction}
          style={{ width: '2.5rem', height: '2.5rem', objectFit: 'contain' }} />
        <div>
          <div style={{ fontSize: '0.62rem', color: '#9d6ad6', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.1rem' }}>
            Chapter {chapter.chapterNumber} — {mode === 'story' ? 'Story Mode' : 'Adventure Mode'}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e9d5ff', letterSpacing: '0.02em' }}>{chapter.faction}</div>
        </div>
        {team.length > 0 && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '0.62rem', color: '#888', marginBottom: '0.1rem' }}>Auto-detected stars</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b' }}>
              {chapterMetCount} <span style={{ color: '#555', fontWeight: 400 }}>/ {chapterEvalTotal}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '1.5rem', alignItems: 'start' }}>

        {/* LEFT: Stage list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Legend />
          {chapter.stages.map(stage => (
            <StageCard key={stage.stageNumber} stage={stage} team={team} />
          ))}
        </div>

        {/* RIGHT: Team builder (sticky) */}
        <div style={{
          position: 'sticky', top: '5rem',
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
          maxHeight: 'calc(100vh - 6rem)', overflowY: 'auto',
          scrollbarWidth: 'thin', scrollbarColor: '#2a2a2a #0a0a0a',
        }}>

          {/* Your Team */}
          <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '0.6rem', padding: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.65rem', color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Your Team ({team.length}/4)
              </span>
              {team.length > 0 && (
                <button type="button" onClick={() => setTeam([])}
                  style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: '0.3rem', color: '#666', cursor: 'pointer', fontSize: '0.62rem', padding: '0.15rem 0.5rem' }}>
                  Clear
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <TeamSlot
                  key={i}
                  hero={team[i] ?? null}
                  onRemove={team[i] ? () => setTeam(team.filter(h => h.id !== team[i].id)) : undefined}
                />
              ))}
            </div>

            {team.length > 0 && (
              <div style={{ marginTop: '0.6rem', borderTop: '1px solid #1a1a1a', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                {[
                  { label: 'Affinity',   vals: team.map(h => h.affinity).filter(Boolean) },
                  { label: 'Archetype',  vals: team.map(h => h.archetype).filter(Boolean) },
                  { label: 'Faction',    vals: team.map(h => h.faction).filter(Boolean) },
                  { label: 'Allegiance', vals: team.map(h => h.allegiance).filter(Boolean) },
                ].map(({ label, vals }) => vals.length > 0 && (
                  <div key={label} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.6rem' }}>
                    <span style={{ color: '#555', minWidth: '4.5rem' }}>{label}</span>
                    <span style={{ color: '#888' }}>{(vals as string[]).join(' · ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filters */}
          <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '0.6rem', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Filters</span>
              {hasFilters && (
                <button type="button" onClick={resetFilters}
                  style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: '0.3rem', color: '#666', cursor: 'pointer', fontSize: '0.62rem', padding: '0.15rem 0.5rem' }}>
                  Reset
                </button>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.6rem', color: '#777', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.2rem' }}>Search</label>
              <input
                type="search" placeholder="Hero name…" value={query} onChange={e => setQuery(e.target.value)}
                style={{ background: '#111', border: `1px solid ${query ? '#6d28d9' : '#252525'}`, borderRadius: '0.375rem', color: '#e2e8f0', fontSize: '0.72rem', padding: '0.3rem 0.5rem', width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              <FilterSelect label="Affinity"   value={filterAffinity}   onChange={setFilterAffinity}   options={AFFINITIES}  placeholder="Any" />
              <FilterSelect label="Allegiance" value={filterAllegiance} onChange={setFilterAllegiance} options={ALLEGIANCES} placeholder="Any" />
              <FilterSelect label="Archetype"  value={filterArchetype}  onChange={setFilterArchetype}  options={ARCHETYPES}  placeholder="Any" />
              <FilterSelect label="Faction"    value={filterFaction}    onChange={setFilterFaction}    options={FACTIONS}   placeholder="Any" />
              <FilterSelect label="Rarity"     value={filterRarity}     onChange={setFilterRarity}     options={RARITIES}   placeholder="Any" />
            </div>
          </div>

          {/* Hero picker */}
          <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '0.6rem', padding: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.65rem', color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Heroes</span>
              <span style={{ fontSize: '0.62rem', color: '#555' }}>
                {filteredHeroes.length} shown · {team.length < 4 ? `${4 - team.length} slot${4 - team.length !== 1 ? 's' : ''} open` : 'team full'}
              </span>
            </div>

            {filteredHeroes.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: '#444', margin: 0 }}>No heroes match these filters.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.3rem' }}>
                {filteredHeroes.map(hero => (
                  <HeroPickerCard
                    key={hero.id} hero={hero}
                    selected={team.some(h => h.id === hero.id)}
                    onToggle={() => toggleHero(hero)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
