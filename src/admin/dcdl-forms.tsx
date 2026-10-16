'use client'

import { useState, useEffect, useCallback } from 'react'
import synergiesJson from '@/src/dcdl/data/synergies.json'

// ── Constants ──────────────────────────────────────────────────────────────────
const CLASSES = ['Assassin', 'Firepower', 'Guardian', 'Intimidator', 'Magical', 'Supporter', 'Warrior']
const HERO_RARITIES = ['Iconic', 'Mythic +', 'Mythic', 'Legendary', 'Epic']
const TIERS = ['S+', 'S', 'A+', 'A', 'B', 'C', 'D']
const DAMAGE_TYPES = ['Physical', 'Spiritual']
// Combat Cycle picks are made per boss in the Combat Cycle tab (combat-cycle.json `bestChampions`).
const GAME_MODES = ['PvP']
const SYNERGIES = [
  { id: 'arkhams_most_wanted', name: "Arkham's Most Wanted" },
  { id: 'amazons', name: 'Amazons' },
  { id: 'atlanteans', name: 'Atlanteans' },
  { id: 'bat_family', name: 'Bat Family' },
  { id: 'birds_of_prey', name: 'Birds of Prey' },
  { id: 'deathmetal', name: 'Death Metal' },
  { id: 'energy_wielder', name: 'Energy Wielder' },
  { id: 'green_lantern_corps', name: 'Green Lantern Corps' },
  { id: 'justice_league', name: 'Justice League' },
  { id: 'justice_league_dark', name: 'Justice League Dark' },
  { id: 'league_of_assassins', name: 'League of Assassins' },
  { id: 'legion_of_doom', name: 'Legion of Doom' },
  { id: 'metahuman', name: 'Metahuman' },
  { id: 'outsiders', name: 'Outsiders' },
  { id: 'suicide_squad', name: 'Suicide Squad' },
  { id: 'superman_family', name: 'Superman Family' },
  { id: 'the_flash_family', name: 'The Flash Family' },
  { id: 'teen_titans', name: 'Teen Titans' },
  { id: 'weapon_master', name: 'Weapon Master' },
]
const LEGACY_RARITIES = ['Iconic', 'Mythic +', 'Mythic', 'Legendary', 'Epic']
const LEGACY_ROLES = ['Guardian | Warrior', 'Magical | Assassin | Firepower', 'Supporter | Intimidator']
const STAR_OPTIONS = [1, 2, 3, 4, 5]
const ACDCPRIORITY_OPTIONS = ['Major 1', 'Major 2', 'Major 3', 'HP Nodes', 'ATK Nodes', 'Healing', 'Energy Gain Bonus', 'Crit DMG', 'Crit Rate', 'Crit RES', 'Crit DMG RES', 'Spiritual PEN', 'Spiritual AMP', 'Physical PEN', 'S. DEF', 'P. DEF', 'Dodge', 'Effect ACC', 'Effect RES', 'Do Not Invest']
const WHALE_SKIP_OPTIONS = ['Top Tier', 'High Value', 'Situational / Roster Dependent', 'Luxury', 'Skip / Do Not Build', 'Passively Invest Only']
// ── Types ──────────────────────────────────────────────────────────────────────
type SkillRow = { name: string; description: string; image: File | null }
type ItemOption = { id: string; name: string; image?: string }
// The in-game Strategy Guide for the champion being edited (read-only reference).
type GameGuideRef = {
  overview: string
  legacyPieces: { name: string; reason: string | null; signature: boolean }[]
  alternatives: { name: string }[]
  champions: { name: string }[]
  bestFor: string[]
  recommendedStats: string[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function toId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

// Sort ItemOption lists alphabetically by name (for select dropdowns / icon pickers)
const byName = (a: ItemOption, b: ItemOption) => a.name.localeCompare(b.name)

// Faction / tag-synergy icon paths, keyed by synergy id (filenames aren't always id-derivable, e.g. deathmetal)
const SYNERGY_IMG: Record<string, string> = Object.fromEntries(
  (synergiesJson as { id: string; image?: string }[]).map((s) => [
    s.id,
    (s.image ?? '').replace(/^\.\/tag_images\//, '/dcdl/synergies/tag_images/'),
  ])
)
const SYNERGY_OPTIONS: ItemOption[] = SYNERGIES.map((s) => ({ ...s, image: SYNERGY_IMG[s.id] }))

// ── Shared styles ──────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  background: '#1a1a1a', border: '1px solid #444', borderRadius: '0.375rem',
  color: '#fff', padding: '0.5rem 0.75rem', fontSize: '0.9rem', width: '100%',
}
const sec: React.CSSProperties = {
  background: 'var(--light-bg)', borderRadius: '0.5rem', padding: '1.25rem',
  display: 'flex', flexDirection: 'column', gap: '1rem',
}
const secTitle: React.CSSProperties = {
  fontFamily: 'Unbounded, sans-serif', fontSize: '0.75rem', fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)',
  borderBottom: '1px solid rgba(204,164,83,0.3)', paddingBottom: '0.5rem', marginBottom: '0.25rem',
}
const g2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }
const g3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }

// ── Shared components ──────────────────────────────────────────────────────────
function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--gold)' }}>
        {label}
        {required
          ? <span style={{ color: '#f87171', marginLeft: '0.25rem' }}>*</span>
          : <span style={{ color: '#666', marginLeft: '0.4rem', fontWeight: 400, fontSize: '0.75rem' }}>(optional)</span>}
      </label>
      {hint && <span style={{ fontSize: '0.75rem', color: '#888' }}>{hint}</span>}
      {children}
    </div>
  )
}

