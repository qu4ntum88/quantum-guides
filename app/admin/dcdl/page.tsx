'use client'

import { useState, useEffect, useCallback } from 'react'
import { TIER_COLORS } from '@/src/dcdl/components/TierBadge'

// ── Constants ──────────────────────────────────────────────────────────────────
const CLASSES = ['Assassin', 'Firepower', 'Guardian', 'Intimidator', 'Magical', 'Supporter', 'Warrior']
const HERO_RARITIES = ['Iconic', 'Mythic +', 'Mythic', 'Legendary', 'Epic']
const TIERS = ['S+', 'S', 'A+', 'A', 'B', 'C', 'D']
const DAMAGE_TYPES = ['Physical', 'Spiritual']
const GAME_MODES = ['PvP', 'Devastator CC', 'Drowned CC', 'Merciless CC', 'Dawnbreaker CC', 'Murder Machine CC', 'Killer Tank CC', 'Red Death CC']
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
// ── Types ──────────────────────────────────────────────────────────────────────
type SkillRow = { name: string; description: string; image: File | null }
type ItemOption = { id: string; name: string }

// ── Helpers ────────────────────────────────────────────────────────────────────
function toId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

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
function ChampionForm({ legacyOptions, onRefreshHeroes }: { legacyOptions: ItemOption[]; onRefreshHeroes: () => void }) {
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
  const [quantumsTake, setQuantumsTake] = useState(''); const [headshotFile, setHeadshotFile] = useState<File | null>(null)
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

  useEffect(() => {
    fetch('/api/admin/dcdl/champions').then((r) => r.json()).then(setHeroes)
  }, [])

  const reset = useCallback(() => {
    setName(''); setId(''); setIdManual(false); setHeroClass(''); setRarity(''); setTier('')
    setDamageType(''); setSynergies([]); setGameModes([]); setSources(''); setTransmute('')
    setLegacyPieces([]); setQuantumsTake(''); setHeadshotFile(null); setFullArtFile(null)
    setUltimateName(''); setUltimateDesc(''); setUltimateImage(null)
    setGlobalSkillName(''); setGlobalSkillDesc(''); setGlobalSkillImage(null)
    setSkills([]); setUpgrades([]); setExistingImages({}); setSelectedId('')
    setIsNew(false); setIsP2W(false); setClearPrevTier(false); setExistingPreviousTier('')
    setAscendsTo(''); setAscendedFrom('')
    setStarBreakpoint(''); setAcDcPriority([])
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
    setLegacyPieces(h.recommendedLegacyPieces ?? []); setQuantumsTake(h.quantumsTake ?? '')
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

    try {
      const res = await fetch('/api/admin/dcdl/champions', { method: mode === 'edit' ? 'PATCH' : 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        setStatus({ type: 'success', message: mode === 'edit' ? `"${name}" updated!` : `"${name}" added! Restart dev server to see the card.` })
        if (mode === 'add') reset()
        fetch('/api/admin/dcdl/champions').then((r) => r.json()).then(setHeroes)
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
            <Field label="Tier" required>
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
          <CheckGroup options={SYNERGIES} selected={synergies} onChange={(v) => toggle(synergies, setSynergies, v)} />
        </div>

        <div style={sec}>
          <div style={secTitle}>Best Game Modes</div>
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
        </div>

        <div style={sec}>
          <div style={secTitle}>Recommended Legacy Pieces</div>
          {legacyOptions.length === 0
            ? <span style={{ color: '#888', fontSize: '0.85rem' }}>Loading...</span>
            : <CheckGroup options={legacyOptions} selected={legacyPieces} onChange={(v) => toggle(legacyPieces, setLegacyPieces, v)} />}
        </div>

        <div style={sec}>
          <div style={secTitle}>{"Quantum's Take"}</div>
          <Field label="Analysis">
            <textarea style={{ ...inp, minHeight: '9rem', resize: 'vertical' }} value={quantumsTake} onChange={(e) => setQuantumsTake(e.target.value)} placeholder="Your analysis of this champion..." />
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
function LegacyForm() {
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
    fetch('/api/admin/dcdl/legacy').then((r) => r.json()).then(setItems)
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
        fetch('/api/admin/dcdl/legacy').then((r) => r.json()).then(setItems)
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
            <Field label="Tier" required>
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

// ── Game Info form ─────────────────────────────────────────────────────────────
function GameInfoForm() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [latestServer, setLatestServer] = useState('')
  const [patchNotes, setPatchNotes] = useState('')
  const [gameCodes, setGameCodes] = useState<string[]>([])
  const [newCode, setNewCode] = useState('')

  useEffect(() => {
    fetch('/api/admin/dcdl/game-info')
      .then((r) => r.json())
      .then((data) => {
        setLatestServer(data.latestServer ?? '')
        setPatchNotes(data.patchNotes ?? '')
        setGameCodes(data.gameCodes ?? [])
      })
  }, [])

  function addCode() {
    const code = newCode.trim()
    if (!code || gameCodes.includes(code)) return
    setGameCodes([...gameCodes, code])
    setNewCode('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch('/api/admin/dcdl/game-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latestServer, patchNotes, gameCodes }),
      })
      if (res.ok) {
        setStatus({ type: 'success', message: 'Game info saved! Commit and deploy to publish.' })
      } else {
        setStatus({ type: 'error', message: 'Something went wrong.' })
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error.' })
    }
    setLoading(false)
  }

  return (
    <div>
      <StatusBanner status={status} />
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        <div style={sec}>
          <div style={secTitle}>Latest Server</div>
          <Field label="Server Name / Number">
            <input style={inp} value={latestServer} onChange={(e) => setLatestServer(e.target.value)} placeholder="e.g. Server 142 — Metropolis" />
          </Field>
        </div>

        <div style={sec}>
          <div style={secTitle}>Latest Patch Notes</div>
          <Field label="Patch Notes" hint="Paste the full patch notes text">
            <textarea
              style={{ ...inp, minHeight: '16rem', resize: 'vertical', fontFamily: 'monospace' }}
              value={patchNotes}
              onChange={(e) => setPatchNotes(e.target.value)}
              placeholder="Paste patch notes here..."
            />
          </Field>
        </div>

        <div style={sec}>
          <div style={secTitle}>Game Codes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {gameCodes.length === 0 && (
              <span style={{ color: '#666', fontSize: '0.85rem' }}>No active codes.</span>
            )}
            {gameCodes.map((code) => (
              <div key={code} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#111', border: '1px solid #333', borderRadius: '0.375rem', padding: '0.5rem 0.75rem' }}>
                <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--gold)' }}>{code}</span>
                <button type="button" onClick={() => setGameCodes(gameCodes.filter((c) => c !== code))}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem' }}>
                  Remove
                </button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input
                style={{ ...inp, flex: 1 }}
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCode() } }}
                placeholder="Enter code and press Add or Enter"
              />
              <button type="button" onClick={addCode}
                style={{ background: 'var(--purple)', border: '1px solid #555', borderRadius: '0.375rem', color: '#fff', cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                Add Code
              </button>
            </div>
          </div>
        </div>

        <button type="submit" className="btn" disabled={loading} style={{ alignSelf: 'flex-start', fontSize: '1rem', padding: '0.75rem 2rem' }}>
          {loading ? 'Saving...' : 'Save Info'}
        </button>
      </form>
    </div>
  )
}

// ── Guides Form ───────────────────────────────────────────────────────────────
type BlockType = 'subheading' | 'paragraph' | 'image' | 'callout' | 'clearfloat'
type CalloutType = 'TIP' | 'NOTE' | 'WARNING' | 'IMPORTANT' | 'F2P'
type Block =
  | { type: 'subheading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'image'; src: string; alt: string; alignment: 'left' | 'right' | 'full' }
  | { type: 'callout'; calloutType: CalloutType; text: string }
  | { type: 'clearfloat' }

const CALLOUT_COLORS: Record<CalloutType, string> = {
  TIP: '#cca453', NOTE: '#60a5fa', WARNING: '#fb923c', IMPORTANT: '#f87171', F2P: '#22c55e',
}

function slugify(title: string) {
  return title.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function GuidesForm() {
  const [title, setTitle] = useState('')
  const [filename, setFilename] = useState('')
  const [author, setAuthor] = useState('')
  const [pubDate, setPubDate] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [coverImageUploading, setCoverImageUploading] = useState(false)
  const [intro, setIntro] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [tags, setTags] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventDates, setEventDates] = useState('')
  const [recommendedFor, setRecommendedFor] = useState('')
  const [keyRewards, setKeyRewards] = useState('')

  function autoFilename(t: string) {
    if (!filename || filename === slugify(title)) setFilename(slugify(t))
  }

  function addBlock(type: BlockType) {
    const newBlock: Block =
      type === 'subheading' ? { type: 'subheading', text: '' }
      : type === 'paragraph' ? { type: 'paragraph', text: '' }
      : type === 'image' ? { type: 'image', src: '', alt: '', alignment: 'full' }
      : type === 'callout' ? { type: 'callout', calloutType: 'TIP', text: '' }
      : { type: 'clearfloat' }
    setBlocks((b) => [...b, newBlock])
  }

  function updateBlock(i: number, patch: Partial<Block>) {
    setBlocks((b) => b.map((block, idx) => idx === i ? { ...block, ...patch } as Block : block))
  }

  function removeBlock(i: number) {
    setBlocks((b) => b.filter((_, idx) => idx !== i))
  }

  function moveBlock(i: number, dir: -1 | 1) {
    setBlocks((b) => {
      const arr = [...b]
      const j = i + dir
      if (j < 0 || j >= arr.length) return arr
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return arr
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !filename) { setMsg('Title and filename are required.'); return }
    setLoading(true); setMsg('')
    const res = await fetch('/api/admin/dcdl/guides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename, title, author, pubDate, description, intro, blocks,
        coverImage: coverImage || undefined,
        tags: tags.trim() || undefined,
        eventType: eventType.trim() || undefined,
        eventDates: eventDates.trim() || undefined,
        recommendedFor: recommendedFor.trim() || undefined,
        keyRewards: keyRewards.trim() || undefined,
      }),
    })
    const data = await res.json()
    setLoading(false)
    setMsg(data.success ? `Saved as ${data.filename}` : (data.error ?? 'Error saving guide'))
  }

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {msg && <div style={{ color: msg.startsWith('Saved') ? '#4ade80' : '#f87171', fontSize: '0.85rem' }}>{msg}</div>}

        <div style={sec}>
          <div style={secTitle}>Guide Info</div>
          <Field label="Title">
            <input style={inp} value={title} onChange={(e) => { setTitle(e.target.value); autoFilename(e.target.value) }} placeholder="e.g. April 2026 Meta Tier List" />
          </Field>
          <Field label="Filename (slug)">
            <input style={inp} value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="e.g. April2026MetaTierList" />
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.3rem' }}>Used in the URL. No spaces. Auto-filled from title.</div>
          </Field>
          <Field label="Author">
            <input style={inp} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. Quantum" />
          </Field>
          <Field label="Publish Date (YYYY/MM/DD)">
            <input style={inp} value={pubDate} onChange={(e) => setPubDate(e.target.value)} placeholder="e.g. 2026/04/20" />
          </Field>
          <Field label="Short Description">
            <input style={inp} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="One sentence shown on the guides listing page" />
          </Field>
          <Field label="Cover Image" hint="Upload an image to display on the hub page guide card">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ background: 'var(--purple)', border: '1px solid #555', borderRadius: '0.375rem', color: '#fff', cursor: 'pointer', padding: '0.45rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                {coverImageUploading ? 'Uploading…' : 'Upload Cover Image'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  disabled={!filename}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file || !filename) return
                    setCoverImageUploading(true)
                    const fd = new FormData()
                    fd.append('file', file)
                    fd.append('folder', `${filename}/cover`)
                    const res = await fetch('/api/admin/dcdl/guides/upload', { method: 'POST', body: fd })
                    const data = await res.json()
                    if (data.url) setCoverImage(data.url)
                    setCoverImageUploading(false)
                  }}
                />
              </label>
              {coverImage && (
                <>
                  <img src={coverImage} alt="" style={{ height: '3rem', borderRadius: '0.25rem', border: '1px solid #333', objectFit: 'cover' }} />
                  <button type="button" onClick={() => setCoverImage('')} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
                </>
              )}
              {!filename && <span style={{ fontSize: '0.72rem', color: '#f87171' }}>Set a filename above before uploading.</span>}
            </div>
          </Field>
          <Field label="Tags" hint="Comma-separated — first tag appears as the category label on the guide page (e.g. Events, Season Pass)">
            <input style={inp} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Events, Teen Titans, Battle Pass" />
          </Field>
        </div>

        <div style={sec}>
          <div style={secTitle}>Event Details <span style={{ fontFamily: 'inherit', fontWeight: 400, fontSize: '0.8rem', color: '#666' }}>(optional — shows an &ldquo;at a glance&rdquo; summary card at the top of the guide)</span></div>
          <Field label="Event Type">
            <input style={inp} value={eventType} onChange={(e) => setEventType(e.target.value)} placeholder="Monthly Event" />
          </Field>
          <Field label="Event Dates">
            <input style={inp} value={eventDates} onChange={(e) => setEventDates(e.target.value)} placeholder="May 24 – June 3, 2026" />
          </Field>
          <Field label="Recommended For">
            <input style={inp} value={recommendedFor} onChange={(e) => setRecommendedFor(e.target.value)} placeholder="All players · F2P · Light spenders" />
          </Field>
          <Field label="Key Rewards" hint="Comma-separated list shown as tags in the summary card">
            <input style={inp} value={keyRewards} onChange={(e) => setKeyRewards(e.target.value)} placeholder="Character Pack, Premium Currency, Gear" />
          </Field>
        </div>

        <div style={sec}>
          <div style={secTitle}>Intro Paragraph (optional)</div>
          <textarea
            style={{ ...inp, minHeight: '6rem', resize: 'vertical' }}
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="Opening paragraph shown before any sections..."
          />
        </div>

        <div style={sec}>
          <div style={secTitle}>Content Blocks</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {blocks.map((block, i) => (
              <div key={i} style={{ background: '#111', border: '1px solid #333', borderRadius: '0.375rem', padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 700,
                    color: block.type === 'callout' ? CALLOUT_COLORS[block.calloutType] : '#888',
                  }}>
                    {block.type === 'clearfloat' ? 'Clear Float'
                      : block.type === 'callout' ? `Callout — ${block.calloutType}`
                      : block.type}
                  </span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
                    <button type="button" onClick={() => moveBlock(i, -1)} style={{ background: 'none', border: '1px solid #444', borderRadius: '4px', color: '#aaa', cursor: 'pointer', fontSize: '0.75rem', padding: '0.1rem 0.4rem' }}>↑</button>
                    <button type="button" onClick={() => moveBlock(i, 1)} style={{ background: 'none', border: '1px solid #444', borderRadius: '4px', color: '#aaa', cursor: 'pointer', fontSize: '0.75rem', padding: '0.1rem 0.4rem' }}>↓</button>
                    <button type="button" onClick={() => removeBlock(i)} style={{ background: 'none', border: '1px solid #f87171', borderRadius: '4px', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem', padding: '0.1rem 0.5rem' }}>✕</button>
                  </div>
                </div>

                {block.type === 'subheading' && (
                  <input style={inp} value={block.text} onChange={(e) => updateBlock(i, { text: e.target.value })} placeholder="Section heading text" />
                )}
                {block.type === 'paragraph' && (
                  <textarea style={{ ...inp, minHeight: '5rem', resize: 'vertical' }} value={block.text} onChange={(e) => updateBlock(i, { text: e.target.value })} placeholder="Paragraph text..." />
                )}
                {block.type === 'image' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input style={{ ...inp, flex: 1 }} value={block.src} onChange={(e) => updateBlock(i, { src: e.target.value })} placeholder="Image URL (auto-filled on upload)" />
                      <label style={{ background: 'var(--purple)', border: '1px solid #555', borderRadius: '0.375rem', color: '#fff', cursor: 'pointer', padding: '0.5rem 0.9rem', fontSize: '0.8rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                        Upload
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file || !filename) return
                          const fd = new FormData()
                          fd.append('file', file)
                          fd.append('folder', filename)
                          const res = await fetch('/api/admin/dcdl/guides/upload', { method: 'POST', body: fd })
                          const data = await res.json()
                          if (data.url) updateBlock(i, { src: data.url })
                        }} />
                      </label>
                    </div>
                    {!filename && <div style={{ fontSize: '0.75rem', color: '#f87171' }}>Set a filename/slug above before uploading images.</div>}
                    {block.src && <img src={block.src} alt="" style={{ maxHeight: '8rem', objectFit: 'contain', borderRadius: '0.375rem', border: '1px solid #333' }} />}
                    <input style={inp} value={block.alt} onChange={(e) => updateBlock(i, { alt: e.target.value })} placeholder="Alt text / caption" />
                    <select style={inp} value={block.alignment} onChange={(e) => updateBlock(i, { alignment: e.target.value as 'left' | 'right' | 'full' })}>
                      <option value="full">Full width</option>
                      <option value="left">Text wraps right (image left)</option>
                      <option value="right">Text wraps left (image right)</option>
                    </select>
                    {(block.alignment === 'left' || block.alignment === 'right') && (
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>Tip: Add a "Clear Float" block after the last paragraph you want wrapping the image.</div>
                    )}
                  </div>
                )}
                {block.type === 'callout' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <select
                      style={{ ...inp, color: CALLOUT_COLORS[block.calloutType], fontWeight: 700 }}
                      value={block.calloutType}
                      onChange={(e) => updateBlock(i, { calloutType: e.target.value as CalloutType })}
                    >
                      <option value="TIP">Tip — short strategy advice</option>
                      <option value="NOTE">Note — context or clarification</option>
                      <option value="WARNING">Warning — watch out for this</option>
                      <option value="IMPORTANT">Important — critical info</option>
                      <option value="F2P">F2P — free-to-play guidance</option>
                    </select>
                    <textarea
                      style={{ ...inp, minHeight: '4.5rem', resize: 'vertical' }}
                      value={block.text}
                      onChange={(e) => updateBlock(i, { text: e.target.value })}
                      placeholder="Callout text... (plain text, no markdown needed)"
                    />
                  </div>
                )}
                {block.type === 'clearfloat' && (
                  <div style={{ fontSize: '0.8rem', color: '#555' }}>Stops text from wrapping around a floated image.</div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            {(['subheading', 'paragraph', 'image', 'callout', 'clearfloat'] as BlockType[]).map((type) => (
              <button key={type} type="button" onClick={() => addBlock(type)}
                style={{ background: '#1a1a2e', border: '1px solid #444', borderRadius: '0.375rem', color: '#ccc', cursor: 'pointer', padding: '0.4rem 0.9rem', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                + {type === 'clearfloat' ? 'Clear Float' : type}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn" disabled={loading} style={{ alignSelf: 'flex-start', fontSize: '1rem', padding: '0.75rem 2rem' }}>
          {loading ? 'Saving...' : 'Save Guide'}
        </button>
      </form>
    </div>
  )
}

// ── Infographics Form ─────────────────────────────────────────────────────────
type InfographicItem = { id: string; title: string; description?: string; credit?: string; image: string | null }

function InfographicsForm() {
  const [items, setItems] = useState<InfographicItem[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [credit, setCredit] = useState('')
  const [imgFile, setImgFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function refreshItems() {
    fetch('/api/admin/dcdl/infographics').then((r) => r.json()).then(setItems)
  }

  useEffect(() => { refreshItems() }, [])

  function reset() {
    setTitle(''); setDescription(''); setCredit(''); setImgFile(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setStatus({ type: 'error', message: 'Title is required.' }); return }
    setLoading(true); setStatus(null)
    const fd = new FormData()
    fd.append('title', title.trim())
    if (description) fd.append('description', description)
    if (credit) fd.append('credit', credit)
    if (imgFile) fd.append('image', imgFile)
    try {
      const res = await fetch('/api/admin/dcdl/infographics', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        setStatus({ type: 'success', message: 'Infographic added!' })
        reset()
        refreshItems()
      } else {
        setStatus({ type: 'error', message: data.error ?? 'Something went wrong.' })
      }
    } catch { setStatus({ type: 'error', message: 'Network error.' }) }
    setLoading(false)
  }

  async function handleDelete(id: string, t: string) {
    if (!confirm(`Delete "${t}"?`)) return
    await fetch('/api/admin/dcdl/infographics', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    refreshItems()
  }

  return (
    <div>
      <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Add infographics and charts that will appear on the{' '}
        <a href="/games/dc-dark-legion/infographics" target="_blank" style={{ color: 'var(--gold)' }}>Infographics page</a>.
        Drop images into <code>public/dcdl/infographics/</code> or upload via this form.
      </p>

      {/* Existing items */}
      {items.length > 0 && (
        <div style={{ ...sec, marginBottom: '1.5rem' }}>
          <div style={secTitle}>Current Infographics ({items.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {items.map((ig) => (
              <div key={ig.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#111', border: '1px solid #333', borderRadius: '0.375rem', padding: '0.6rem 0.75rem' }}>
                {ig.image && (
                  <img src={ig.image} alt="" style={{ width: '3.5rem', height: '2rem', objectFit: 'cover', borderRadius: '0.2rem', flexShrink: 0 }} />
                )}
                {!ig.image && (
                  <div style={{ width: '3.5rem', height: '2rem', background: '#1a1a2e', borderRadius: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>📊</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', color: '#ddd', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ig.title}</div>
                  {ig.credit && <div style={{ fontSize: '0.7rem', color: '#666' }}>by {ig.credit}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(ig.id, ig.title)}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <StatusBanner status={status} />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={sec}>
          <div style={secTitle}>Add Infographic</div>
          <Field label="Title" required>
            <input style={inp} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Shards Needed to Star Up" />
          </Field>
          <Field label="Description">
            <textarea style={{ ...inp, minHeight: '3rem', resize: 'vertical' }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description shown on the card" />
          </Field>
          <Field label="Credit / Author">
            <input style={inp} value={credit} onChange={(e) => setCredit(e.target.value)} placeholder="e.g. Quantum" />
          </Field>
          <Field label="Image" hint="Upload the infographic image (JPG, PNG, WebP)">
            <input type="file" accept="image/*" style={{ ...inp, padding: '0.35rem' }} onChange={(e) => setImgFile(e.target.files?.[0] ?? null)} />
            {imgFile && <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{imgFile.name}</span>}
          </Field>
        </div>
        <button type="submit" className="btn" disabled={loading} style={{ alignSelf: 'flex-start', fontSize: '1rem', padding: '0.75rem 2rem' }}>
          {loading ? 'Adding…' : 'Add Infographic'}
        </button>
      </form>
    </div>
  )
}

// ── Factions Form ─────────────────────────────────────────────────────────────
type FactionItem = { id: string; name: string; image?: string; infographic?: string }

function FactionsForm() {
  const [factions, setFactions] = useState<FactionItem[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [imgFile, setImgFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function refresh() {
    fetch('/api/admin/dcdl/factions').then((r) => r.json()).then(setFactions)
  }
  useEffect(() => { refresh() }, [])

  const selected = factions.find((f) => f.id === selectedId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId) { setStatus({ type: 'error', message: 'Select a faction first.' }); return }
    setLoading(true); setStatus(null)
    const fd = new FormData()
    fd.append('id', selectedId)
    if (imgFile) fd.append('image', imgFile)
    try {
      const res = await fetch('/api/admin/dcdl/factions', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        setStatus({ type: 'success', message: 'Infographic saved!' })
        setImgFile(null)
        refresh()
      } else {
        setStatus({ type: 'error', message: data.error ?? 'Something went wrong.' })
      }
    } catch { setStatus({ type: 'error', message: 'Network error.' }) }
    setLoading(false)
  }

  return (
    <div>
      <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Upload a star priority infographic for each faction. It will appear at the top of that faction&apos;s page.
      </p>
      <StatusBanner status={status} />
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={sec}>
          <div style={secTitle}>Select Faction</div>
          <Field label="Faction" required>
            <select style={inp} value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setImgFile(null); setStatus(null) }}>
              <option value="">Choose a faction...</option>
              {factions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </Field>
          {selected && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {selected.image && <img src={selected.image} alt={selected.name} style={{ height: '2.5rem', objectFit: 'contain' }} />}
              {selected.infographic ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#888' }}>Current infographic:</span>
                  <img src={selected.infographic} alt="infographic" style={{ maxHeight: '6rem', maxWidth: '100%', borderRadius: '0.375rem', border: '1px solid #444' }} />
                </div>
              ) : (
                <span style={{ fontSize: '0.8rem', color: '#666' }}>No infographic set yet.</span>
              )}
            </div>
          )}
        </div>
        <div style={sec}>
          <div style={secTitle}>Upload Infographic</div>
          <Field label="Infographic Image" hint="JPG, PNG, or WebP — replaces the existing one if present">
            <input type="file" accept="image/*" style={{ ...inp, padding: '0.35rem' }} onChange={(e) => setImgFile(e.target.files?.[0] ?? null)} />
            {imgFile && <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{imgFile.name}</span>}
          </Field>
        </div>
        <button type="submit" className="btn" disabled={loading || !selectedId} style={{ alignSelf: 'flex-start', fontSize: '1rem', padding: '0.75rem 2rem' }}>
          {loading ? 'Saving...' : 'Save Infographic'}
        </button>
      </form>
    </div>
  )
}

// ── VH Constants ──────────────────────────────────────────────────────────────
const VH_CLASSES   = ['Attacker', 'Balanced', 'Support', 'Tank']
const VH_HOMELANDS = ['Archlands', 'Crucible', 'Dragana', 'Free Tribes', 'Frostheim', 'Holy Order', 'Moonlight Clan', 'Pandemonium']
const VH_SPECIES   = ['Beastman', 'Construct', 'Creature', 'Dwarf', 'Elf', 'Goblin', 'Human', 'Orc']
const VH_OTHER     = ['Artificer', 'Assassin', 'Blademaster', 'Consumed', 'Healer', 'Homonculus', 'Inquisition', 'Knight', 'Mimic', 'Miner', 'Minstrel', 'Monk', 'Noble', 'Outlaw', 'Priest', 'Sage', 'Seasoned', 'Sentinel', 'Sharpshooter', 'Tainted', 'Carnivale', 'Wanderer']

// ── Hunter Form ────────────────────────────────────────────────────────────────
type HunterSkillState = {
  order: number; name: string; level: string; type: string
  cooldown: number | null; tags: string[]; description: string
  upgrades: string[]; image: string | null; newImage: File | null
}

function HunterForm() {
  const [mode, setMode] = useState<'add' | 'edit'>('add')
  const [selectedId, setSelectedId] = useState('')
  const [hunters, setHunters] = useState<ItemOption[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [name, setName] = useState(''); const [id, setId] = useState(''); const [idManual, setIdManual] = useState(false)
  const [rarity, setRarity] = useState(''); const [hunterClass, setHunterClass] = useState<string[]>([])
  const [homeland, setHomeland] = useState<string[]>([]); const [species, setSpecies] = useState<string[]>([])
  const [other, setOther] = useState<string[]>([])
  const [portraitFile, setPortraitFile] = useState<File | null>(null); const [existingPortrait, setExistingPortrait] = useState('')
  const [fullArtFile, setFullArtFile] = useState<File | null>(null); const [existingFullArt, setExistingFullArt] = useState('')
  const [title, setTitle] = useState('')
  const [power, setPower] = useState('')
  const [statAtk, setStatAtk] = useState(''); const [statDef, setStatDef] = useState('')
  const [statHp, setStatHp] = useState(''); const [statSpd, setStatSpd] = useState('')
  const [bioText, setBioText] = useState('')
  const [skills, setSkills] = useState<HunterSkillState[]>([])

  useEffect(() => {
    fetch('/api/admin/vh/hunters').then((r) => r.json()).then((data) =>
      setHunters(data.map((h: { id: string; name: string }) => ({ id: h.id, name: h.name })))
    )
  }, [])

  const reset = useCallback(() => {
    setName(''); setId(''); setIdManual(false); setRarity(''); setHunterClass([])
    setHomeland([]); setSpecies([]); setOther([]); setPortraitFile(null); setExistingPortrait('')
    setFullArtFile(null); setExistingFullArt(''); setTitle(''); setPower('')
    setStatAtk(''); setStatDef(''); setStatHp(''); setStatSpd(''); setBioText('')
    setSkills([]); setSelectedId('')
  }, [])

  async function loadHunter(hunterId: string) {
    if (!hunterId) { reset(); return }
    const res = await fetch('/api/admin/vh/hunters')
    if (!res.ok) return
    const all = await res.json()
    const h = all.find((x: { id: string }) => x.id === hunterId)
    if (!h) return
    setName(h.name ?? ''); setId(h.id ?? ''); setIdManual(true); setRarity(h.rarity ?? '')
    setHunterClass(h.class ?? []); setHomeland(h.homeland ?? []); setSpecies(h.species ?? [])
    setOther(h.other ?? []); setExistingPortrait(h.portrait ?? ''); setPortraitFile(null)
    setExistingFullArt(h.fullArt ?? ''); setFullArtFile(null)
    setTitle(h.title ?? ''); setPower(h.power != null ? String(h.power) : '')
    setStatAtk(h.stats?.attack != null ? String(h.stats.attack) : '')
    setStatDef(h.stats?.defense != null ? String(h.stats.defense) : '')
    setStatHp(h.stats?.health != null ? String(h.stats.health) : '')
    setStatSpd(h.stats?.speed != null ? String(h.stats.speed) : '')
    setBioText(Array.isArray(h.bio) ? h.bio.join('\n\n') : '')
    setSkills((h.skills ?? []).map((s: HunterSkillState) => ({ ...s, newImage: null })))
  }

  function tog(list: string[], set: (v: string[]) => void, val: string) {
    set(list.includes(val) ? list.filter((x) => x !== val) : [...list, val])
  }

  function updateSkill(order: number, field: keyof HunterSkillState, value: string | File | null) {
    setSkills((prev) => prev.map((s) => s.order === order ? { ...s, [field]: value } : s))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setStatus(null)
    const fd = new FormData()
    fd.append('id', id); fd.append('name', name)
    if (rarity) fd.append('rarity', rarity)
    hunterClass.forEach((c) => fd.append('class', c))
    homeland.forEach((h) => fd.append('homeland', h))
    species.forEach((s) => fd.append('species', s))
    other.forEach((o) => fd.append('other', o))
    if (portraitFile) fd.append('portrait', portraitFile)
    if (fullArtFile) fd.append('fullArt', fullArtFile)
    if (title) fd.append('title', title)
    if (power) fd.append('power', power)
    if (statAtk || statDef || statHp || statSpd) {
      fd.append('stats', JSON.stringify({
        attack: Number(statAtk) || 0, defense: Number(statDef) || 0,
        health: Number(statHp) || 0, speed: Number(statSpd) || 0,
      }))
    }
    if (bioText.trim()) {
      const bioArr = bioText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
      fd.append('bio', JSON.stringify(bioArr))
    }
    if (skills.length > 0) {
      const skillData = skills.map(({ newImage: _, ...s }) => s)
      fd.append('skills', JSON.stringify(skillData))
      for (const s of skills) {
        if (s.newImage) fd.append(`skill_image_${s.order}`, s.newImage)
      }
    }

    try {
      const res = await fetch('/api/admin/vh/hunters', { method: mode === 'edit' ? 'PATCH' : 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        setStatus({ type: 'success', message: mode === 'edit' ? `"${name}" updated!` : `"${name}" added!` })
        if (mode === 'add') reset()
        fetch('/api/admin/vh/hunters').then((r) => r.json()).then((data) =>
          setHunters(data.map((h: { id: string; name: string }) => ({ id: h.id, name: h.name })))
        )
      } else {
        setStatus({ type: 'error', message: data.error ?? 'Something went wrong.' })
      }
    } catch { setStatus({ type: 'error', message: 'Network error.' }) }
    setLoading(false)
  }

  return (
    <div>
      <ModeToggle mode={mode} setMode={setMode} onReset={reset}
        addLabel="Add New Hunter" editLabel="Edit Existing Hunter" />

      {mode === 'edit' && (
        <div style={{ ...sec, marginBottom: '1.5rem' }}>
          <Field label="Select Hunter" required>
            <select style={inp} value={selectedId} onChange={(e) => { setSelectedId(e.target.value); loadHunter(e.target.value) }}>
              <option value="">Choose a hunter...</option>
              {hunters.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </Field>
        </div>
      )}

      <StatusBanner status={status} />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Basic Info */}
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
          <div style={g2}>
            <Field label="Rarity">
              <select style={inp} value={rarity} onChange={(e) => setRarity(e.target.value)}>
                <option value="">Select...</option>
                {['Legendary', 'Epic', 'Rare'].map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Title" hint='e.g. "The Banemantle"'>
              <input style={inp} value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Tags */}
        <div style={sec}>
          <div style={secTitle}>Class</div>
          <CheckGroup options={VH_CLASSES.map((c) => ({ id: c, name: c }))} selected={hunterClass} onChange={(v) => tog(hunterClass, setHunterClass, v)} />
        </div>
        <div style={sec}>
          <div style={secTitle}>Homeland</div>
          <CheckGroup options={VH_HOMELANDS.map((h) => ({ id: h, name: h }))} selected={homeland} onChange={(v) => tog(homeland, setHomeland, v)} />
        </div>
        <div style={sec}>
          <div style={secTitle}>Species</div>
          <CheckGroup options={VH_SPECIES.map((s) => ({ id: s, name: s }))} selected={species} onChange={(v) => tog(species, setSpecies, v)} />
        </div>
        <div style={sec}>
          <div style={secTitle}>Other Tags</div>
          <CheckGroup options={VH_OTHER.map((o) => ({ id: o, name: o }))} selected={other} onChange={(v) => tog(other, setOther, v)} />
        </div>

        {/* Stats */}
        <div style={sec}>
          <div style={secTitle}>Power &amp; Stats</div>
          <Field label="Max Power">
            <input style={inp} type="number" value={power} onChange={(e) => setPower(e.target.value)} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
            <Field label="Attack"><input style={inp} type="number" value={statAtk} onChange={(e) => setStatAtk(e.target.value)} /></Field>
            <Field label="Defense"><input style={inp} type="number" value={statDef} onChange={(e) => setStatDef(e.target.value)} /></Field>
            <Field label="Health"><input style={inp} type="number" value={statHp} onChange={(e) => setStatHp(e.target.value)} /></Field>
            <Field label="Speed"><input style={inp} type="number" value={statSpd} onChange={(e) => setStatSpd(e.target.value)} /></Field>
          </div>
        </div>

        {/* Images */}
        <div style={sec}>
          <div style={secTitle}>Images</div>
          <div style={g2}>
            <Field label="Portrait Image" hint={existingPortrait ? `Current: ${existingPortrait.split('/').pop()}` : undefined}>
              <input type="file" accept="image/*" style={{ ...inp, padding: '0.35rem' }}
                onChange={(e) => setPortraitFile(e.target.files?.[0] ?? null)} />
              {portraitFile && <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{portraitFile.name}</span>}
            </Field>
            <Field label="Full Art Image" hint={existingFullArt ? `Current: ${existingFullArt.split('/').pop()}` : undefined}>
              <input type="file" accept="image/*" style={{ ...inp, padding: '0.35rem' }}
                onChange={(e) => setFullArtFile(e.target.files?.[0] ?? null)} />
              {fullArtFile && <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{fullArtFile.name}</span>}
            </Field>
          </div>
        </div>

        {/* Bio */}
        <div style={sec}>
          <div style={secTitle}>Bio / Lore</div>
          <Field label="Lore Paragraphs" hint="Separate paragraphs with a blank line">
            <textarea style={{ ...inp, minHeight: '10rem', resize: 'vertical' }}
              value={bioText} onChange={(e) => setBioText(e.target.value)} />
          </Field>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div style={sec}>
            <div style={secTitle}>Skills &amp; Traits — Image Upload</div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>
              Upload images for each skill or trait. Descriptions are preserved from existing data.
            </p>
            {skills.map((skill) => (
              <div key={skill.order} style={{ background: '#111', border: '1px solid #333', borderRadius: '0.375rem', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {skill.image && (
                    <img src={skill.image} alt={skill.name} style={{ width: '2rem', height: '2rem', borderRadius: '0.25rem', objectFit: 'cover' }} />
                  )}
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e8e8e8' }}>{skill.name}</span>
                  <span style={{ fontSize: '0.72rem', color: '#777', background: '#1a1a1a', padding: '0.15rem 0.4rem', borderRadius: '0.25rem' }}>{skill.type}</span>
                  {skill.cooldown != null && <span style={{ fontSize: '0.72rem', color: '#666' }}>CD: {skill.cooldown}</span>}
                </div>
                <div style={g2}>
                  <Field label="Skill Image" hint={skill.image ? `Current: ${skill.image.split('/').pop()}` : 'No image yet'}>
                    <input type="file" accept="image/*" style={{ ...inp, padding: '0.35rem' }}
                      onChange={(e) => updateSkill(skill.order, 'newImage', e.target.files?.[0] ?? null)} />
                    {skill.newImage && <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{(skill.newImage as File).name}</span>}
                  </Field>
                  <Field label="Description">
                    <textarea style={{ ...inp, minHeight: '4rem', resize: 'vertical' }}
                      value={skill.description}
                      onChange={(e) => updateSkill(skill.order, 'description', e.target.value)} />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}

        <button type="submit" className="btn" disabled={loading} style={{ alignSelf: 'flex-start', fontSize: '1rem', padding: '0.75rem 2rem' }}>
          {loading ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Hunter'}
        </button>
      </form>
    </div>
  )
}

// ── Status Effect Form ─────────────────────────────────────────────────────────
function StatusEffectForm() {
  const [mode, setMode] = useState<'add' | 'edit'>('add')
  const [selectedId, setSelectedId] = useState('')
  const [effects, setEffects] = useState<ItemOption[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [name, setName] = useState(''); const [id, setId] = useState(''); const [idManual, setIdManual] = useState(false)
  const [description, setDescription] = useState('')
  const [imgFile, setImgFile] = useState<File | null>(null); const [existingImg, setExistingImg] = useState('')

  useEffect(() => {
    fetch('/api/admin/vh/status-effects').then((r) => r.json()).then((data) =>
      setEffects(data.map((e: { id: string; name: string }) => ({ id: e.id, name: e.name })))
    )
  }, [])

  const reset = useCallback(() => {
    setName(''); setId(''); setIdManual(false); setDescription('')
    setImgFile(null); setExistingImg(''); setSelectedId('')
  }, [])

  async function loadEffect(effectId: string) {
    if (!effectId) { reset(); return }
    const res = await fetch('/api/admin/vh/status-effects')
    if (!res.ok) return
    const all = await res.json()
    const e = all.find((x: { id: string }) => x.id === effectId)
    if (!e) return
    setName(e.name ?? ''); setId(e.id ?? ''); setIdManual(true)
    setDescription(e.description ?? ''); setExistingImg(e.image ?? '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setStatus(null)
    const fd = new FormData()
    fd.append('id', id); fd.append('name', name)
    if (description) fd.append('description', description)
    if (imgFile) fd.append('image', imgFile)

    try {
      const res = await fetch('/api/admin/vh/status-effects', { method: mode === 'edit' ? 'PATCH' : 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        setStatus({ type: 'success', message: mode === 'edit' ? `"${name}" updated!` : `"${name}" added!` })
        if (mode === 'add') reset()
        fetch('/api/admin/vh/status-effects').then((r) => r.json()).then((data) =>
          setEffects(data.map((e: { id: string; name: string }) => ({ id: e.id, name: e.name })))
        )
      } else {
        setStatus({ type: 'error', message: data.error ?? 'Something went wrong.' })
      }
    } catch { setStatus({ type: 'error', message: 'Network error.' }) }
    setLoading(false)
  }

  return (
    <div>
      <ModeToggle mode={mode} setMode={setMode} onReset={reset}
        addLabel="Add Status Effect" editLabel="Edit Status Effect" />

      {mode === 'edit' && (
        <div style={{ ...sec, marginBottom: '1.5rem' }}>
          <Field label="Select Status Effect" required>
            <select style={inp} value={selectedId} onChange={(e) => { setSelectedId(e.target.value); loadEffect(e.target.value) }}>
              <option value="">Choose a status effect...</option>
              {effects.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
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
          <Field label="Description" hint="Optional — shown as a tooltip on hover">
            <textarea style={{ ...inp, minHeight: '4rem', resize: 'vertical' }} value={description}
              onChange={(e) => setDescription(e.target.value)} placeholder="What this status effect does..." />
          </Field>
        </div>

        <div style={sec}>
          <div style={secTitle}>Image</div>
          <Field label="Status Effect Image" hint={existingImg ? `Current: ${existingImg.split('/').pop()}` : undefined}>
            <input type="file" accept="image/*" style={{ ...inp, padding: '0.35rem' }}
              onChange={(e) => setImgFile(e.target.files?.[0] ?? null)} />
            {imgFile && <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{imgFile.name}</span>}
          </Field>
        </div>

        <button type="submit" className="btn" disabled={loading} style={{ alignSelf: 'flex-start', fontSize: '1rem', padding: '0.75rem 2rem' }}>
          {loading ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Status Effect'}
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

function BestTeamsForm() {
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

// ── Godforge Hero Form ─────────────────────────────────────────────────────────
const GF_RARITIES    = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common']
const GF_AFFINITIES  = ['Cunning', 'Eternal', 'Strength', 'Wisdom']
const GF_ALLEGIANCES = ['Chaos', 'Order']
const GF_ARCHETYPES  = ['Brawler', 'Defender', 'Disruptor', 'Invoker', 'Slayer']
const GF_FACTIONS    = ['AARU', 'ASGARD', 'AVALON', 'EKUR', 'IZUMO', 'OLYMPUS', 'OMEYOCAN', 'TIAN', 'VYRAJ']

type GfHeroData = { id: string; name: string; portrait: string | null; rarity: string | null; affinity: string | null; allegiance: string | null; archetype: string | null; faction: string | null }

function GfHeroForm() {
  const [mode, setMode] = useState<'add' | 'edit'>('edit')
  const [heroes, setHeroes] = useState<ItemOption[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [name, setName] = useState('')
  const [id, setId] = useState('')
  const [idManual, setIdManual] = useState(false)
  const [rarity, setRarity] = useState('')
  const [affinity, setAffinity] = useState('')
  const [allegiance, setAllegiance] = useState('')
  const [archetype, setArchetype] = useState('')
  const [faction, setFaction] = useState('')
  const [fullArtFile, setFullArtFile] = useState<File | null>(null)
  const [portraitFile, setPortraitFile] = useState<File | null>(null)
  const [existingPortrait, setExistingPortrait] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const refreshHeroes = useCallback(() => {
    fetch('/api/admin/gf/heroes').then((r) => r.json()).then((data: ItemOption[]) =>
      setHeroes(data.sort((a, b) => a.name.localeCompare(b.name)))
    )
  }, [])

  useEffect(() => { refreshHeroes() }, [refreshHeroes])

  const reset = useCallback(() => {
    setSelectedId(''); setName(''); setId(''); setIdManual(false)
    setRarity(''); setAffinity(''); setAllegiance(''); setArchetype(''); setFaction('')
    setFullArtFile(null); setPortraitFile(null); setExistingPortrait(null); setStatus(null)
  }, [])

  async function loadHero(heroId: string) {
    setSelectedId(heroId)
    if (!heroId) { setRarity(''); setAffinity(''); setAllegiance(''); setArchetype(''); setFaction(''); setExistingPortrait(null); return }
    const res = await fetch(`/api/admin/gf/heroes?id=${heroId}`)
    if (!res.ok) return
    const h: GfHeroData = await res.json()
    setRarity(h.rarity ?? '')
    setAffinity(h.affinity ?? '')
    setAllegiance(h.allegiance ?? '')
    setArchetype(h.archetype ?? '')
    setFaction(h.faction ?? '')
    setExistingPortrait(h.portrait ?? null)
    setPortraitFile(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'edit' && !selectedId) return
    if (mode === 'add' && (!name.trim() || !id.trim())) return
    setLoading(true); setStatus(null)
    try {
      const fd = new FormData()
      if (mode === 'add') {
        fd.append('id', id.trim())
        fd.append('name', name.trim())
        if (fullArtFile) fd.append('fullArt', fullArtFile)
      } else {
        fd.append('id', selectedId)
      }
      if (portraitFile) fd.append('portrait', portraitFile)
      fd.append('rarity', rarity)
      fd.append('affinity', affinity)
      fd.append('allegiance', allegiance)
      fd.append('archetype', archetype)
      fd.append('faction', faction)

      const res = await fetch('/api/admin/gf/heroes', {
        method: mode === 'add' ? 'POST' : 'PATCH',
        body: fd,
      })
      const data = await res.json()
      if (res.ok) {
        if (mode === 'add') {
          setStatus({ type: 'success', message: `"${name.trim()}" added!` })
          refreshHeroes()
          reset()
        } else {
          setStatus({ type: 'success', message: `"${heroes.find(h => h.id === selectedId)?.name}" updated!` })
          if (data.hero?.portrait) setExistingPortrait(data.hero.portrait)
          setPortraitFile(null)
        }
      } else {
        setStatus({ type: 'error', message: data.error ?? 'Something went wrong.' })
      }
    } catch { setStatus({ type: 'error', message: 'Network error.' }) }
    setLoading(false)
  }

  return (
    <div>
      <ModeToggle mode={mode} setMode={setMode} onReset={reset} addLabel="Add Hero" editLabel="Edit Hero" />

      {mode === 'edit' && (
        <div style={{ ...sec, marginBottom: '1.5rem' }}>
          <Field label="Select Hero" required>
            <select style={inp} value={selectedId} onChange={(e) => loadHero(e.target.value)}>
              <option value="">Choose a hero...</option>
              {heroes.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </Field>
        </div>
      )}

      <StatusBanner status={status} />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {mode === 'add' && (
          <div style={sec}>
            <div style={secTitle}>Identity</div>
            <div style={g2}>
              <Field label="Name" required>
                <input style={inp} value={name} onChange={(e) => {
                  setName(e.target.value)
                  if (!idManual) setId(toId(e.target.value))
                }} />
              </Field>
              <Field label="ID" required hint="Auto-generated from name. Edit to override.">
                <input style={inp} value={id} onChange={(e) => { setId(e.target.value); setIdManual(true) }} />
              </Field>
            </div>
          </div>
        )}

        <div style={sec}>
          <div style={secTitle}>{mode === 'add' ? 'Images' : 'Portrait'}</div>
          {mode === 'add' && (
            <Field label="Full Art" hint="Main card image (the character splash art PNG)">
              <input type="file" accept="image/*" style={{ ...inp, padding: '0.35rem' }}
                onChange={(e) => setFullArtFile(e.target.files?.[0] ?? null)} />
              {fullArtFile && <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{fullArtFile.name}</span>}
            </Field>
          )}
          <Field label="Portrait" hint={existingPortrait ? `Current: ${existingPortrait.split('/').pop()}` : 'Transparent-bg PNG headshot (optional)'}>
            <input type="file" accept="image/*" style={{ ...inp, padding: '0.35rem' }}
              onChange={(e) => setPortraitFile(e.target.files?.[0] ?? null)} />
            {portraitFile && <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{portraitFile.name}</span>}
          </Field>
        </div>

        <div style={sec}>
          <div style={secTitle}>Attributes</div>
          <div style={g2}>
            <Field label="Rarity">
              <select style={inp} value={rarity} onChange={(e) => setRarity(e.target.value)}>
                <option value="">None</option>
                {GF_RARITIES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Affinity">
              <select style={inp} value={affinity} onChange={(e) => setAffinity(e.target.value)}>
                <option value="">None</option>
                {GF_AFFINITIES.map((a) => <option key={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Allegiance">
              <select style={inp} value={allegiance} onChange={(e) => setAllegiance(e.target.value)}>
                <option value="">None</option>
                {GF_ALLEGIANCES.map((a) => <option key={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Archetype">
              <select style={inp} value={archetype} onChange={(e) => setArchetype(e.target.value)}>
                <option value="">None</option>
                {GF_ARCHETYPES.map((a) => <option key={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Faction">
              <select style={inp} value={faction} onChange={(e) => setFaction(e.target.value)}>
                <option value="">None</option>
                {GF_FACTIONS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <button type="submit" className="btn"
          disabled={loading || (mode === 'edit' ? !selectedId : !name.trim() || !id.trim())}
          style={{ alignSelf: 'flex-start', fontSize: '1rem', padding: '0.75rem 2rem' }}>
          {loading ? 'Saving...' : mode === 'add' ? 'Add Hero' : 'Save Hero'}
        </button>
      </form>
    </div>
  )
}

// ── Tier Ranking form ──────────────────────────────────────────────────────────
type TierRankItem = { id: string; name: string; img: string | null }

function TierRankingForm() {
  const [subTab, setSubTab] = useState<'champions' | 'legacy'>('champions')
  const [champItems, setChampItems] = useState<TierRankItem[]>([])
  const [legItems, setLegItems] = useState<TierRankItem[]>([])
  const [champAssign, setChampAssign] = useState<Record<string, string>>({})
  const [legAssign, setLegAssign] = useState<Record<string, string>>({})
  const [champOriginal, setChampOriginal] = useState<Record<string, string>>({})
  const [legOriginal, setLegOriginal] = useState<Record<string, string>>({})
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverTier, setDragOverTier] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin/dcdl/champions/tiers')
      .then((r) => r.json())
      .then((data: { id: string; name: string; tier: string; imageHeadshot: string | null }[]) => {
        setChampItems(data.map((d) => ({ id: d.id, name: d.name, img: d.imageHeadshot })))
        const a = Object.fromEntries(data.map((d) => [d.id, d.tier]))
        setChampAssign(a); setChampOriginal(a)
      })
  }, [])

  useEffect(() => {
    fetch('/api/admin/dcdl/legacy/tiers')
      .then((r) => r.json())
      .then((data: { id: string; name: string; tier: string; image: string | null }[]) => {
        setLegItems(data.map((d) => ({ id: d.id, name: d.name, img: d.image })))
        const a = Object.fromEntries(data.map((d) => [d.id, d.tier]))
        setLegAssign(a); setLegOriginal(a)
      })
  }, [])

  const items = subTab === 'champions' ? champItems : legItems
  const assign = subTab === 'champions' ? champAssign : legAssign
  const original = subTab === 'champions' ? champOriginal : legOriginal
  const setAssign = subTab === 'champions' ? setChampAssign : setLegAssign
  const setOriginal = subTab === 'champions' ? setChampOriginal : setLegOriginal
  const apiPath = subTab === 'champions' ? '/api/admin/dcdl/champions/tiers' : '/api/admin/dcdl/legacy/tiers'
  const isDirty = items.some((item) => assign[item.id] !== original[item.id])

  const grouped = TIERS.reduce((acc, t) => {
    acc[t] = items.filter((item) => assign[item.id] === t)
    return acc
  }, {} as Record<string, TierRankItem[]>)
  const unranked = items.filter((item) => !assign[item.id])

  function handleDrop(targetTier: string) {
    if (!draggingId) return
    setAssign((prev) => ({ ...prev, [draggingId]: targetTier }))
    setDragOverTier(null)
    setDraggingId(null)
  }

  async function save() {
    setSaving(true); setStatus(null)
    const updates = items
      .filter((item) => assign[item.id] !== original[item.id])
      .map((item) => ({ id: item.id, tier: assign[item.id] ?? '' }))
    try {
      const res = await fetch(apiPath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      if (res.ok) {
        setStatus({ type: 'success', message: `Saved ${updates.length} tier change${updates.length !== 1 ? 's' : ''}.` })
        setOriginal({ ...assign })
      } else {
        setStatus({ type: 'error', message: 'Save failed.' })
      }
    } catch { setStatus({ type: 'error', message: 'Network error.' }) }
    setSaving(false)
  }

  async function resetTracking() {
    setResetting(true); setStatus(null); setConfirmReset(false)
    try {
      const res = await fetch(apiPath, { method: 'DELETE' })
      if (res.ok) {
        setStatus({ type: 'success', message: `Rank tracking arrows cleared for all ${subTab}.` })
      } else {
        setStatus({ type: 'error', message: 'Reset failed.' })
      }
    } catch { setStatus({ type: 'error', message: 'Network error.' }) }
    setResetting(false)
  }

  function Chip({ item }: { item: TierRankItem }) {
    const isDragging = draggingId === item.id
    return (
      <div
        draggable
        onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDraggingId(item.id) }}
        onDragEnd={() => { setDraggingId(null); setDragOverTier(null) }}
        title={item.name}
        style={{
          width: 56, height: 70, background: '#1a1a1a',
          border: isDragging ? '2px solid var(--gold)' : '1px solid #444',
          borderRadius: 4, cursor: 'grab', opacity: isDragging ? 0.35 : 1,
          overflow: 'hidden', flexShrink: 0, position: 'relative', userSelect: 'none',
        }}
      >
        {item.img
          ? <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block', pointerEvents: 'none' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#555' }}>{item.name.slice(0, 3)}</div>
        }
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(0,0,0,0.78)', padding: '2px 3px',
          fontSize: '0.5rem', lineHeight: 1.25, color: '#ddd',
          textAlign: 'center', overflow: 'hidden',
          whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          pointerEvents: 'none',
        }}>{item.name}</div>
      </div>
    )
  }

  function TierRow({ tier, rowItems }: { tier: string; rowItems: TierRankItem[] }) {
    const isOver = dragOverTier === tier
    const color = TIER_COLORS[tier]
    return (
      <div
        style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
          minHeight: '5.25rem',
          border: `1px solid ${isOver ? color : '#2a2a2a'}`,
          borderRadius: '0.375rem',
          background: isOver ? 'rgba(255,255,255,0.04)' : '#111',
          padding: '0.5rem',
          transition: 'border-color 0.1s, background 0.1s',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOverTier(tier) }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverTier(null) }}
        onDrop={() => handleDrop(tier)}
      >
        <div style={{
          width: 42, height: 42, minWidth: 42, borderRadius: '50%',
          background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontFamily: 'Unbounded, sans-serif',
          fontSize: tier.length > 1 ? '0.62rem' : '0.85rem',
          fontWeight: 700, flexShrink: 0, marginTop: 2,
          textShadow: '-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000',
        }}>{tier}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1, alignContent: 'flex-start', minHeight: 42 }}>
          {rowItems.map((item) => <Chip key={item.id} item={item} />)}
          {rowItems.length === 0 && (
            <div style={{ color: '#3a3a3a', fontSize: '0.78rem', alignSelf: 'center', paddingLeft: '0.25rem' }}>Drop here</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(['champions', 'legacy'] as const).map((t) => (
          <button key={t} type="button" onClick={() => { setSubTab(t); setStatus(null) }}
            className="btn" style={{ background: subTab === t ? 'var(--gold)' : 'var(--purple)', color: subTab === t ? '#111' : '#fff' }}>
            {t === 'champions' ? 'Champions' : 'Legacy Pieces'}
          </button>
        ))}
      </div>

      <StatusBanner status={status} />

      <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
        Drag portraits into tier rows. Unranked items sit in the bin at the bottom. Save when done — tier changes are tracked for the move arrow.
      </p>

      {items.length === 0 && (
        <div style={{ color: '#555', fontSize: '0.85rem', padding: '2rem', textAlign: 'center' }}>Loading...</div>
      )}

      {items.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {TIERS.map((tier) => <TierRow key={tier} tier={tier} rowItems={grouped[tier] ?? []} />)}

            {/* Unranked bin */}
            <div
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                minHeight: '5.25rem',
                border: dragOverTier === '' ? '1px solid #888' : '1px dashed #2a2a2a',
                borderRadius: '0.375rem',
                background: dragOverTier === '' ? 'rgba(255,255,255,0.03)' : '#0a0a0a',
                padding: '0.5rem', marginTop: '0.5rem',
                transition: 'border-color 0.1s, background 0.1s',
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOverTier('') }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverTier(null) }}
              onDrop={() => handleDrop('')}
            >
              <div style={{
                width: 42, height: 42, minWidth: 42, borderRadius: '50%',
                background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#555', fontFamily: 'Unbounded, sans-serif', fontSize: '0.85rem',
                fontWeight: 700, flexShrink: 0, marginTop: 2,
              }}>—</div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 4 }}>
                <div style={{ fontSize: '0.72rem', color: '#444' }}>Unranked ({unranked.length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {unranked.map((item) => <Chip key={item.id} item={item} />)}
                  {unranked.length === 0 && (
                    <div style={{ color: '#3a3a3a', fontSize: '0.78rem', alignSelf: 'center' }}>All ranked!</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button className="btn" onClick={save} disabled={saving || !isDirty}
              style={{ fontSize: '1rem', padding: '0.75rem 2rem', opacity: isDirty ? 1 : 0.5 }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {isDirty && <span style={{ color: '#fbbf24', fontSize: '0.82rem' }}>Unsaved changes</span>}
            <button className="btn" type="button" onClick={() => setConfirmReset(true)} disabled={resetting}
              style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem', background: '#7f1d1d', color: '#fca5a5', marginLeft: 'auto' }}>
              {resetting ? 'Resetting...' : 'Reset Rank Tracking from Prior Month'}
            </button>
          </div>

          {confirmReset && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}>
              <div style={{
                background: '#1a1a1a', border: '1px solid #444', borderRadius: '0.75rem',
                padding: '2rem', maxWidth: '420px', width: '90%', textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>⚠️</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>
                  Reset rank tracking for all {subTab === 'champions' ? 'champions' : 'legacy pieces'}?
                </div>
                <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  This will remove all up/down arrows from the tier list. This cannot be undone.
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button className="btn" type="button" onClick={() => setConfirmReset(false)}
                    style={{ background: '#2a2a2a', color: '#ccc', padding: '0.6rem 1.5rem' }}>
                    Cancel
                  </button>
                  <button className="btn" type="button" onClick={resetTracking}
                    style={{ background: '#7f1d1d', color: '#fca5a5', padding: '0.6rem 1.5rem' }}>
                    Yes, Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── GF Tier Ranking form ───────────────────────────────────────────────────────
const GF_TR_TIERS = ['S', 'A', 'B', 'C', 'D (Food)'] as const
const GF_TR_COLS  = ['Brawler', 'Defender', 'Disruptor', 'Invoker', 'Slayer', 'Imprint'] as const
const GF_TR_COLORS: Record<string, string> = {
  S: '#FF415C', A: '#FDCE3B', B: '#CB4CDA', C: '#43B3ED', 'D (Food)': '#39D196',
}
type GfRarityTab = 'Legendary' | 'Epic' | 'Rare'
type GfTierHero = {
  id: string; name: string; rarity: string | null; archetype: string | null
  portrait: string | null; fullArt: string
}
type GfAssign = { tier: string; col: string }

function GfTierRankingForm() {
  const [rarityTab, setRarityTab] = useState<GfRarityTab>('Legendary')
  const [allHeroes, setAllHeroes] = useState<GfTierHero[]>([])
  const [assigns, setAssigns] = useState<Record<string, GfAssign>>({})
  const [original, setOriginal] = useState<Record<string, GfAssign>>({})
  const [dragging, setDragging] = useState<{ id: string; arch: string | null } | null>(null)
  const [dropTarget, setDropTarget] = useState<{ tier: string; col: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin/gf/heroes/tiers')
      .then((r) => r.json())
      .then((data: (GfTierHero & { gfTier: string; gfTierColumn: string })[]) => {
        setAllHeroes(data)
        const a: Record<string, GfAssign> = {}
        data.forEach((h) => { a[h.id] = { tier: h.gfTier, col: h.gfTierColumn } })
        setAssigns(a); setOriginal({ ...a })
      })
  }, [])

  const heroes = allHeroes.filter((h) => h.rarity === rarityTab)
  const isDirty = heroes.some((h) => {
    const a = assigns[h.id]; const o = original[h.id]
    return a?.tier !== o?.tier || a?.col !== o?.col
  })

  function validDrop(col: string) {
    return !!dragging && (col === 'Imprint' || col === dragging.arch)
  }

  function handleDrop(tier: string, col: string) {
    if (!dragging || !validDrop(col)) return
    setAssigns((prev) => ({ ...prev, [dragging.id]: { tier, col } }))
    setDropTarget(null); setDragging(null)
  }

  function handleUnrank() {
    if (!dragging) return
    setAssigns((prev) => ({ ...prev, [dragging.id]: { tier: '', col: '' } }))
    setDropTarget(null); setDragging(null)
  }

  async function save() {
    setSaving(true); setStatus(null)
    const updates = heroes
      .filter((h) => { const a = assigns[h.id]; const o = original[h.id]; return a?.tier !== o?.tier || a?.col !== o?.col })
      .map((h) => ({ id: h.id, gfTier: assigns[h.id]?.tier ?? '', gfTierColumn: assigns[h.id]?.col ?? '' }))
    try {
      const res = await fetch('/api/admin/gf/heroes/tiers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      if (res.ok) {
        setStatus({ type: 'success', message: `Saved ${updates.length} change${updates.length !== 1 ? 's' : ''}.` })
        const next = { ...original }
        heroes.forEach((h) => { next[h.id] = assigns[h.id] })
        setOriginal(next)
      } else {
        setStatus({ type: 'error', message: 'Save failed.' })
      }
    } catch { setStatus({ type: 'error', message: 'Network error.' }) }
    setSaving(false)
  }

  const grouped: Record<string, Record<string, GfTierHero[]>> = {}
  for (const t of GF_TR_TIERS) {
    grouped[t] = {}
    for (const c of GF_TR_COLS) {
      grouped[t][c] = heroes.filter((h) => assigns[h.id]?.tier === t && assigns[h.id]?.col === c)
    }
  }
  const unranked = heroes.filter((h) => !assigns[h.id]?.tier)
  const unrankedGroups: [string, GfTierHero[]][] = (
    [
      ...(['Brawler', 'Defender', 'Disruptor', 'Invoker', 'Slayer'] as const).map((arch): [string, GfTierHero[]] => [arch, unranked.filter((h) => h.archetype === arch)]),
      ['(no archetype)' as string, unranked.filter((h) => !h.archetype)] as [string, GfTierHero[]],
    ] satisfies [string, GfTierHero[]][]
  ).filter(([, items]) => items.length > 0)

  function gfChip(item: GfTierHero, circular = false) {
    const draggingThis = dragging?.id === item.id
    const imgSrc = item.portrait ?? item.fullArt
    return (
      <div
        key={item.id}
        draggable
        onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragging({ id: item.id, arch: item.archetype }) }}
        onDragEnd={() => { setDragging(null); setDropTarget(null) }}
        title={item.name}
        style={{
          width: 52, height: circular ? 52 : 65, flexShrink: 0,
          borderRadius: circular ? '50%' : 4, overflow: 'hidden', cursor: 'grab',
          border: draggingThis ? '2px solid var(--gold)' : (circular ? '2px solid #555' : '1px solid #333'),
          opacity: draggingThis ? 0.35 : 1,
          background: '#1a1a1a', position: 'relative', userSelect: 'none',
        }}
      >
        {imgSrc
          ? <img src={imgSrc} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block', pointerEvents: 'none' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#555' }}>{item.name.slice(0, 3)}</div>
        }
        {!circular && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.8)', padding: '2px', fontSize: '0.48rem', color: '#ddd', textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', pointerEvents: 'none' }}>{item.name}</div>
        )}
      </div>
    )
  }

  const LABEL_W = 44
  const COL_MIN = 118

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(['Legendary', 'Epic', 'Rare'] as GfRarityTab[]).map((r) => (
          <button key={r} type="button" className="btn" onClick={() => { setRarityTab(r); setStatus(null) }}
            style={{ background: rarityTab === r ? 'var(--gold)' : 'var(--purple)', color: rarityTab === r ? '#111' : '#fff' }}>
            {r}
          </button>
        ))}
      </div>

      <StatusBanner status={status} />
      <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
        Drag heroes into their archetype column or Imprint (circular = Imprint). Invalid columns dim while dragging. Drop back in Unranked to clear.
      </p>

      {allHeroes.length === 0 && <div style={{ color: '#555', fontSize: '0.85rem', padding: '2rem 0' }}>Loading...</div>}

      {allHeroes.length > 0 && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: LABEL_W + GF_TR_COLS.length * (COL_MIN + 3) + 16 }}>

              {/* Column headers */}
              <div style={{ display: 'flex', gap: 3 }}>
                <div style={{ width: LABEL_W, flexShrink: 0 }} />
                {GF_TR_COLS.map((col) => (
                  <div key={col} style={{
                    flex: 1, minWidth: COL_MIN, height: 38,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                    background: '#1a1a1a', borderRadius: 4,
                    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em',
                    color: dragging && !validDrop(col) ? '#2a2a2a' : '#bbb',
                    fontFamily: 'Unbounded, sans-serif', transition: 'color 0.1s',
                  }}>
                    {col !== 'Imprint' && (
                      <img src={`/godforge/gf_heroes/archetypes/Archetype_${col}.png`} alt={col}
                        style={{ width: 16, height: 16, objectFit: 'contain', opacity: dragging && !validDrop(col) ? 0.15 : 0.75 }} />
                    )}
                    {col}
                  </div>
                ))}
              </div>

              {/* Tier rows */}
              {GF_TR_TIERS.map((tier) => (
                <div key={tier} style={{ display: 'flex', gap: 3 }}>
                  <div style={{
                    width: LABEL_W, flexShrink: 0, borderRadius: 4, minHeight: 76,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: GF_TR_COLORS[tier], color: 'white',
                    fontFamily: 'Unbounded, sans-serif', fontWeight: 700,
                    textShadow: '-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000',
                    gap: 2,
                  }}>
                    <span style={{ fontSize: '0.82rem' }}>{tier.split(' ')[0]}</span>
                    {tier.includes('(') && <span style={{ fontSize: '0.5rem', opacity: 0.85, letterSpacing: '0.02em' }}>{tier.slice(tier.indexOf('('))}</span>}
                  </div>
                  {GF_TR_COLS.map((col) => {
                    const cellItems = grouped[tier][col] ?? []
                    const isOver = dropTarget?.tier === tier && dropTarget?.col === col
                    const valid = validDrop(col)
                    const dimmed = !!dragging && !valid
                    return (
                      <div key={col} style={{
                        flex: 1, minWidth: COL_MIN, minHeight: 76, padding: 4, borderRadius: 4,
                        background: isOver ? 'rgba(255,255,255,0.06)' : '#111',
                        border: `1px solid ${isOver ? GF_TR_COLORS[tier] : '#2a2a2a'}`,
                        display: 'flex', flexWrap: 'wrap', gap: 3, alignContent: 'flex-start',
                        opacity: dimmed ? 0.2 : 1, transition: 'border-color 0.1s, opacity 0.12s',
                      }}
                        onDragOver={(e) => { if (!valid) return; e.preventDefault(); setDropTarget({ tier, col }) }}
                        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node) && dropTarget?.tier === tier && dropTarget?.col === col) setDropTarget(null) }}
                        onDrop={() => handleDrop(tier, col)}
                      >
                        {cellItems.map((item) => gfChip(item, col === 'Imprint'))}
                        {cellItems.length === 0 && <div style={{ fontSize: '0.62rem', color: '#222', width: '100%', textAlign: 'center', alignSelf: 'center' }}>—</div>}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Unranked bin */}
          <div
            style={{ marginTop: '1rem', background: '#0a0a0a', border: '1px dashed #222', borderRadius: 6, padding: '0.75rem' }}
            onDragOver={(e) => { e.preventDefault(); setDropTarget({ tier: '__unranked__', col: '' }) }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null) }}
            onDrop={handleUnrank}
          >
            <div style={{ fontSize: '0.68rem', color: '#444', marginBottom: '0.5rem', fontFamily: 'Unbounded, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Unranked ({unranked.length})
            </div>
            {unrankedGroups.length === 0 && <div style={{ fontSize: '0.82rem', color: '#2a2a2a' }}>All ranked!</div>}
            {unrankedGroups.map(([arch, items]) => (
              <div key={arch} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <div style={{ fontSize: '0.65rem', color: '#444', minWidth: 72, marginTop: 8, fontStyle: 'italic' }}>{arch}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>{items.map((item) => gfChip(item))}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button className="btn" onClick={save} disabled={saving || !isDirty}
              style={{ fontSize: '1rem', padding: '0.75rem 2rem', opacity: isDirty ? 1 : 0.5 }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {isDirty && <span style={{ color: '#fbbf24', fontSize: '0.82rem' }}>Unsaved changes</span>}
          </div>
        </>
      )}
    </div>
  )
}

// ── Root page ──────────────────────────────────────────────────────────────────
type Game = 'dcdl' | 'vh' | 'gf'
type DcdlTab = 'champions' | 'legacy' | 'tier-ranking' | 'info' | 'guides' | 'best-teams' | 'infographics' | 'factions'
type VhTab = 'hunters' | 'status-effects'
type GfTab = 'heroes' | 'tier-ranking' | 'dungeons'

export default function AdminDCDLPage() {
  const [game, setGame] = useState<Game>('dcdl')
  const [dcdlTab, setDcdlTab] = useState<DcdlTab>('champions')
  const [vhTab, setVhTab] = useState<VhTab>('hunters')
  const [gfTab, setGfTab] = useState<GfTab>('heroes')
  const [legacyOptions, setLegacyOptions] = useState<ItemOption[]>([])

  useEffect(() => {
    fetch('/api/admin/dcdl/legacy').then((r) => r.json()).then(setLegacyOptions)
  }, [])

  const dcdlTabs: { id: DcdlTab; label: string }[] = [
    { id: 'champions', label: 'Champions' },
    { id: 'legacy', label: 'Legacy Pieces' },
    { id: 'tier-ranking', label: 'Tier Ranking' },
    { id: 'info', label: 'Game Info' },
    { id: 'guides', label: 'Guides' },
    { id: 'best-teams', label: 'Best Teams' },
    { id: 'infographics', label: 'Infographics' },
    { id: 'factions', label: 'Factions' },
  ]

  const vhTabs: { id: VhTab; label: string }[] = [
    { id: 'hunters', label: 'Hunters' },
    { id: 'status-effects', label: 'Status Effects' },
  ]

  const gfTabs: { id: GfTab; label: string }[] = [
    { id: 'heroes', label: 'Heroes' },
    { id: 'tier-ranking', label: 'Tier Ranking' },
    { id: 'dungeons', label: 'Dungeon Recs' },
  ]

  const gameTabStyle = (g: Game): React.CSSProperties => ({
    background: game === g ? 'var(--gold)' : 'var(--purple)',
    color: game === g ? '#111' : '#fff',
    border: 'none', borderRadius: '0.375rem', cursor: 'pointer',
    padding: '0.5rem 1.5rem', fontFamily: 'Unbounded, sans-serif',
    fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em',
  })

  const subTabStyle = (active: boolean): React.CSSProperties => ({
    background: 'none', border: 'none', cursor: 'pointer', padding: '0.6rem 1.25rem',
    fontSize: '0.9rem', fontWeight: active ? 700 : 400,
    color: active ? 'var(--gold)' : '#888',
    borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
    marginBottom: '-2px', transition: 'color 0.15s',
    fontFamily: active ? 'Unbounded, sans-serif' : 'inherit',
  })

  return (
    <main>
      <div className="container" style={{ maxWidth: game === 'gf' && gfTab === 'tier-ranking' ? '1160px' : '820px', paddingTop: '2rem', paddingBottom: '4rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Site Admin</h1>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Local dev tool — writes directly to JSON/MDX files and saves images to <code>public/</code>.
        </p>

        {/* Game selector */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <button type="button" style={gameTabStyle('dcdl')} onClick={() => setGame('dcdl')}>DC: Dark Legion</button>
          <button type="button" style={gameTabStyle('vh')} onClick={() => setGame('vh')}>Void Hunters</button>
          <button type="button" style={gameTabStyle('gf')} onClick={() => setGame('gf')}>Godforge</button>
        </div>

        {/* DCDL sub-tabs */}
        {game === 'dcdl' && (
          <>
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', borderBottom: '2px solid #333' }}>
              {dcdlTabs.map(({ id, label }) => (
                <button key={id} type="button" onClick={() => setDcdlTab(id)} style={subTabStyle(dcdlTab === id)}>
                  {label}
                </button>
              ))}
            </div>
            {dcdlTab === 'champions' && <ChampionForm legacyOptions={legacyOptions} onRefreshHeroes={() => fetch('/api/admin/dcdl/legacy').then((r) => r.json()).then(setLegacyOptions)} />}
            {dcdlTab === 'legacy' && <LegacyForm />}
            {dcdlTab === 'tier-ranking' && <TierRankingForm />}
            {dcdlTab === 'info' && <GameInfoForm />}
            {dcdlTab === 'guides' && <GuidesForm />}
            {dcdlTab === 'best-teams' && <BestTeamsForm />}
            {dcdlTab === 'infographics' && <InfographicsForm />}
            {dcdlTab === 'factions' && <FactionsForm />}
          </>
        )}

        {/* VH sub-tabs */}
        {game === 'vh' && (
          <>
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', borderBottom: '2px solid #333' }}>
              {vhTabs.map(({ id, label }) => (
                <button key={id} type="button" onClick={() => setVhTab(id)} style={subTabStyle(vhTab === id)}>
                  {label}
                </button>
              ))}
            </div>
            {vhTab === 'hunters' && <HunterForm />}
            {vhTab === 'status-effects' && <StatusEffectForm />}
          </>
        )}

        {/* Godforge sub-tabs */}
        {game === 'gf' && (
          <>
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', borderBottom: '2px solid #333' }}>
              {gfTabs.map(({ id, label }) => (
                <button key={id} type="button" onClick={() => setGfTab(id)} style={subTabStyle(gfTab === id)}>
                  {label}
                </button>
              ))}
            </div>
            {gfTab === 'heroes' && <GfHeroForm />}
            {gfTab === 'tier-ranking' && <GfTierRankingForm />}
            {gfTab === 'dungeons' && <GfDungeonRecsForm />}
          </>
        )}
      </div>
    </main>
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

function GfDungeonRecsForm() {
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