function CheckGroup({ options, selected, onChange }: {
  options: { id: string; name: string }[]; selected: string[]; onChange: (id: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
      {options.map(({ id, name }) => (
        <label key={id} style={{
          display: 'flex', alignItems: 'center', gap: '0.3rem',
          background: selected.includes(id) ? 'var(--purple)' : '#1a1a1a',
          border: '1px solid #444', borderRadius: '0.375rem',
          padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.82rem',
        }}>
          <input type="checkbox" checked={selected.includes(id)} onChange={() => onChange(id)}
            style={{ accentColor: 'var(--gold)' }} />
          {name}
        </label>
      ))}
    </div>
  )
}

function IconCheckGroup({ options, selected, onChange }: {
  options: ItemOption[]; selected: string[]; onChange: (id: string) => void
}) {
  const [hovered, setHovered] = useState<string | null>(null)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {options.map(({ id, name, image }) => {
        const isSel = selected.includes(id)
        return (
          <div key={id} style={{ position: 'relative' }}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered((h) => (h === id ? null : h))}>
            <button type="button" title={name} onClick={() => onChange(id)}
              style={{
                width: '3.4rem', height: '3.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0.25rem', background: isSel ? 'var(--purple)' : '#1a1a1a',
                border: `2px solid ${isSel ? 'var(--gold)' : '#444'}`, borderRadius: '0.5rem', cursor: 'pointer',
              }}>
              {image
                ? // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                : <span style={{ fontSize: '0.58rem', textAlign: 'center', color: '#ccc', lineHeight: 1.1 }}>{name}</span>}
              {isSel && (
                <span style={{
                  position: 'absolute', top: '-7px', right: '-7px', background: 'var(--gold)', color: '#111',
                  borderRadius: '50%', width: '1.15rem', height: '1.15rem', fontSize: '0.7rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✓</span>
              )}
            </button>
            {hovered === id && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
                background: '#000', color: '#fff', border: '1px solid var(--gold)', borderRadius: '0.3rem',
                padding: '0.2rem 0.5rem', fontSize: '0.72rem', whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none',
              }}>{name}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SkillSection({ title, rows, setRows, existingImages = {} }: {
  title: string; rows: SkillRow[]; setRows: (r: SkillRow[]) => void
  existingImages?: Record<string, string>
}) {
  function update(i: number, field: keyof SkillRow, value: string | File | null) {
    const next = [...rows]; next[i] = { ...next[i], [field]: value }; setRows(next)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {rows.map((row, i) => (
        <div key={i} style={{ background: '#111', border: '1px solid #333', borderRadius: '0.375rem', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>{title} {i + 1}</span>
            <button type="button" onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem' }}>
              Remove
            </button>
          </div>
          <div style={g2}>
            <Field label="Name" required>
              <input style={inp} value={row.name} onChange={(e) => update(i, 'name', e.target.value)} />
            </Field>
            <Field label="Image" hint={existingImages[`${i}`] ? `Current: ${existingImages[`${i}`].split('/').pop()}` : undefined}>
              <input type="file" accept="image/*" style={{ ...inp, padding: '0.35rem' }}
                onChange={(e) => update(i, 'image', e.target.files?.[0] ?? null)} />
              {row.image && <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{row.image.name}</span>}
            </Field>
          </div>
          <Field label="Description" required>
            <textarea style={{ ...inp, minHeight: '4rem', resize: 'vertical' }}
              value={row.description} onChange={(e) => update(i, 'description', e.target.value)} />
          </Field>
        </div>
      ))}
      <button type="button" onClick={() => setRows([...rows, { name: '', description: '', image: null }])}
        style={{ background: 'none', border: '1px dashed #555', borderRadius: '0.375rem', color: '#aaa', cursor: 'pointer', padding: '0.5rem', fontSize: '0.85rem' }}>
        + Add {title}
      </button>
    </div>
  )
}

function SingleSkill({ nameVal, descVal, onName, onDesc, onImage, existingImg }: {
  nameVal: string; descVal: string; onName: (v: string) => void
  onDesc: (v: string) => void; onImage: (f: File | null) => void; existingImg?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div style={g2}>
        <Field label="Name"><input style={inp} value={nameVal} onChange={(e) => onName(e.target.value)} /></Field>
        <Field label="Image" hint={existingImg ? `Current: ${existingImg.split('/').pop()}` : undefined}>
          <input type="file" accept="image/*" style={{ ...inp, padding: '0.35rem' }}
            onChange={(e) => onImage(e.target.files?.[0] ?? null)} />
        </Field>
      </div>
      <Field label="Description">
        <textarea style={{ ...inp, minHeight: '4rem', resize: 'vertical' }}
          value={descVal} onChange={(e) => onDesc(e.target.value)} />
      </Field>
    </div>
  )
}

function StatusBanner({ status }: { status: { type: 'success' | 'error'; message: string } | null }) {
  if (!status) return null
  return (
    <div style={{ padding: '0.75rem 1rem', borderRadius: '0.375rem', marginBottom: '1.5rem',
      background: status.type === 'success' ? '#14532d' : '#7f1d1d', color: '#fff' }}>
      {status.message}
    </div>
  )
}

function ModeToggle({ mode, setMode, onReset, addLabel, editLabel }: {
  mode: 'add' | 'edit'; setMode: (m: 'add' | 'edit') => void
  onReset: () => void; addLabel: string; editLabel: string
}) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
      {(['add', 'edit'] as const).map((m) => (
        <button key={m} type="button" onClick={() => { setMode(m); onReset() }}
          className="btn" style={{ background: mode === m ? 'var(--gold)' : 'var(--purple)', color: mode === m ? '#111' : '#fff' }}>
          {m === 'add' ? addLabel : editLabel}
        </button>
      ))}
    </div>
  )
}

// ── Champion form ──────────────────────────────────────────────────────────────
export function ChampionForm({ legacyOptions, onRefreshHeroes }: { legacyOptions: ItemOption[]; onRefreshHeroes: () => void }) {
  const [mode, setMode] = useState<'add' | 'edit'>('add')
  const [selectedId, setSelectedId] = useState('')
  const [heroes, setHeroes] = useState<ItemOption[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [name, setName] = useState(''); const [id, setId] = useState(''); const [idManual, setIdManual] = useState(false)
  const [heroClass, setHeroClass] = useState(''); const [rarity, setRarity] = useState(''); const [tier, setTier] = useState('')
  const [damageType, setDamageType] = useState(''); const [synergies, setSynergies] = useState<string[]>([])
  const [gameModes, setGameModes] = useState<string[]>([]); const [sources, setSources] = useState('')
  const [transmute, setTransmute] = useState(''); const [legacyPieces, setLegacyPieces] = useState<string[]>([])
  const [quantumsTake, setQuantumsTake] = useState(''); const [guideNotes, setGuideNotes] = useState(''); const [gameGuide, setGameGuide] = useState<GameGuideRef | null>(null); const [headshotFile, setHeadshotFile] = useState<File | null>(null)
  const [fullArtFile, setFullArtFile] = useState<File | null>(null); const [ultimateName, setUltimateName] = useState('')
  const [ultimateDesc, setUltimateDesc] = useState(''); const [ultimateImage, setUltimateImage] = useState<File | null>(null)
  const [globalSkillName, setGlobalSkillName] = useState(''); const [globalSkillDesc, setGlobalSkillDesc] = useState('')
  const [globalSkillImage, setGlobalSkillImage] = useState<File | null>(null)
  const [skills, setSkills] = useState<SkillRow[]>([]); const [upgrades, setUpgrades] = useState<SkillRow[]>([])
  const [existingImages, setExistingImages] = useState<Record<string, string>>({})
  const [isNew, setIsNew] = useState(false); const [isP2W, setIsP2W] = useState(false)
  const [clearPrevTier, setClearPrevTier] = useState(false); const [existingPreviousTier, setExistingPreviousTier] = useState('')
  const [ascendsTo, setAscendsTo] = useState(''); const [ascendedFrom, setAscendedFrom] = useState('')
  const [starBreakpoint, setStarBreakpoint] = useState(''); const [acDcPriority, setAcDcPriority] = useState<string[]>([])
  const [whaleOrSkipValue, setWhaleOrSkipValue] = useState(''); const [uniqueLegacyRequired, setUniqueLegacyRequired] = useState(false)

  useEffect(() => {
    fetch('/api/admin/dcdl/champions').then((r) => r.json()).then((d: ItemOption[]) => setHeroes([...d].sort(byName)))
  }, [])

  const reset = useCallback(() => {
    setName(''); setId(''); setIdManual(false); setHeroClass(''); setRarity(''); setTier('')
    setDamageType(''); setSynergies([]); setGameModes([]); setSources(''); setTransmute('')
    setLegacyPieces([]); setQuantumsTake(''); setGuideNotes(''); setGameGuide(null); setHeadshotFile(null); setFullArtFile(null)
    setUltimateName(''); setUltimateDesc(''); setUltimateImage(null)
    setGlobalSkillName(''); setGlobalSkillDesc(''); setGlobalSkillImage(null)
    setSkills([]); setUpgrades([]); setExistingImages({}); setSelectedId('')
    setIsNew(false); setIsP2W(false); setClearPrevTier(false); setExistingPreviousTier('')
    setAscendsTo(''); setAscendedFrom('')
    setStarBreakpoint(''); setAcDcPriority([])
    setWhaleOrSkipValue(''); setUniqueLegacyRequired(false)
  }, [])

  async function loadHero(heroId: string) {
    if (!heroId) { reset(); return }
    const res = await fetch(`/api/admin/dcdl/champions/full?id=${heroId}`)
    if (!res.ok) return
    const h = await res.json()
    setName(h.name ?? ''); setId(h.id ?? ''); setIdManual(true); setHeroClass(h.class ?? '')
    setRarity(h.rarity ?? ''); setTier(h.tier ?? ''); setDamageType(h.damageType ?? '')
    setSynergies(h.tagSynergies ?? []); setGameModes(h.gameModes ?? [])
    setSources((h.sourcesWhereAvailable ?? []).join('\n'))
    setTransmute((h.transmutePriorities ?? []).join('\n'))
    setLegacyPieces(h.recommendedLegacyPieces ?? []); setQuantumsTake(h.quantumsTake ?? ''); setGuideNotes(h.guideNotes ?? ''); setGameGuide(h.gameGuide ?? null)
    setUltimateName(h.ultimate?.name ?? ''); setUltimateDesc(h.ultimate?.description ?? '')
    setGlobalSkillName(h.globalSkill?.name ?? ''); setGlobalSkillDesc(h.globalSkill?.description ?? '')
    setSkills((h.skills ?? []).map((s: { name: string; description: string }) => ({ name: s.name, description: s.description, image: null })))
    setUpgrades((h.upgrades ?? []).map((u: { name: string; description: string }) => ({ name: u.name, description: u.description, image: null })))
    setExistingImages({
      headshot: h.imageHeadshot ?? '', full: h.imageFull ?? '',
      ultimate: h.ultimate?.image ?? '', globalSkill: h.globalSkill?.image ?? '',
      ...(h.skills ?? []).reduce((a: Record<string, string>, s: { image?: string }, i: number) => { if (s.image) a[`skill_${i}`] = s.image; return a }, {}),
      ...(h.upgrades ?? []).reduce((a: Record<string, string>, u: { image?: string }, i: number) => { if (u.image) a[`upgrade_${i}`] = u.image; return a }, {}),
    })
    setIsNew(h.isNew ?? false); setIsP2W(h.isP2W ?? false)
    setExistingPreviousTier(h.previousTier ?? ''); setClearPrevTier(false)
    setAscendsTo(h.ascendsTo ?? ''); setAscendedFrom(h.ascendedFrom ?? '')
    setStarBreakpoint(h.starBreakpoint ? String(h.starBreakpoint) : '')
    setAcDcPriority(Array.isArray(h.acDcPriority) ? h.acDcPriority : h.acDcPriority ? [h.acDcPriority] : [])
    setWhaleOrSkipValue(h.whaleOrSkipValue ?? '')
    setUniqueLegacyRequired(h.uniqueLegacyRequired ?? false)
  }

  function toggle(list: string[], set: (v: string[]) => void, val: string) {
    set(list.includes(val) ? list.filter((x) => x !== val) : [...list, val])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setStatus(null)
    const fd = new FormData()
    fd.append('name', name); fd.append('id', id); fd.append('class', heroClass)
    fd.append('rarity', rarity); fd.append('tier', tier)
    fd.append('isNew', String(isNew)); fd.append('isP2W', String(isP2W))
    if (clearPrevTier) fd.append('clearPreviousTier', 'true')
    if (damageType) fd.append('damageType', damageType)
    if (quantumsTake) fd.append('quantumsTake', quantumsTake)
    if (guideNotes) fd.append('guideNotes', guideNotes)
    synergies.forEach((s) => fd.append('tagSynergies', s))
    gameModes.forEach((m) => fd.append('gameModes', m))
    if (sources) fd.append('sourcesWhereAvailable', sources)
    if (transmute) fd.append('transmutePriorities', transmute)
    legacyPieces.forEach((l) => fd.append('recommendedLegacyPieces', l))
    if (headshotFile) fd.append('imageHeadshot', headshotFile)
    if (fullArtFile) fd.append('imageFull', fullArtFile)
    if (ultimateName) { fd.append('ultimateName', ultimateName); fd.append('ultimateDescription', ultimateDesc) }
    if (ultimateImage) fd.append('ultimateImage', ultimateImage)
    if (globalSkillName) { fd.append('globalSkillName', globalSkillName); fd.append('globalSkillDescription', globalSkillDesc) }
    if (globalSkillImage) fd.append('globalSkillImage', globalSkillImage)
    fd.append('skillCount', String(skills.length))
    skills.forEach((s, i) => { fd.append(`skill_${i}_name`, s.name); fd.append(`skill_${i}_description`, s.description); if (s.image) fd.append(`skill_${i}_image`, s.image) })
    fd.append('upgradeCount', String(upgrades.length))
    upgrades.forEach((u, i) => { fd.append(`upgrade_${i}_name`, u.name); fd.append(`upgrade_${i}_description`, u.description); if (u.image) fd.append(`upgrade_${i}_image`, u.image) })
    if (ascendsTo) fd.append('ascendsTo', ascendsTo)
    if (ascendedFrom) fd.append('ascendedFrom', ascendedFrom)
    if (starBreakpoint) fd.append('starBreakpoint', starBreakpoint)
    acDcPriority.forEach((p) => fd.append('acDcPriority', p))
    if (whaleOrSkipValue) fd.append('whaleOrSkipValue', whaleOrSkipValue)
    fd.append('uniqueLegacyRequired', String(uniqueLegacyRequired))

    try {
      const res = await fetch('/api/admin/dcdl/champions', { method: mode === 'edit' ? 'PATCH' : 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        setStatus({ type: 'success', message: mode === 'edit' ? `"${name}" updated!` : `"${name}" added! Restart dev server to see the card.` })
        if (mode === 'add') reset()
        fetch('/api/admin/dcdl/champions').then((r) => r.json()).then((d: ItemOption[]) => setHeroes([...d].sort(byName)))
        onRefreshHeroes()
      } else {
        setStatus({ type: 'error', message: data.error ?? 'Something went wrong.' })
      }
    } catch { setStatus({ type: 'error', message: 'Network error.' }) }
    setLoading(false)
  }

  return (
    <div>
      <ModeToggle mode={mode} setMode={setMode} onReset={reset}
        addLabel="Add New Champion" editLabel="Edit Existing Champion" />

      {mode === 'edit' && (
        <div style={{ ...sec, marginBottom: '1.5rem' }}>
          <Field label="Select Champion" required>
            <select style={inp} value={selectedId} onChange={(e) => { setSelectedId(e.target.value); loadHero(e.target.value) }}>
              <option value="">Choose a champion...</option>
              {heroes.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </Field>
        </div>
      )}

      <StatusBanner status={status} />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={sec}>
          <div style={secTitle}>Basic Info</div>
          <div style={g2}>
            <Field label="Name" required>
              <input style={inp} value={name} required onChange={(e) => { setName(e.target.value); if (!idManual) setId(toId(e.target.value)) }} />
            </Field>
            <Field label="ID (URL slug)" required hint="Auto-generated from name">
              <input style={inp} value={id} required onChange={(e) => { setId(e.target.value); setIdManual(true) }} />
            </Field>
          </div>
          <div style={g3}>
            <Field label="Class" required>
              <select style={inp} value={heroClass} required onChange={(e) => setHeroClass(e.target.value)}>
                <option value="">Select...</option>{CLASSES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Rarity" required>
              <select style={inp} value={rarity} required onChange={(e) => setRarity(e.target.value)}>
                <option value="">Select...</option>{HERO_RARITIES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Tier" required hint="Starting tier for a new entry. Re-rank in the Tier Lists tab, which wins once saved.">
              <select style={inp} value={tier} required onChange={(e) => setTier(e.target.value)}>
                <option value="">Select...</option>{TIERS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Damage Type">
            <select style={inp} value={damageType} onChange={(e) => setDamageType(e.target.value)}>
              <option value="">Select...</option>{DAMAGE_TYPES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} style={{ accentColor: 'var(--gold)', width: '1rem', height: '1rem' }} />
              <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.82rem' }}>New Champion</span>
              <span style={{ color: '#888', fontSize: '0.78rem' }}>(shows NEW badge)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={isP2W} onChange={(e) => setIsP2W(e.target.checked)} style={{ accentColor: 'var(--gold)', width: '1rem', height: '1rem' }} />
              <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.82rem' }}>Pay to Win</span>
              <span style={{ color: '#888', fontSize: '0.78rem' }}>(shows $ badge)</span>
            </label>
            {mode === 'edit' && existingPreviousTier && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={clearPrevTier} onChange={(e) => setClearPrevTier(e.target.checked)} style={{ accentColor: '#fbbf24', width: '1rem', height: '1rem' }} />
                <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.82rem' }}>Clear tier change arrow</span>
                <span style={{ color: '#888', fontSize: '0.78rem' }}>(currently: {existingPreviousTier} → {tier})</span>
              </label>
            )}
          </div>
        </div>

        <div style={sec}>
          <div style={secTitle}>Ascension Links</div>
          <div style={g2}>
            <Field label="Ascends To" hint="The higher-rarity version this champion can ascend into">
              <select style={inp} value={ascendsTo} onChange={(e) => setAscendsTo(e.target.value)}>
                <option value="">None</option>
                {heroes.filter((h) => h.id !== id).map((h) => <option key={h.id} value={h.id}>{h.name} ({h.id})</option>)}
              </select>
            </Field>
            <Field label="Ascended From" hint="The lower-rarity version this champion was ascended from">
              <select style={inp} value={ascendedFrom} onChange={(e) => setAscendedFrom(e.target.value)}>
                <option value="">None</option>
                {heroes.filter((h) => h.id !== id).map((h) => <option key={h.id} value={h.id}>{h.name} ({h.id})</option>)}
              </select>
            </Field>
          </div>
        </div>

        <div style={sec}>
          <div style={secTitle}>Images</div>
          <div style={g2}>
            <Field label="Portrait / Headshot" hint={existingImages.headshot ? `Current: ${existingImages.headshot.split('/').pop()}` : undefined}>
              <input type="file" accept="image/*" style={{ ...inp, padding: '0.35rem' }} onChange={(e) => setHeadshotFile(e.target.files?.[0] ?? null)} />
              {headshotFile && <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{headshotFile.name}</span>}
            </Field>
            <Field label="Full Art Image" hint={existingImages.full ? `Current: ${existingImages.full.split('/').pop()}` : undefined}>
              <input type="file" accept="image/*" style={{ ...inp, padding: '0.35rem' }} onChange={(e) => setFullArtFile(e.target.files?.[0] ?? null)} />
              {fullArtFile && <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{fullArtFile.name}</span>}
            </Field>
          </div>
        </div>

        <div style={sec}>
          <div style={secTitle}>Factions / Tag Synergies</div>
          <IconCheckGroup options={SYNERGY_OPTIONS} selected={synergies} onChange={(v) => toggle(synergies, setSynergies, v)} />
        </div>

        <div style={sec}>
          <div style={secTitle}>Best Game Modes</div>
          <span style={{ fontSize: '0.75rem', color: '#777' }}>Combat Cycle picks are set per boss in the Combat Cycle tab.</span>
          <CheckGroup options={GAME_MODES.map((m) => ({ id: m, name: m }))} selected={gameModes} onChange={(v) => toggle(gameModes, setGameModes, v)} />
        </div>

        <div style={sec}>
          <div style={secTitle}>Sources & Priorities</div>
          <div style={g2}>
            <Field label="Sources Where Available" hint="One per line">
              <textarea style={{ ...inp, minHeight: '6rem', resize: 'vertical' }} value={sources} onChange={(e) => setSources(e.target.value)} placeholder={'The Bleed\nMotherboxes (Purple +)\nDaily Deals'} />
            </Field>
            <Field label="Transmute Priorities" hint="One per line">
              <textarea style={{ ...inp, minHeight: '6rem', resize: 'vertical' }} value={transmute} onChange={(e) => setTransmute(e.target.value)} placeholder={'Energy Gain Bonus\nP DEF\nCrit DMG RES'} />
            </Field>
          </div>
        </div>

        <div style={sec}>
          <div style={secTitle}>Investment Guidance</div>
          <div style={g2}>
            <Field label="Star Breakpoint" hint="Recommended star level to stop at">
              <select style={inp} value={starBreakpoint} onChange={(e) => setStarBreakpoint(e.target.value)}>
                <option value="">None</option>
                {STAR_OPTIONS.map((n) => <option key={n} value={n}>{n} {n === 1 ? 'Star' : 'Stars'}</option>)}
              </select>
            </Field>
            <Field label="AC/DC Priority" hint="Select all that apply">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {ACDCPRIORITY_OPTIONS.map((o) => (
                  <label key={o} style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    background: acDcPriority.includes(o) ? 'var(--purple)' : '#1a1a1a',
                    border: '1px solid #444', borderRadius: '0.375rem',
                    padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.82rem',
                  }}>
                    <input type="checkbox" checked={acDcPriority.includes(o)}
                      onChange={() => setAcDcPriority(prev => prev.includes(o) ? prev.filter(x => x !== o) : [...prev, o])}
                      style={{ accentColor: 'var(--gold)' }} />
                    {o}
                  </label>
                ))}
              </div>
            </Field>
          </div>
          <Field label="Whale or Skip Value" hint="Select one — click again to deselect">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {WHALE_SKIP_OPTIONS.map((o) => (
                <label key={o} style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  background: whaleOrSkipValue === o ? 'var(--purple)' : '#1a1a1a',
                  border: `1px solid ${whaleOrSkipValue === o ? 'var(--gold)' : '#444'}`,
                  borderRadius: '0.375rem',
                  padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.82rem',
                }}>
                  <input
                    type="radio"
                    name="whaleOrSkipValue"
                    checked={whaleOrSkipValue === o}
                    onChange={() => setWhaleOrSkipValue(whaleOrSkipValue === o ? '' : o)}
                    onClick={() => { if (whaleOrSkipValue === o) setWhaleOrSkipValue('') }}
                    style={{ accentColor: 'var(--gold)' }}
                  />
                  {o}
                </label>
              ))}
              {whaleOrSkipValue && (
                <button type="button" onClick={() => setWhaleOrSkipValue('')}
                  style={{ background: 'none', border: '1px dashed #555', borderRadius: '0.375rem', color: '#888', cursor: 'pointer', padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>
                  ✕ Clear
                </button>
              )}
            </div>
          </Field>
        </div>

        <div style={sec}>
          <div style={secTitle}>Recommended Legacy Pieces</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', alignSelf: 'flex-start' }}>
            <input type="checkbox" checked={uniqueLegacyRequired} onChange={(e) => setUniqueLegacyRequired(e.target.checked)} style={{ accentColor: 'var(--gold)', width: '1rem', height: '1rem' }} />
            <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.82rem' }}>Unique Legacy Required?</span>
            <span style={{ color: '#888', fontSize: '0.78rem' }}>(shows unique-required warning on champion page)</span>
          </label>
          {legacyOptions.length === 0
            ? <span style={{ color: '#888', fontSize: '0.85rem' }}>Loading...</span>
            : <IconCheckGroup options={legacyOptions} selected={legacyPieces} onChange={(v) => toggle(legacyPieces, setLegacyPieces, v)} />}
        </div>

        <div style={sec}>
          <div style={secTitle}>{"Quantum's Take"}</div>
          <Field label="Analysis">
            <textarea style={{ ...inp, minHeight: '9rem', resize: 'vertical' }} value={quantumsTake} onChange={(e) => setQuantumsTake(e.target.value)} placeholder="Your analysis of this champion..." />
          </Field>
        </div>

        <div style={sec}>
          <div style={secTitle}>In-game Strategy Guide</div>
          {gameGuide ? (
            <div style={{ fontSize: '0.82rem', color: '#bbb', lineHeight: 1.55, display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <div>{gameGuide.overview.replace(/\*\*/g, '')}</div>
              <div><strong style={{ color: '#ddd' }}>Stats:</strong> {gameGuide.recommendedStats.join(', ') || '—'} · <strong style={{ color: '#ddd' }}>Best for:</strong> {gameGuide.bestFor.join(', ') || '—'}</div>
              <div>
                <strong style={{ color: '#ddd' }}>Legacy:</strong>{' '}
                {gameGuide.legacyPieces.map((p) => p.name + (p.signature ? ' (signature)' : '')).join(', ')}
                {gameGuide.alternatives.length > 0 && <> · <strong style={{ color: '#ddd' }}>Alternatives:</strong> {gameGuide.alternatives.map((a) => a.name).join(', ')}</>}
              </div>
              {gameGuide.champions.length > 0 && <div><strong style={{ color: '#ddd' }}>Champions:</strong> {gameGuide.champions.map((c) => c.name).join(', ')}</div>}
              <div style={{ color: '#888' }}>This is the game&apos;s guide, shown on the champion page in place of the hand-picked legacy list above. Add your context below.</div>
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: '0.75rem' }}>
              {selectedId ? 'The game has no Strategy Guide for this champion; the page keeps the hand-picked legacy list.' : 'Load a champion to see the game’s guide.'}
            </div>
          )}
          <Field label="Quantum's notes on the guide">
            <textarea style={{ ...inp, minHeight: '6rem', resize: 'vertical' }} value={guideNotes} onChange={(e) => setGuideNotes(e.target.value)} placeholder="Where you agree or disagree with the game's picks (supports **bold**, - lists, blank-line paragraphs)..." />
          </Field>
        </div>

        <div style={sec}>
          <div style={secTitle}>Ultimate</div>
          <SingleSkill nameVal={ultimateName} descVal={ultimateDesc} onName={setUltimateName} onDesc={setUltimateDesc} onImage={setUltimateImage} existingImg={existingImages.ultimate} />
        </div>

        <div style={sec}>
          <div style={secTitle}>Global Skill</div>
          <SingleSkill nameVal={globalSkillName} descVal={globalSkillDesc} onName={setGlobalSkillName} onDesc={setGlobalSkillDesc} onImage={setGlobalSkillImage} existingImg={existingImages.globalSkill} />
        </div>

        <div style={sec}>
          <div style={secTitle}>Sub-Skills</div>
          <SkillSection title="Skill" rows={skills} setRows={setSkills}
            existingImages={Object.fromEntries(skills.map((_, i) => [`${i}`, existingImages[`skill_${i}`] ?? '']))} />
        </div>

        <div style={sec}>
          <div style={secTitle}>Multiversal Force Upgrades</div>
          <SkillSection title="Upgrade" rows={upgrades} setRows={setUpgrades}
            existingImages={Object.fromEntries(upgrades.map((_, i) => [`${i}`, existingImages[`upgrade_${i}`] ?? '']))} />
        </div>

        <button type="submit" className="btn" disabled={loading} style={{ alignSelf: 'flex-start', fontSize: '1rem', padding: '0.75rem 2rem' }}>
          {loading ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Champion'}
        </button>
      </form>
    </div>
  )
}

// ── Legacy Piece form ──────────────────────────────────────────────────────────
export function LegacyForm() {
  const [mode, setMode] = useState<'add' | 'edit'>('add')
  const [selectedId, setSelectedId] = useState('')
  const [items, setItems] = useState<ItemOption[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [name, setName] = useState(''); const [id, setId] = useState(''); const [idManual, setIdManual] = useState(false)
  const [rank, setRank] = useState(''); const [tier, setTier] = useState(''); const [role, setRole] = useState('')
  const [unique, setUnique] = useState(false); const [gearEffects, setGearEffects] = useState('')
  const [imgFile, setImgFile] = useState<File | null>(null); const [existingImg, setExistingImg] = useState('')
  const [skills, setSkills] = useState<SkillRow[]>([]); const [existingSkillImgs, setExistingSkillImgs] = useState<Record<string, string>>({})
  const [legIsNew, setLegIsNew] = useState(false); const [legIsP2W, setLegIsP2W] = useState(false)
  const [legClearPrevTier, setLegClearPrevTier] = useState(false); const [legExistingPrevTier, setLegExistingPrevTier] = useState('')

  useEffect(() => {
    fetch('/api/admin/dcdl/legacy').then((r) => r.json()).then((d: ItemOption[]) => setItems([...d].sort(byName)))
  }, [])

  const reset = useCallback(() => {
    setName(''); setId(''); setIdManual(false); setRank(''); setTier(''); setRole('')
    setUnique(false); setGearEffects(''); setImgFile(null); setExistingImg('')
    setSkills([]); setExistingSkillImgs({}); setSelectedId('')
    setLegIsNew(false); setLegIsP2W(false); setLegClearPrevTier(false); setLegExistingPrevTier('')
  }, [])

  async function loadItem(itemId: string) {
    if (!itemId) { reset(); return }
    const res = await fetch(`/api/admin/dcdl/legacy/full?id=${itemId}`)
    if (!res.ok) return
    const l = await res.json()
    setName(l.name ?? ''); setId(l.id ?? ''); setIdManual(true); setRank(l.rank ?? '')
    setTier(l.tier ?? ''); setRole(l.role ?? ''); setUnique(l.unique ?? false)
    setGearEffects((l.gearEffects ?? []).join('\n')); setExistingImg(l.image ?? '')
    setSkills((l.legacySkills ?? []).map((s: { name: string; description: string }) => ({ name: s.name, description: s.description, image: null })))
    setExistingSkillImgs(
      (l.legacySkills ?? []).reduce((a: Record<string, string>, s: { image?: string }, i: number) => { if (s.image) a[`${i}`] = s.image; return a }, {})
    )
    setLegIsNew(l.isNew ?? false); setLegIsP2W(l.isP2W ?? false)
    setLegExistingPrevTier(l.previousTier ?? ''); setLegClearPrevTier(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setStatus(null)
    const fd = new FormData()
    fd.append('id', id); fd.append('name', name); fd.append('rank', rank)
    fd.append('tier', tier); fd.append('role', role); fd.append('unique', String(unique))
    fd.append('isNew', String(legIsNew)); fd.append('isP2W', String(legIsP2W))
    if (legClearPrevTier) fd.append('clearPreviousTier', 'true')
    if (gearEffects) fd.append('gearEffects', gearEffects)
    if (imgFile) fd.append('image', imgFile)
    fd.append('skillCount', String(skills.length))
    skills.forEach((s, i) => { fd.append(`skill_${i}_name`, s.name); fd.append(`skill_${i}_description`, s.description); if (s.image) fd.append(`skill_${i}_image`, s.image) })

    try {
      const res = await fetch('/api/admin/dcdl/legacy', { method: mode === 'edit' ? 'PATCH' : 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        setStatus({ type: 'success', message: mode === 'edit' ? `"${name}" updated!` : `"${name}" added! Restart dev server to see it.` })
        if (mode === 'add') reset()
        fetch('/api/admin/dcdl/legacy').then((r) => r.json()).then((d: ItemOption[]) => setItems([...d].sort(byName)))
      } else {
        setStatus({ type: 'error', message: data.error ?? 'Something went wrong.' })
      }
    } catch { setStatus({ type: 'error', message: 'Network error.' }) }
    setLoading(false)
  }

  return (
    <div>
      <ModeToggle mode={mode} setMode={setMode} onReset={reset}
        addLabel="Add New Legacy Piece" editLabel="Edit Existing Legacy Piece" />

      {mode === 'edit' && (
        <div style={{ ...sec, marginBottom: '1.5rem' }}>
          <Field label="Select Legacy Piece" required>
            <select style={inp} value={selectedId} onChange={(e) => { setSelectedId(e.target.value); loadItem(e.target.value) }}>
              <option value="">Choose a legacy piece...</option>
              {items.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </Field>
        </div>
      )}

      <StatusBanner status={status} />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={sec}>
          <div style={secTitle}>Basic Info</div>
          <div style={g2}>
            <Field label="Name" required>
              <input style={inp} value={name} required onChange={(e) => { setName(e.target.value); if (!idManual) setId(toId(e.target.value)) }} />
            </Field>
            <Field label="ID (URL slug)" required hint="Auto-generated from name">
              <input style={inp} value={id} required onChange={(e) => { setId(e.target.value); setIdManual(true) }} />
            </Field>
          </div>
          <div style={g3}>
            <Field label="Rarity" required>
              <select style={inp} value={rank} required onChange={(e) => setRank(e.target.value)}>
                <option value="">Select...</option>{LEGACY_RARITIES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Tier" required hint="Starting tier for a new entry. Re-rank in the Tier Lists tab, which wins once saved.">
              <select style={inp} value={tier} required onChange={(e) => setTier(e.target.value)}>
                <option value="">Select...</option>{TIERS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Role" required>
              <select style={inp} value={role} required onChange={(e) => setRole(e.target.value)}>
                <option value="">Select...</option>{LEGACY_ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} style={{ accentColor: 'var(--gold)', width: '1rem', height: '1rem' }} />
            <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.82rem' }}>Unique</span>
            <span style={{ color: '#888', fontSize: '0.78rem' }}>(only one equippable per team)</span>
          </label>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={legIsNew} onChange={(e) => setLegIsNew(e.target.checked)} style={{ accentColor: 'var(--gold)', width: '1rem', height: '1rem' }} />
              <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.82rem' }}>New Legacy Piece</span>
              <span style={{ color: '#888', fontSize: '0.78rem' }}>(shows NEW badge)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={legIsP2W} onChange={(e) => setLegIsP2W(e.target.checked)} style={{ accentColor: 'var(--gold)', width: '1rem', height: '1rem' }} />
              <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.82rem' }}>Pay to Win</span>
              <span style={{ color: '#888', fontSize: '0.78rem' }}>(shows $ badge)</span>
            </label>
            {mode === 'edit' && legExistingPrevTier && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={legClearPrevTier} onChange={(e) => setLegClearPrevTier(e.target.checked)} style={{ accentColor: '#fbbf24', width: '1rem', height: '1rem' }} />
                <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.82rem' }}>Clear tier change arrow</span>
                <span style={{ color: '#888', fontSize: '0.78rem' }}>(currently: {legExistingPrevTier} → {tier})</span>
              </label>
            )}
          </div>
        </div>

        <div style={sec}>
          <div style={secTitle}>Image</div>
          <Field label="Legacy Piece Image" hint={existingImg ? `Current: ${existingImg.split('/').pop()}` : undefined}>
            <input type="file" accept="image/*" style={{ ...inp, padding: '0.35rem' }} onChange={(e) => setImgFile(e.target.files?.[0] ?? null)} />
            {imgFile && <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{imgFile.name}</span>}
          </Field>
        </div>

        <div style={sec}>
          <div style={secTitle}>Gear Effects</div>
          <Field label="Gear Effects" hint="One per line (e.g. ATK, HP%, Crit DMG)">
            <textarea style={{ ...inp, minHeight: '6rem', resize: 'vertical' }} value={gearEffects} onChange={(e) => setGearEffects(e.target.value)} placeholder={'ATK\nATK%\nCrit DMG'} />
          </Field>
        </div>

        <div style={sec}>
          <div style={secTitle}>Legacy Skills</div>
          <SkillSection title="Legacy Skill" rows={skills} setRows={setSkills} existingImages={existingSkillImgs} />
        </div>

        <button type="submit" className="btn" disabled={loading} style={{ alignSelf: 'flex-start', fontSize: '1rem', padding: '0.75rem 2rem' }}>
          {loading ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Legacy Piece'}
        </button>
      </form>
    </div>
  )
}

// ── Best Teams Form ────────────────────────────────────────────────────────────
type BtReplacementRow = { required: string; replacements: string[] }
type BestTeam = { rank: number; name: string; explanation: string; required: string[]; optional: string[]; replacements: BtReplacementRow[] }
type BtChamp = { id: string; name: string; imageHeadshot: string | null; rarity: string | null }

const BT_RARITY_BG: Record<string, string> = {
  'Iconic': '#00292a',
  'Mythic +': '#3a000f',
  'Mythic': '#3a0014',
  'Legendary': '#3a2d00',
  'Epic': '#2e0038',
}

function BtChampChip({ champ, size, onRemove }: { champ: BtChamp; size: number; onRemove?: () => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', champ.id); e.dataTransfer.effectAllowed = 'copy' }}
      title={champ.name}
      style={{ position: 'relative', width: size, cursor: 'grab', flexShrink: 0 }}
    >
      <img
        src={champ.imageHeadshot ?? ''}
        alt={champ.name}
        style={{
          width: size, height: size, objectFit: 'cover', borderRadius: '0.4rem',
          border: '1px solid #555', background: BT_RARITY_BG[champ.rarity ?? ''] ?? '#111',
          display: 'block', pointerEvents: 'none',
        }}
      />
      <span style={{
        display: 'block', fontSize: '0.55rem', color: '#aaa', textAlign: 'center', lineHeight: 1.15,
        marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {champ.name.split('(')[0].trim()}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${champ.name}`}
          style={{
            position: 'absolute', top: -7, right: -7, width: 18, height: 18,
            borderRadius: '50%', border: '1px solid #444', background: '#1a1a1a', color: '#f87171',
            fontSize: '0.62rem', lineHeight: 1, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 0, zIndex: 2,
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}

function BtDropZone({ onDropChamp, disabled, label, isEmpty, minHeight = 96, children }: {
  onDropChamp: (id: string) => void
  disabled?: boolean
  label: string
  isEmpty: boolean
  minHeight?: number
  children?: React.ReactNode
}) {
  const [over, setOver] = useState(false)
  return (
    <div
      onDragOver={(e) => { if (disabled || !e.dataTransfer.types.includes('text/plain')) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setOver(true) }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false) }}
      onDrop={(e) => {
        if (disabled) return
        e.preventDefault(); setOver(false)
        const id = e.dataTransfer.getData('text/plain')
        if (id) onDropChamp(id)
      }}
      style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'flex-start', alignContent: 'flex-start',
        minHeight,
        padding: '0.6rem',
        borderRadius: '0.5rem',
        border: `1.5px dashed ${over ? 'var(--gold)' : disabled ? '#333' : '#4a4a4a'}`,
        background: over ? 'rgba(204,164,83,0.08)' : disabled ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.03)',
        transition: 'border-color 120ms, background 120ms',
      }}
    >
      {children}
      {isEmpty && (
        <span style={{ fontSize: '0.7rem', color: disabled ? '#555' : '#777', margin: 'auto', pointerEvents: 'none', textAlign: 'center' }}>
          {label}
        </span>
      )}
    </div>
  )
}

function BtReqSlot({ champ, onDropChamp, onRemove }: {
  champ?: BtChamp
  onDropChamp: (id: string) => void
  onRemove: () => void
}) {
  const [over, setOver] = useState(false)
  if (champ) {
    return (
      <div style={{ padding: '0.3rem', border: '1.5px solid var(--gold)', borderRadius: '0.5rem', background: 'rgba(204,164,83,0.06)' }}>
        <BtChampChip champ={champ} size={64} onRemove={onRemove} />
      </div>
    )
  }
  return (
    <div
      onDragOver={(e) => { if (!e.dataTransfer.types.includes('text/plain')) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setOver(false)
        const id = e.dataTransfer.getData('text/plain')
        if (id) onDropChamp(id)
      }}
      title="Drag a champion here, or leave empty for a FLEX slot"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 84, height: 84, flexShrink: 0,
        borderRadius: '0.5rem',
        border: `1.5px dashed ${over ? 'var(--gold)' : 'rgba(204,164,83,0.35)'}`,
        background: over ? 'rgba(204,164,83,0.12)' : 'rgba(204,164,83,0.03)',
        color: 'rgba(204,164,83,0.6)', fontFamily: 'Unbounded, sans-serif',
        fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em',
        transition: 'border-color 120ms, background 120ms',
      }}
    >
      FLEX
    </div>
  )
}

// ── Supreme Commander form ──────────────────────────────────────────────────────
type ScPointRow = { item: string; value: number | null }
type ScPointTable = { label: string; rows: ScPointRow[] }
type ScRewardRound = { round: number; eyes: number; points: number }
type ScRewardTrack = { label: string; rounds: ScRewardRound[] }
type ScDay = {
  day: number; title: string; pointTable: string | null; rewardTrack: string | null
  noResources: boolean; usableItems: string[]; tips: string[]
}
type ScReward = { item: string; qty: number }
type ScMetropolis = {
  milestones: { label: string; description: string; thresholds: number[]; reward: ScReward[] }
  leagueOutcomes: { label: string; description: string; outcomes: { name: string; rewards: ScReward[] }[] }
  ranking: { label: string; description: string; tiers: { rank: string; rewards: ScReward[] }[] }
}
type ScData = {
  intro: string
  reward: { name: string; icon: string }
  itemIcons?: Record<string, string>
  itemNotes?: Record<string, string>
  days: ScDay[]
  pointTables: Record<string, ScPointTable>
  rewardTracks: Record<string, ScRewardTrack>
  metropolis?: ScMetropolis
}

// Editor for a list of { item, qty } rewards (used across the Metropolis sections).
function ScRewardRows({ rewards, onChange }: { rewards: ScReward[]; onChange: (next: ScReward[]) => void }) {
  const removeBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.78rem' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {rewards.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input style={{ ...inp, width: '7rem' }} type="number" value={r.qty} placeholder="Qty"
            onChange={(e) => onChange(rewards.map((x, xi) => xi === i ? { ...x, qty: Number(e.target.value) } : x))} />
          <input style={{ ...inp, flex: 1 }} value={r.item} placeholder="Item"
            onChange={(e) => onChange(rewards.map((x, xi) => xi === i ? { ...x, item: e.target.value } : x))} />
          <button type="button" style={removeBtn} onClick={() => onChange(rewards.filter((_, xi) => xi !== i))}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...rewards, { item: '', qty: 1 }])}
        style={{ background: 'var(--purple)', border: '1px solid #555', borderRadius: '0.375rem', color: '#fff', cursor: 'pointer', padding: '0.35rem 0.8rem', fontSize: '0.8rem', alignSelf: 'flex-start' }}>
        + Add Reward
      </button>
    </div>
  )
}

export function SupremeCommanderForm() {
  const [data, setData] = useState<ScData | null>(null)
  const [icons, setIcons] = useState<{ name: string; path: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin/dcdl/supreme-commander')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setStatus({ type: 'error', message: 'Failed to load data.' }))
    fetch('/api/admin/dcdl/resource-icons')
      .then((r) => r.json())
      .then((list) => setIcons(Array.isArray(list) ? list : []))
      .catch(() => {})
  }, [])

  function patch(mut: (draft: ScData) => void) {
    setData((prev) => {
      if (!prev) return prev
      const next = JSON.parse(JSON.stringify(prev)) as ScData
      mut(next)
      return next
    })
  }

  async function handleSave() {
    if (!data) return
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch('/api/admin/dcdl/supreme-commander', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setStatus(res.ok
        ? { type: 'success', message: 'Saved! Commit and deploy to publish.' }
        : { type: 'error', message: 'Something went wrong.' })
    } catch {
      setStatus({ type: 'error', message: 'Network error.' })
    }
    setLoading(false)
  }

  if (!data) return <p style={{ color: '#888' }}>Loading…</p>

  const pointTableKeys = Object.keys(data.pointTables)
  const rewardTrackKeys = Object.keys(data.rewardTracks)
  const metroItems = data.metropolis
    ? [
        ...data.metropolis.milestones.reward.map((r) => r.item),
        ...data.metropolis.leagueOutcomes.outcomes.flatMap((o) => o.rewards.map((r) => r.item)),
        ...data.metropolis.ranking.tiers.flatMap((t) => t.rewards.map((r) => r.item)),
      ]
    : []
  const uniqueItems = Array.from(
    new Set([
      ...pointTableKeys.flatMap((k) => data.pointTables[k].rows.map((r) => r.item)),
      ...metroItems,
    ])
  ).filter(Boolean)
  const removeBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem' }
  const addBtn: React.CSSProperties = { background: 'var(--purple)', border: '1px solid #555', borderRadius: '0.375rem', color: '#fff', cursor: 'pointer', padding: '0.4rem 0.9rem', fontSize: '0.82rem', alignSelf: 'flex-start' }

  return (
    <div>
      <StatusBanner status={status} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Intro + reward */}
        <div style={sec}>
          <div style={secTitle}>Overview</div>
          <Field label="Intro / description">
            <textarea style={{ ...inp, minHeight: '6rem', resize: 'vertical' }} value={data.intro}
              onChange={(e) => patch((d) => { d.intro = e.target.value })} />
          </Field>
          <div style={g2}>
            <Field label="Reward name">
              <input style={inp} value={data.reward.name} onChange={(e) => patch((d) => { d.reward.name = e.target.value })} />
            </Field>
            <Field label="Reward icon path">
              <input style={inp} value={data.reward.icon} onChange={(e) => patch((d) => { d.reward.icon = e.target.value })} />
            </Field>
          </div>
        </div>

        {/* Days */}
        {data.days.map((day, di) => (
          <div key={di} style={sec}>
            <div style={secTitle}>Day {day.day}</div>
            <div style={g2}>
              <Field label="Title / theme">
                <input style={inp} value={day.title} onChange={(e) => patch((d) => { d.days[di].title = e.target.value })} />
              </Field>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ccc', fontSize: '0.85rem', alignSelf: 'end', paddingBottom: '0.5rem' }}>
                <input type="checkbox" checked={day.noResources} style={{ accentColor: 'var(--gold)' }}
                  onChange={(e) => patch((d) => { d.days[di].noResources = e.target.checked })} />
                No resources required (Metropolis-style day)
              </label>
            </div>
            <div style={g2}>
              <Field label="Point value table">
                <select style={inp} value={day.pointTable ?? ''} onChange={(e) => patch((d) => { d.days[di].pointTable = e.target.value || null })}>
                  <option value="">None</option>
                  {pointTableKeys.map((k) => <option key={k} value={k}>{data.pointTables[k].label} ({k})</option>)}
                </select>
              </Field>
              <Field label="Reward track">
                <select style={inp} value={day.rewardTrack ?? ''} onChange={(e) => patch((d) => { d.days[di].rewardTrack = e.target.value || null })}>
                  <option value="">None</option>
                  {rewardTrackKeys.map((k) => <option key={k} value={k}>{data.rewardTracks[k].label} ({k})</option>)}
                </select>
              </Field>
            </div>
            {day.pointTable && data.pointTables[day.pointTable] && (
              <Field label="Usable items this day" hint="Checked items glow gold in the points table on the site for this day.">
                <CheckGroup
                  options={data.pointTables[day.pointTable].rows.map((r) => ({ id: r.item, name: r.item }))}
                  selected={day.usableItems}
                  onChange={(id) => patch((d) => {
                    const set = new Set(d.days[di].usableItems)
                    if (set.has(id)) set.delete(id); else set.add(id)
                    d.days[di].usableItems = Array.from(set)
                  })}
                />
              </Field>
            )}
            <Field label="Strategy tips">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {day.tips.map((tip, ti) => (
                  <div key={ti} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <textarea style={{ ...inp, minHeight: '3rem', resize: 'vertical', flex: 1 }} value={tip}
                      onChange={(e) => patch((d) => { d.days[di].tips[ti] = e.target.value })} />
                    <button type="button" style={removeBtn} onClick={() => patch((d) => { d.days[di].tips.splice(ti, 1) })}>Remove</button>
                  </div>
                ))}
                <button type="button" style={addBtn} onClick={() => patch((d) => { d.days[di].tips.push('') })}>+ Add Tip</button>
              </div>
            </Field>
          </div>
        ))}

        {/* Point tables */}
        {pointTableKeys.map((key) => (
          <div key={key} style={sec}>
            <div style={secTitle}>Point Values — {data.pointTables[key].label} ({key})</div>
            <Field label="Table label">
              <input style={inp} value={data.pointTables[key].label} onChange={(e) => patch((d) => { d.pointTables[key].label = e.target.value })} />
            </Field>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.pointTables[key].rows.map((row, ri) => (
                <div key={ri} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input style={{ ...inp, flex: 1 }} value={row.item} placeholder="Item"
                    onChange={(e) => patch((d) => { d.pointTables[key].rows[ri].item = e.target.value })} />
                  <input style={{ ...inp, width: '7rem' }} type="number" value={row.value ?? ''} placeholder="TBD"
                    onChange={(e) => patch((d) => { d.pointTables[key].rows[ri].value = e.target.value === '' ? null : Number(e.target.value) })} />
                  <button type="button" style={removeBtn} onClick={() => patch((d) => { d.pointTables[key].rows.splice(ri, 1) })}>Remove</button>
                </div>
              ))}
              <button type="button" style={addBtn} onClick={() => patch((d) => { d.pointTables[key].rows.push({ item: '', value: 0 }) })}>+ Add Item</button>
            </div>
          </div>
        ))}

        {/* Reward tracks */}
        {rewardTrackKeys.map((key) => (
          <div key={key} style={sec}>
            <div style={secTitle}>Reward Track — {data.rewardTracks[key].label} ({key})</div>
            <Field label="Track label">
              <input style={inp} value={data.rewardTracks[key].label} onChange={(e) => patch((d) => { d.rewardTracks[key].label = e.target.value })} />
            </Field>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.72rem', color: '#888' }}>
                <span style={{ width: '5rem' }}>Round</span>
                <span style={{ width: '6rem' }}>{data.reward.name}s</span>
                <span style={{ flex: 1 }}>Points threshold</span>
              </div>
              {data.rewardTracks[key].rounds.map((rd, ri) => (
                <div key={ri} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input style={{ ...inp, width: '5rem' }} type="number" value={rd.round}
                    onChange={(e) => patch((d) => { d.rewardTracks[key].rounds[ri].round = Number(e.target.value) })} />
                  <input style={{ ...inp, width: '6rem' }} type="number" value={rd.eyes}
                    onChange={(e) => patch((d) => { d.rewardTracks[key].rounds[ri].eyes = Number(e.target.value) })} />
                  <input style={{ ...inp, flex: 1 }} type="number" value={rd.points}
                    onChange={(e) => patch((d) => { d.rewardTracks[key].rounds[ri].points = Number(e.target.value) })} />
                  <button type="button" style={removeBtn} onClick={() => patch((d) => { d.rewardTracks[key].rounds.splice(ri, 1) })}>Remove</button>
                </div>
              ))}
              <button type="button" style={addBtn} onClick={() => patch((d) => {
                const rounds = d.rewardTracks[key].rounds
                rounds.push({ round: rounds.length + 1, eyes: 1, points: 0 })
              })}>+ Add Round</button>
            </div>
          </div>
        ))}

        {/* Resource icons */}
        <div style={sec}>
          <div style={secTitle}>Resource Icons &amp; Notes</div>
          <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>
            Assign an image to each resource. On the site the image replaces the name in the points tables, with the full name shown as a hover tooltip. Leave as &ldquo;None&rdquo; to keep showing the text name. The optional <em>note</em> is appended to that tooltip (e.g. &ldquo;(per VIP Point gained)&rdquo;). New art added to <code>public/dcdl/resource_icons/</code> shows up here automatically.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {uniqueItems.map((item) => {
              const current = data.itemIcons?.[item] ?? ''
              const note = data.itemNotes?.[item] ?? ''
              return (
                <div key={item} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <span style={{ width: '2.4rem', height: '2.4rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', border: '1px solid #333', borderRadius: '0.375rem' }}>
                    {current
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={encodeURI(current)} alt={item} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      : <span style={{ fontSize: '0.7rem', color: '#555' }}>—</span>}
                  </span>
                  <span style={{ flex: 1, fontSize: '0.85rem', color: '#ddd' }}>{item}</span>
                  <input style={{ ...inp, width: '12rem' }} value={note} placeholder="Tooltip note (optional)"
                    onChange={(e) => patch((d) => {
                      if (!d.itemNotes) d.itemNotes = {}
                      if (e.target.value) d.itemNotes[item] = e.target.value
                      else delete d.itemNotes[item]
                    })} />
                  <select style={{ ...inp, width: '15rem' }} value={current}
                    onChange={(e) => patch((d) => {
                      if (!d.itemIcons) d.itemIcons = {}
                      if (e.target.value) d.itemIcons[item] = e.target.value
                      else delete d.itemIcons[item]
                    })}>
                    <option value="">— None (show name) —</option>
                    {icons.map((ic) => <option key={ic.path} value={ic.path}>{ic.name}</option>)}
                  </select>
                </div>
              )
            })}
          </div>
        </div>

        {/* Metropolis Maneuvers (Day 6) rewards */}
        {data.metropolis && (
          <>
            <div style={sec}>
              <div style={secTitle}>Metropolis — Battle Milestones</div>
              <div style={g2}>
                <Field label="Label">
                  <input style={inp} value={data.metropolis.milestones.label}
                    onChange={(e) => patch((d) => { d.metropolis!.milestones.label = e.target.value })} />
                </Field>
                <Field label="Milestones (comma-separated battle counts)">
                  <input style={inp} value={data.metropolis.milestones.thresholds.join(', ')}
                    onChange={(e) => patch((d) => {
                      d.metropolis!.milestones.thresholds = e.target.value.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n))
                    })} />
                </Field>
              </div>
              <Field label="Description">
                <textarea style={{ ...inp, minHeight: '3rem', resize: 'vertical' }} value={data.metropolis.milestones.description}
                  onChange={(e) => patch((d) => { d.metropolis!.milestones.description = e.target.value })} />
              </Field>
              <Field label="Reward earned at each milestone">
                <ScRewardRows rewards={data.metropolis.milestones.reward}
                  onChange={(next) => patch((d) => { d.metropolis!.milestones.reward = next })} />
              </Field>
            </div>

            <div style={sec}>
              <div style={secTitle}>Metropolis — League-Wide Rewards</div>
              <Field label="Description">
                <textarea style={{ ...inp, minHeight: '3rem', resize: 'vertical' }} value={data.metropolis.leagueOutcomes.description}
                  onChange={(e) => patch((d) => { d.metropolis!.leagueOutcomes.description = e.target.value })} />
              </Field>
              {data.metropolis.leagueOutcomes.outcomes.map((o, oi) => (
                <div key={oi} style={{ background: '#111', border: '1px solid #333', borderRadius: '0.375rem', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <Field label="Outcome name">
                    <input style={inp} value={o.name}
                      onChange={(e) => patch((d) => { d.metropolis!.leagueOutcomes.outcomes[oi].name = e.target.value })} />
                  </Field>
                  <ScRewardRows rewards={o.rewards}
                    onChange={(next) => patch((d) => { d.metropolis!.leagueOutcomes.outcomes[oi].rewards = next })} />
                </div>
              ))}
            </div>

            <div style={sec}>
              <div style={secTitle}>Metropolis — Individual Ranking Rewards</div>
              <Field label="Description">
                <textarea style={{ ...inp, minHeight: '3rem', resize: 'vertical' }} value={data.metropolis.ranking.description}
                  onChange={(e) => patch((d) => { d.metropolis!.ranking.description = e.target.value })} />
              </Field>
              {data.metropolis.ranking.tiers.map((t, ti) => (
                <div key={ti} style={{ background: '#111', border: '1px solid #333', borderRadius: '0.375rem', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <Field label="Rank label (e.g. 1, 2–3, 4–10)">
                      <input style={{ ...inp, width: '10rem' }} value={t.rank}
                        onChange={(e) => patch((d) => { d.metropolis!.ranking.tiers[ti].rank = e.target.value })} />
                    </Field>
                    <button type="button" style={{ ...removeBtn, marginBottom: '0.5rem' }}
                      onClick={() => patch((d) => { d.metropolis!.ranking.tiers.splice(ti, 1) })}>Remove tier</button>
                  </div>
                  <ScRewardRows rewards={t.rewards}
                    onChange={(next) => patch((d) => { d.metropolis!.ranking.tiers[ti].rewards = next })} />
                </div>
              ))}
              <button type="button" style={addBtn}
                onClick={() => patch((d) => { d.metropolis!.ranking.tiers.push({ rank: '', rewards: [] }) })}>+ Add Rank Tier</button>
            </div>
          </>
        )}

        <button type="button" className="btn" disabled={loading} onClick={handleSave}
          style={{ alignSelf: 'flex-start', fontSize: '1rem', padding: '0.75rem 2rem' }}>
          {loading ? 'Saving…' : 'Save Supreme Commander'}
        </button>
      </div>
    </div>
  )
}

export function BestTeamsForm() {
  const [champs, setChamps] = useState<BtChamp[]>([])
  const [teams, setTeams] = useState<BestTeam[]>(
    Array.from({ length: 10 }, (_, i) => ({ rank: i + 1, name: '', explanation: '', required: ['', '', '', '', ''], optional: [], replacements: [] }))
  )
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [teamDragRank, setTeamDragRank] = useState<number | null>(null)
  const [teamOverRank, setTeamOverRank] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/admin/dcdl/champions').then((r) => r.json()).then((data: BtChamp[]) =>
      setChamps([...data].sort((a, b) => a.name.localeCompare(b.name)))
    )
    fetch('/api/admin/dcdl/best-teams').then((r) => r.json()).then((data: Partial<BestTeam>[]) => {
      const count = data.length > 0 ? data.length : 10
      setTeams(Array.from({ length: count }, (_, i) => {
        const t = data[i] ?? {}
        return {
          rank: i + 1,
          name: t.name ?? '',
          explanation: t.explanation ?? '',
          required: [...(t.required ?? []), '', '', '', '', ''].slice(0, 5),
          optional: (t.optional ?? []).filter(Boolean),
          replacements: (t.replacements ?? []).map((r) => ({ required: r.required, replacements: (r.replacements ?? []).filter(Boolean) })),
        }
      }))
    })
  }, [])

  const champMap: Record<string, BtChamp> = Object.fromEntries(champs.map((c) => [c.id, c]))
  const filteredChamps = champs.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  function mutateTeam(rank: number, fn: (t: BestTeam) => BestTeam) {
    setTeams((prev) => prev.map((t) => (t.rank === rank ? fn(t) : t)))
  }

  function moveTeam(fromRank: number, toRank: number) {
    if (fromRank === toRank) return
    setTeams((prev) => {
      const arr = [...prev]
      const fromIdx = arr.findIndex((t) => t.rank === fromRank)
      const toIdx = arr.findIndex((t) => t.rank === toRank)
      if (fromIdx === -1 || toIdx === -1) return prev
      const [moved] = arr.splice(fromIdx, 1)
      arr.splice(toIdx, 0, moved)
      return arr.map((t, i) => ({ ...t, rank: i + 1 }))
    })
  }

  // Required is a positional 5-slot array: indices 0-1 = Frontline, 2-4 = Backline.
  const dropOnReqSlot = (rank: number, slot: number) => (champId: string) => mutateTeam(rank, (t) => {
    const required = t.required.map((id) => (id === champId ? '' : id)) // champ can't occupy two slots
    required[slot] = champId
    return { ...t, required, optional: t.optional.filter((o) => o !== champId) }
  })

  const removeReqSlot = (rank: number, slot: number) => mutateTeam(rank, (t) => {
    const removedId = t.required[slot]
    const required = [...t.required]
    required[slot] = ''
    return { ...t, required, replacements: t.replacements.filter((r) => r.required !== removedId) }
  })

  const dropOnOptional = (rank: number) => (champId: string) => mutateTeam(rank, (t) => {
    if (t.optional.includes(champId)) return t
    const required = t.required.map((id) => (id === champId ? '' : id))
    if (required.filter(Boolean).length >= 5) return t // all required slots filled → optional locked
    return { ...t, required, optional: [...t.optional, champId], replacements: t.replacements.filter((r) => r.required !== champId) }
  })

  const removeOptional = (rank: number, champId: string) => mutateTeam(rank, (t) => ({
    ...t, optional: t.optional.filter((o) => o !== champId),
  }))

  const clearTeam = (rank: number) => mutateTeam(rank, (t) => ({ ...t, required: ['', '', '', '', ''], optional: [], replacements: [] }))

  const addTeam = () => setTeams((prev) => [
    ...prev,
    { rank: prev.length + 1, name: '', explanation: '', required: ['', '', '', '', ''], optional: [], replacements: [] },
  ])

  const removeTeam = (rank: number) => setTeams((prev) =>
    prev.filter((t) => t.rank !== rank).map((t, i) => ({ ...t, rank: i + 1 }))
  )

  const addReplacementRow = (rank: number) => (champId: string) => mutateTeam(rank, (t) => {
    if (!t.required.includes(champId) || t.replacements.some((r) => r.required === champId)) return t
    return { ...t, replacements: [...t.replacements, { required: champId, replacements: [] }] }
  })

  const addReplacement = (rank: number, reqId: string) => (champId: string) => mutateTeam(rank, (t) => ({
    ...t,
    replacements: t.replacements.map((r) =>
      r.required === reqId && champId !== reqId && !r.replacements.includes(champId)
        ? { ...r, replacements: [...r.replacements, champId] }
        : r
    ),
  }))

  const removeReplacementRow = (rank: number, reqId: string) => mutateTeam(rank, (t) => ({
    ...t, replacements: t.replacements.filter((r) => r.required !== reqId),
  }))

  const removeReplacement = (rank: number, reqId: string, champId: string) => mutateTeam(rank, (t) => ({
    ...t,
    replacements: t.replacements.map((r) =>
      r.required === reqId ? { ...r, replacements: r.replacements.filter((c) => c !== champId) } : r
    ),
  }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setStatus(null)
    const payload = teams.map((t) => ({
      rank: t.rank,
      name: t.name,
      explanation: t.explanation,
      required: t.required,
      optional: t.required.filter(Boolean).length >= 5 ? [] : t.optional,
      replacements: t.replacements.filter((r) => r.replacements.length > 0),
    }))
    try {
      const res = await fetch('/api/admin/dcdl/best-teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      setStatus(res.ok ? { type: 'success', message: 'Best teams saved!' } : { type: 'error', message: data.error ?? 'Something went wrong.' })
    } catch { setStatus({ type: 'error', message: 'Network error.' }) }
    setLoading(false)
  }

  const zoneLabel = (color: string): React.CSSProperties => ({
    fontSize: '0.72rem', fontWeight: 600, color, marginBottom: '0.45rem',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  })

  return (
    <div>
      <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        Drag champion portraits from the palette onto the formation — 2 Frontline + 3 Backline. Any slot you leave empty
        shows as a FLEX slot on the site, filled by your Flex Picks (unlimited while a FLEX slot is open).
        Drag the ⠿ handle (or use ▲▼) to move a whole team to a new rank. Use &quot;+ Add Team&quot; / &quot;Remove&quot;
        to change how many teams there are. Teams left empty are skipped on the public page.
      </p>

      {/* Persistent champion palette */}
      <div style={{
        position: 'sticky', top: '4.25rem', zIndex: 50,
        background: '#141414', border: '1px solid #333', borderRadius: '0.5rem',
        padding: '0.75rem', marginBottom: '1.5rem',
        boxShadow: '0 10px 28px rgba(0,0,0,0.55)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ ...secTitle, border: 'none', paddingBottom: 0, marginBottom: 0 }}>Champion Palette</span>
          <input
            style={{ ...inp, maxWidth: '15rem', padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
            placeholder="Search champions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span style={{ fontSize: '0.7rem', color: '#777' }}>
            Drag into any team. Champions can appear on multiple teams.
          </span>
        </div>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.55rem',
          maxHeight: '11.5rem', overflowY: 'auto', paddingRight: '0.25rem',
        }}>
          {filteredChamps.map((c) => <BtChampChip key={c.id} champ={c} size={54} />)}
          {filteredChamps.length === 0 && <span style={{ fontSize: '0.75rem', color: '#666' }}>No champions match &quot;{search}&quot;</span>}
        </div>
      </div>

      <StatusBanner status={status} />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {teams.map((team) => {
          const filledRequired = team.required.filter(Boolean)
          const locked = filledRequired.length >= 5
          const teamEmpty = filledRequired.length === 0 && team.optional.length === 0 && team.replacements.length === 0
          const isDragTarget = teamOverRank === team.rank && teamDragRank !== null && teamDragRank !== team.rank
          const nudgeBtn: React.CSSProperties = {
            background: 'none', border: '1px solid #444', borderRadius: '0.375rem',
            color: '#aaa', cursor: 'pointer', padding: '0.25rem 0.55rem', fontSize: '0.7rem', lineHeight: 1,
          }
          return (
            <div
              key={team.rank}
              onDragOver={(e) => {
                if (!e.dataTransfer.types.includes('application/x-bt-team')) return
                e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setTeamOverRank(team.rank)
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setTeamOverRank((prev) => (prev === team.rank ? null : prev))
              }}
              onDrop={(e) => {
                const from = e.dataTransfer.getData('application/x-bt-team')
                if (from) { e.preventDefault(); moveTeam(Number(from), team.rank) }
                setTeamOverRank(null); setTeamDragRank(null)
              }}
              style={{
                ...sec,
                border: isDragTarget ? '1.5px dashed var(--gold)' : '1px solid #333',
                opacity: teamDragRank === team.rank ? 0.45 : 1,
                transition: 'opacity 120ms, border-color 120ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
                  <span
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/x-bt-team', String(team.rank))
                      e.dataTransfer.effectAllowed = 'move'
                      setTeamDragRank(team.rank)
                    }}
                    onDragEnd={() => { setTeamDragRank(null); setTeamOverRank(null) }}
                    title="Drag to move this team to another rank"
                    style={{ cursor: 'grab', color: '#777', fontSize: '0.95rem', letterSpacing: '0.1em', userSelect: 'none', padding: '0.1rem 0.2rem' }}
                  >
                    ⠿
                  </span>
                  <div style={{ ...secTitle, border: 'none', paddingBottom: 0, marginBottom: 0, whiteSpace: 'nowrap' }}>Team #{team.rank}</div>
                  <input
                    style={{ ...inp, maxWidth: '20rem', padding: '0.35rem 0.6rem', fontSize: '0.82rem' }}
                    value={team.name}
                    onChange={(e) => mutateTeam(team.rank, (t) => ({ ...t, name: e.target.value }))}
                    placeholder="Team name (shown on public page)"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button type="button" onClick={() => moveTeam(team.rank, team.rank - 1)} disabled={team.rank === 1}
                    title="Move up one rank" style={{ ...nudgeBtn, opacity: team.rank === 1 ? 0.3 : 1 }}>▲</button>
                  <button type="button" onClick={() => moveTeam(team.rank, team.rank + 1)} disabled={team.rank === teams.length}
                    title="Move down one rank" style={{ ...nudgeBtn, opacity: team.rank === teams.length ? 0.3 : 1 }}>▼</button>
                  <button
                    type="button"
                    onClick={() => clearTeam(team.rank)}
                    disabled={teamEmpty}
                    style={{
                      background: 'none', border: '1px solid #6b2727', borderRadius: '0.375rem',
                      color: '#f87171', cursor: 'pointer', padding: '0.3rem 0.8rem', fontSize: '0.75rem',
                      marginLeft: '0.4rem',
                      opacity: teamEmpty ? 0.35 : 1,
                    }}
                  >
                    Clear Team
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (teamEmpty || window.confirm(`Remove Team #${team.rank}? This deletes its champions and notes.`)) removeTeam(team.rank) }}
                    title="Delete this team"
                    style={{
                      background: '#3a1414', border: '1px solid #6b2727', borderRadius: '0.375rem',
                      color: '#f87171', cursor: 'pointer', padding: '0.3rem 0.8rem', fontSize: '0.75rem',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <Field label="Explanation">
                <textarea
                  style={{ ...inp, minHeight: '4rem', resize: 'vertical' }}
                  value={team.explanation}
                  onChange={(e) => mutateTeam(team.rank, (t) => ({ ...t, explanation: e.target.value }))}
                  placeholder="Describe this team's strengths, game modes, playstyle..."
                />
              </Field>

              <div>
                <div style={zoneLabel('var(--gold)')}>Required Core — Formation ({filledRequired.length}/5)</div>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
                  padding: '0.85rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid #2a2a2a',
                }}>
                  <span style={{ fontSize: '0.6rem', color: '#888', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'Unbounded, sans-serif' }}>Frontline</span>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem' }}>
                    {[0, 1].map((slot) => (
                      <BtReqSlot key={slot} champ={champMap[team.required[slot]]} onDropChamp={dropOnReqSlot(team.rank, slot)} onRemove={() => removeReqSlot(team.rank, slot)} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.6rem', color: '#888', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'Unbounded, sans-serif', marginTop: '0.25rem' }}>Backline</span>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem' }}>
                    {[2, 3, 4].map((slot) => (
                      <BtReqSlot key={slot} champ={champMap[team.required[slot]]} onDropChamp={dropOnReqSlot(team.rank, slot)} onRemove={() => removeReqSlot(team.rank, slot)} />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div style={zoneLabel('#888')}>
                  Flex Picks {locked ? '— locked (core is full)' : `(${team.optional.length})`}
                </div>
                <BtDropZone
                  onDropChamp={dropOnOptional(team.rank)}
                  disabled={locked}
                  label={locked ? 'Locked — all 5 required slots are filled (no FLEX slots open)' : 'Drag champions here — these fill the FLEX slots (unlimited)'}
                  isEmpty={team.optional.length === 0}
                >
                  {team.optional.map((id) => champMap[id] && (
                    <BtChampChip key={id} champ={champMap[id]} size={52} onRemove={() => removeOptional(team.rank, id)} />
                  ))}
                </BtDropZone>
                {locked && team.optional.length > 0 && (
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.7rem', color: '#fbbf24' }}>
                    The core is full (all 5 slots filled) — these flex picks will be removed on save. Open a slot to keep them.
                  </p>
                )}
              </div>

              <div>
                <div style={zoneLabel('#a78bfa')}>Viable Replacements</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {team.replacements.map((row) => champMap[row.required] && (
                    <div key={row.required} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        padding: '0.45rem', border: '1.5px solid var(--gold)', borderRadius: '0.5rem',
                        background: 'rgba(204,164,83,0.06)', flexShrink: 0,
                      }}>
                        <BtChampChip champ={champMap[row.required]} size={56} onRemove={() => removeReplacementRow(team.rank, row.required)} />
                      </div>
                      <span style={{ color: 'var(--gold)', fontSize: '1.3rem', flexShrink: 0 }} aria-hidden>→</span>
                      <div style={{ flex: 1 }}>
                        <BtDropZone
                          onDropChamp={addReplacement(team.rank, row.required)}
                          label="Drag replacement champions here"
                          isEmpty={row.replacements.length === 0}
                          minHeight={76}
                        >
                          {row.replacements.map((id) => champMap[id] && (
                            <BtChampChip key={id} champ={champMap[id]} size={52} onRemove={() => removeReplacement(team.rank, row.required, id)} />
                          ))}
                        </BtDropZone>
                      </div>
                    </div>
                  ))}
                  <BtDropZone
                    onDropChamp={addReplacementRow(team.rank)}
                    disabled={team.required.length === 0}
                    label={team.required.length === 0
                      ? 'Add required champions first'
                      : 'Drag a REQUIRED champion here to define its replacements'}
                    isEmpty
                    minHeight={52}
                  />
                </div>
              </div>
            </div>
          )
        })}
        <button
          type="button"
          onClick={addTeam}
          style={{
            alignSelf: 'flex-start', background: 'none', border: '1px dashed #555',
            borderRadius: '0.5rem', color: 'var(--gold)', cursor: 'pointer',
            padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontFamily: 'Unbounded, sans-serif',
          }}
        >
          + Add Team
        </button>
        <button type="submit" className="btn" disabled={loading} style={{ alignSelf: 'flex-start', fontSize: '1rem', padding: '0.75rem 2rem' }}>
          {loading ? 'Saving...' : `Save All Teams (${teams.length})`}
        </button>
      </form>
    </div>
  )
}

// ── Combat Cycle Form ─────────────────────────────────────────────────────────
// Boss names and skills come from the game files (scripts/sync-dcdl-kits.mjs);
// what is edited here is Quantum's: his take, his latest guide video, and the
// ordered list of best champions for the fight.
type CCStatusEffectItem = { name: string; effect: string }
type CCSkillItem = { name: string; description: string; type?: string; status_effects?: CCStatusEffectItem[] }
type CCCurrencyItem = { name: string; image: string }
type CCBossItem = {
  id: string; name: string; ccTag: string; day: string
  currencies: CCCurrencyItem[]; image: string; portrait: string
  mechanics: string; skills: CCSkillItem[]
  videoUrl?: string; bestChampions?: string[]
}

const ytId = (url?: string) => url?.match(/(?:youtu\.be\/|[?&]v=|\/(?:embed|shorts|live)\/)([\w-]{11})/)?.[1] ?? null

export function CombatCycleForm() {
  const [bosses, setBosses] = useState<CCBossItem[]>([])
  const [icons, setIcons] = useState<string[]>([])
  const [champs, setChamps] = useState<BtChamp[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [draft, setDraft] = useState<CCBossItem | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin/dcdl/combat-cycle')
      .then((r) => r.json())
      .then((d: { bosses: CCBossItem[]; icons: string[] }) => {
        setBosses(d.bosses ?? [])
        setIcons(d.icons ?? [])
        if ((d.bosses ?? []).length > 0) {
          setSelectedId(d.bosses[0].id)
          setDraft(structuredClone(d.bosses[0]))
        }
      })
    fetch('/api/admin/dcdl/champions').then((r) => r.json()).then((d: BtChamp[]) => setChamps([...d].sort(byName)))
  }, [])

  const champById = new Map(champs.map((c) => [c.id, c]))
  const picks = draft?.bestChampions ?? []
  const saved = bosses.find((b) => b.id === selectedId)
  const dirty = !!draft && !!saved && JSON.stringify(draft) !== JSON.stringify(saved)

  function pick(id: string) {
    const boss = bosses.find((b) => b.id === id)
    if (!boss) return
    if (dirty && !window.confirm(`Discard unsaved changes to ${draft!.name}?`)) return
    setSelectedId(id)
    setDraft(structuredClone(boss))
    setStatus(null)
  }

  function edit(patch: Partial<CCBossItem>) {
    setDraft((d) => (d ? { ...d, ...patch } : d))
  }

  function movePick(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= picks.length) return
    const next = [...picks]
    ;[next[i], next[j]] = [next[j], next[i]]
    edit({ bestChampions: next })
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!draft) return
    setLoading(true); setStatus(null)
    try {
      const res = await fetch('/api/admin/dcdl/combat-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus({ type: 'success', message: `Saved ${draft.name}. Commit and push to publish.` })
        setBosses((prev) => prev.map((b) => (b.id === data.boss.id ? data.boss : b)))
        setDraft(structuredClone(data.boss))
      } else {
        setStatus({ type: 'error', message: data.error ?? 'Something went wrong.' })
      }
    } catch { setStatus({ type: 'error', message: 'Network error.' }) }
    setLoading(false)
  }

  if (!draft) {
    return <p style={{ color: '#888', fontSize: '0.85rem' }}>Loading Combat Cycle bosses…</p>
  }

  const q = search.trim().toLowerCase()
  const suggestions = q ? champs.filter((c) => !picks.includes(c.id) && c.name.toLowerCase().includes(q)).slice(0, 12) : []
  const vid = ytId(draft.videoUrl)

  return (
    <div>
      <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Boss names and skills update from the game files. Per boss, set your take, your latest guide video and the best
        champions for the fight. A save writes only that boss.
      </p>
      <StatusBanner status={status} />

      {/* Boss picker */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {bosses.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => pick(b.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
              padding: '0.4rem', width: '6rem', cursor: 'pointer',
              background: selectedId === b.id ? 'rgba(204,164,83,0.15)' : '#1a1a1a',
              border: selectedId === b.id ? '1px solid var(--gold)' : '1px solid #444',
              borderRadius: '0.5rem',
            }}
          >
            {b.portrait && (
              <img src={`/dcdl/combat-cycle/${b.portrait}`} alt="" style={{ width: '100%', aspectRatio: '4 / 5', objectFit: 'cover', borderRadius: '0.3rem' }} />
            )}
            <span style={{ fontSize: '0.65rem', color: selectedId === b.id ? 'var(--gold)' : '#bbb', textAlign: 'center', lineHeight: 1.2 }}>
              {b.name}
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={sec}>
          <div style={secTitle}>Quantum&apos;s Take</div>
          <textarea
            style={{ ...inp, minHeight: '9rem', resize: 'vertical' }}
            value={draft.mechanics}
            onChange={(e) => edit({ mechanics: e.target.value })}
            placeholder={`How to approach ${draft.name}…`}
          />
          <span style={{ fontSize: '0.72rem', color: '#777' }}>Blank line = new paragraph · ## heading · - bullet · **bold**</span>
        </div>

        <div style={sec}>
          <div style={secTitle}>Guide Video</div>
          <input
            style={inp}
            value={draft.videoUrl ?? ''}
            onChange={(e) => edit({ videoUrl: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=…"
          />
          {draft.videoUrl && !vid && <span style={{ fontSize: '0.75rem', color: '#f87171' }}>That doesn&apos;t look like a YouTube link.</span>}
          {vid && (
            <img src={`https://i.ytimg.com/vi/${vid}/mqdefault.jpg`} alt="Video thumbnail" style={{ width: 240, borderRadius: '0.4rem', border: '1px solid #333' }} />
          )}
        </div>

        <div style={sec}>
          <div style={secTitle}>Best Champions ({picks.length})</div>
          <span style={{ fontSize: '0.75rem', color: '#777' }}>
            In order: the first one is your top pick. Each one also lists &quot;{draft.ccTag}&quot; on its champion page.
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {picks.map((id, i) => {
              const c = champById.get(id)
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#151515', border: '1px solid #2a2a2a', borderRadius: '0.4rem', padding: '0.3rem 0.5rem' }}>
                  <span style={{ width: '1.4rem', fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 700 }}>{i + 1}</span>
                  {c?.imageHeadshot && <img src={c.imageHeadshot} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} />}
                  <span style={{ flex: 1, fontSize: '0.85rem', color: c ? '#ddd' : '#f87171' }}>{c?.name ?? `${id} (not found)`}</span>
                  <button type="button" className="btn" style={{ background: 'var(--purple)', padding: '0.25rem 0.5rem' }} onClick={() => movePick(i, -1)} disabled={i === 0}>▲</button>
                  <button type="button" className="btn" style={{ background: 'var(--purple)', padding: '0.25rem 0.5rem' }} onClick={() => movePick(i, 1)} disabled={i === picks.length - 1}>▼</button>
                  <button type="button" className="btn" style={{ background: '#7f1d1d', padding: '0.25rem 0.5rem' }} onClick={() => edit({ bestChampions: picks.filter((x) => x !== id) })}>✕</button>
                </div>
              )
            })}
            {picks.length === 0 && <span style={{ fontSize: '0.8rem', color: '#666' }}>No champions picked yet.</span>}
          </div>
          <input style={inp} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Add a champion…" />
          {suggestions.length > 0 && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {suggestions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { edit({ bestChampions: [...picks, c.id] }); setSearch('') }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#1a1a1a', border: '1px solid #444', borderRadius: '0.4rem', padding: '0.25rem 0.5rem', color: '#ddd', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  {c.imageHeadshot && <img src={c.imageHeadshot} alt="" style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: 3 }} />}
                  + {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <details style={sec}>
          <summary style={{ ...secTitle, cursor: 'pointer' }}>Boss details (days, rewards, skills)</summary>
          <Field label="Days" hint="e.g. Monday / Tuesday">
            <input style={inp} value={draft.day} onChange={(e) => edit({ day: e.target.value })} />
          </Field>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 700 }}>Rewards</span>
            {draft.currencies.map((cur, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <img src={`/dcdl/resource_icons/${cur.image}`} alt="" style={{ width: '2rem', height: '2rem', objectFit: 'contain', flexShrink: 0 }} />
                <input
                  style={{ ...inp, flex: 1 }}
                  value={cur.name}
                  placeholder="Reward name"
                  onChange={(e) => edit({ currencies: draft.currencies.map((c, j) => (j === i ? { ...c, name: e.target.value } : c)) })}
                />
                <select
                  style={{ ...inp, flex: 1 }}
                  value={cur.image}
                  onChange={(e) => edit({ currencies: draft.currencies.map((c, j) => (j === i ? { ...c, image: e.target.value } : c)) })}
                >
                  {!icons.includes(cur.image) && <option value={cur.image}>{cur.image} (missing)</option>}
                  {icons.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                </select>
                <button type="button" className="btn" style={{ background: '#7f1d1d', flexShrink: 0 }} onClick={() => edit({ currencies: draft.currencies.filter((_, j) => j !== i) })}>✕</button>
              </div>
            ))}
            <button
              type="button"
              className="btn"
              style={{ alignSelf: 'flex-start', background: 'var(--purple)' }}
              onClick={() => edit({ currencies: [...draft.currencies, { name: '', image: icons[0] ?? '' }] })}
            >
              + Add Reward
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 700 }}>Skills (from the game files, read-only)</span>
            {draft.skills.map((s, i) => (
              <div key={i} style={{ fontSize: '0.8rem', color: '#999', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--gold)' }}>{s.name}</strong> {s.description}
              </div>
            ))}
          </div>
        </details>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="submit" className="btn" disabled={loading || !dirty} style={{ fontSize: '1rem', padding: '0.75rem 2rem', opacity: dirty ? 1 : 0.5 }}>
            {loading ? 'Saving…' : `Save ${draft.name}`}
          </button>
          {dirty && (
            <button type="button" className="btn" style={{ background: 'var(--purple)' }} onClick={() => saved && setDraft(structuredClone(saved))} disabled={loading}>
              Revert Changes
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

// ── GF Dungeon Recommendations ─────────────────────────────────────────────────

const GF_DUNGEONS = [
  { slug: 'shrine-of-hercules',     name: 'Shrine of Hercules' },
  { slug: 'guan-yins-lotus-temple', name: "Guan Yin's Lotus Temple" },
  { slug: 'forest-glade-of-kitsune',name: 'Forest Glade of Kitsune' },
  { slug: 'annwn',                  name: 'Annwn' },
  { slug: 'hags-hollow',            name: "Hag's Hollow" },
  { slug: 'fafnirs-lair',           name: "Fafnir's Lair" },
  { slug: 'svarogs-hoard',          name: "Svarog's Hoard" },
  { slug: 'workshop-of-ptah',       name: 'Workshop of Ptah' },
  { slug: 'forge-of-brokkr',        name: 'Forge of Brokkr' },
]

type HeroOption = { id: string; name: string; portrait: string | null; rarity: string | null }
type DungeonRec = { hero_id: string; writeup: string }
type AllDungeonRecs = Record<string, DungeonRec[]>

const RARITY_ORDER = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common']

export function GfDungeonRecsForm() {
  const [slug, setSlug] = useState(GF_DUNGEONS[0].slug)
  const [allRecs, setAllRecs] = useState<AllDungeonRecs>({})
  const [heroes, setHeroes] = useState<HeroOption[]>([])
  const [heroId, setHeroId] = useState('')
  const [writeup, setWriteup] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editWriteup, setEditWriteup] = useState('')
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null)
  const [saving, setSaving] = useState(false)

  const loadRecs = useCallback(async () => {
    const data = await fetch('/api/admin/gf/dungeon-recommendations').then((r) => r.json())
    setAllRecs(data)
  }, [])

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/gf/heroes').then((r) => r.json()),
      fetch('/api/admin/gf/dungeon-recommendations').then((r) => r.json()),
    ]).then(([heroData, recData]) => {
      setHeroes(heroData)
      setAllRecs(recData)
    })
  }, [])

  const currentRecs: DungeonRec[] = allRecs[slug] ?? []
  const heroById = Object.fromEntries(heroes.map((h) => [h.id, h]))

  async function handleAdd() {
    if (!heroId) { setStatus({ msg: 'Select a hero.', ok: false }); return }
    if (!writeup.trim()) { setStatus({ msg: 'Enter a writeup.', ok: false }); return }
    setSaving(true)
    const res = await fetch('/api/admin/gf/dungeon-recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, hero_id: heroId, writeup }),
    })
    const data = await res.json()
    if (res.ok) {
      setStatus({ msg: 'Added!', ok: true })
      setHeroId('')
      setWriteup('')
      await loadRecs()
    } else {
      setStatus({ msg: data.error ?? 'Error', ok: false })
    }
    setSaving(false)
  }

  async function handleSaveEdit(hid: string) {
    if (!editWriteup.trim()) return
    setSaving(true)
    const res = await fetch('/api/admin/gf/dungeon-recommendations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, hero_id: hid, writeup: editWriteup }),
    })
    if (res.ok) {
      setEditingId(null)
      await loadRecs()
    }
    setSaving(false)
  }

  async function handleRemove(hid: string) {
    await fetch('/api/admin/gf/dungeon-recommendations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, hero_id: hid }),
    })
    await loadRecs()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Dungeon selector */}
      <div style={sec}>
        <div style={secTitle}>Select Dungeon</div>
        <Field label="Dungeon" required>
          <select style={inp} value={slug} onChange={(e) => { setSlug(e.target.value); setStatus(null) }}>
            {GF_DUNGEONS.map((d) => (
              <option key={d.slug} value={d.slug}>{d.name}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Current recommendations */}
      <div style={sec}>
        <div style={secTitle}>
          Current Recommendations — {GF_DUNGEONS.find((d) => d.slug === slug)?.name}
        </div>
        {currentRecs.length === 0 ? (
          <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>No recommendations yet for this dungeon.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {currentRecs.map((rec) => {
              const hero = heroById[rec.hero_id]
              const isEditing = editingId === rec.hero_id
              return (
                <div key={rec.hero_id} style={{ background: '#111', borderRadius: '8px', padding: '0.85rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  {hero?.portrait && (
                    <img src={hero.portrait} alt="" style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', objectPosition: 'top', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                      {hero?.name ?? rec.hero_id}
                      {hero?.rarity && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: '#888' }}>({hero.rarity})</span>}
                    </div>
                    {isEditing ? (
                      <>
                        <textarea
                          style={{ ...inp, minHeight: '80px', resize: 'vertical', marginBottom: '0.5rem' }}
                          value={editWriteup}
                          onChange={(e) => setEditWriteup(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button type="button" className="btn" onClick={() => handleSaveEdit(rec.hero_id)} disabled={saving} style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}>Save</button>
                          <button type="button" onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.78rem' }}>Cancel</button>
                        </div>
                      </>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#999', lineHeight: 1.55 }}>{rec.writeup}</p>
                    )}
                  </div>
                  {!isEditing && (
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => { setEditingId(rec.hero_id); setEditWriteup(rec.writeup) }}
                        style={{ background: '#1e3a5f', border: 'none', color: '#93c5fd', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(rec.hero_id)}
                        style={{ background: '#7f1d1d', border: 'none', color: '#fca5a5', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add new */}
      <div style={sec}>
        <div style={secTitle}>Add Recommendation</div>
        <Field label="Hero" required>
          <select style={inp} value={heroId} onChange={(e) => { setHeroId(e.target.value); setStatus(null) }}>
            <option value="">— Select hero —</option>
            {RARITY_ORDER.map((rarity) => {
              const group = heroes.filter((h) => h.rarity === rarity).sort((a, b) => a.name.localeCompare(b.name))
              if (!group.length) return null
              return (
                <optgroup key={rarity} label={rarity}>
                  {group.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </optgroup>
              )
            })}
          </select>
        </Field>
        <Field label="Writeup" required hint="Explain why this champion is recommended for this dungeon.">
          <textarea
            style={{ ...inp, minHeight: '110px', resize: 'vertical' }}
            value={writeup}
            onChange={(e) => { setWriteup(e.target.value); setStatus(null) }}
            placeholder="This champion is effective because..."
          />
        </Field>
        {status && (
          <p style={{ margin: 0, fontSize: '0.85rem', color: status.ok ? '#4ade80' : '#f87171' }}>{status.msg}</p>
        )}
        <button type="button" className="btn" onClick={handleAdd} disabled={saving} style={{ alignSelf: 'flex-start' }}>
          {saving ? 'Saving…' : 'Add Recommendation'}
        </button>
      </div>

    </div>
  )
}
