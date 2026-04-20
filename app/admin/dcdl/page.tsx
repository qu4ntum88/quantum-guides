'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Constants ──────────────────────────────────────────────────────────────────
const CLASSES = ['Assassin', 'Firepower', 'Guardian', 'Intimidator', 'Magical', 'Supporter', 'Warrior']
const HERO_RARITIES = ['Iconic', 'Mythic +', 'Mythic', 'Legendary', 'Epic']
const TIERS = ['S+', 'S', 'A+', 'A', 'B', 'C', 'D']
const DAMAGE_TYPES = ['Physical', 'Spiritual']
const GAME_MODES = ['Combat Cycles', 'Training Simulator', 'Meta Brawl', '3v3', 'Vehicle Combat', 'Story Mode']
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
  }

  function toggle(list: string[], set: (v: string[]) => void, val: string) {
    set(list.includes(val) ? list.filter((x) => x !== val) : [...list, val])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setStatus(null)
    const fd = new FormData()
    fd.append('name', name); fd.append('id', id); fd.append('class', heroClass)
    fd.append('rarity', rarity); fd.append('tier', tier)
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

  useEffect(() => {
    fetch('/api/admin/dcdl/legacy').then((r) => r.json()).then(setItems)
  }, [])

  const reset = useCallback(() => {
    setName(''); setId(''); setIdManual(false); setRank(''); setTier(''); setRole('')
    setUnique(false); setGearEffects(''); setImgFile(null); setExistingImg('')
    setSkills([]); setExistingSkillImgs({}); setSelectedId('')
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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setStatus(null)
    const fd = new FormData()
    fd.append('id', id); fd.append('name', name); fd.append('rank', rank)
    fd.append('tier', tier); fd.append('role', role); fd.append('unique', String(unique))
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
type BlockType = 'subheading' | 'paragraph' | 'image' | 'clearfloat'
type Block =
  | { type: 'subheading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'image'; src: string; alt: string; alignment: 'left' | 'right' | 'full' }
  | { type: 'clearfloat' }

function slugify(title: string) {
  return title.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function GuidesForm() {
  const [title, setTitle] = useState('')
  const [filename, setFilename] = useState('')
  const [author, setAuthor] = useState('')
  const [pubDate, setPubDate] = useState('')
  const [description, setDescription] = useState('')
  const [intro, setIntro] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  function autoFilename(t: string) {
    if (!filename || filename === slugify(title)) setFilename(slugify(t))
  }

  function addBlock(type: BlockType) {
    const newBlock: Block =
      type === 'subheading' ? { type: 'subheading', text: '' }
      : type === 'paragraph' ? { type: 'paragraph', text: '' }
      : type === 'image' ? { type: 'image', src: '', alt: '', alignment: 'full' }
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
      body: JSON.stringify({ filename, title, author, pubDate, description, intro, blocks }),
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
                  <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    {block.type === 'clearfloat' ? 'Clear Float' : block.type}
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
                {block.type === 'clearfloat' && (
                  <div style={{ fontSize: '0.8rem', color: '#555' }}>Stops text from wrapping around a floated image.</div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            {(['subheading', 'paragraph', 'image', 'clearfloat'] as BlockType[]).map((type) => (
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

// ── VH Constants ──────────────────────────────────────────────────────────────
const VH_CLASSES   = ['Attacker', 'Balanced', 'Support', 'Tank']
const VH_HOMELANDS = ['Archlands', 'Crucible', 'Dragana', 'Free Tribes', 'Frostheim', 'Holy Order', 'Moonlight Clan', 'Pandemonium']
const VH_SPECIES   = ['Beastman', 'Construct', 'Creature', 'Dwarf', 'Elf', 'Goblin', 'Human', 'Orc']
const VH_OTHER     = ['Artificer', 'Assassin', 'Blademaster', 'Consumed', 'Healer', 'Homonculus', 'Inquisition', 'Knight', 'Mimic', 'Miner', 'Minstrel', 'Monk', 'Noble', 'Outlaw', 'Priest', 'Sage', 'Seasoned', 'Sentinel', 'Sharpshooter', 'Tainted', 'Carnivale', 'Wanderer']

// ── Hunter Form ────────────────────────────────────────────────────────────────
function HunterForm() {
  const [mode, setMode] = useState<'add' | 'edit'>('add')
  const [selectedId, setSelectedId] = useState('')
  const [hunters, setHunters] = useState<ItemOption[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [name, setName] = useState(''); const [id, setId] = useState(''); const [idManual, setIdManual] = useState(false)
  const [hunterClass, setHunterClass] = useState(''); const [homeland, setHomeland] = useState('')
  const [species, setSpecies] = useState(''); const [other, setOther] = useState<string[]>([])
  const [portraitFile, setPortraitFile] = useState<File | null>(null); const [existingPortrait, setExistingPortrait] = useState('')

  useEffect(() => {
    fetch('/api/admin/vh/hunters').then((r) => r.json()).then((data) =>
      setHunters(data.map((h: { id: string; name: string }) => ({ id: h.id, name: h.name })))
    )
  }, [])

  const reset = useCallback(() => {
    setName(''); setId(''); setIdManual(false); setHunterClass(''); setHomeland('')
    setSpecies(''); setOther([]); setPortraitFile(null); setExistingPortrait(''); setSelectedId('')
  }, [])

  async function loadHunter(hunterId: string) {
    if (!hunterId) { reset(); return }
    const res = await fetch('/api/admin/vh/hunters')
    if (!res.ok) return
    const all = await res.json()
    const h = all.find((x: { id: string }) => x.id === hunterId)
    if (!h) return
    setName(h.name ?? ''); setId(h.id ?? ''); setIdManual(true)
    setHunterClass(h.class ?? ''); setHomeland(h.homeland ?? ''); setSpecies(h.species ?? '')
    setOther(h.other ?? []); setExistingPortrait(h.portrait ?? '')
  }

  function toggleOther(val: string) {
    setOther((prev) => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setStatus(null)
    const fd = new FormData()
    fd.append('id', id); fd.append('name', name)
    if (hunterClass) fd.append('class', hunterClass)
    if (homeland) fd.append('homeland', homeland)
    if (species) fd.append('species', species)
    other.forEach((o) => fd.append('other', o))
    if (portraitFile) fd.append('portrait', portraitFile)

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
            <Field label="Class">
              <select style={inp} value={hunterClass} onChange={(e) => setHunterClass(e.target.value)}>
                <option value="">Select...</option>
                {VH_CLASSES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Homeland">
              <select style={inp} value={homeland} onChange={(e) => setHomeland(e.target.value)}>
                <option value="">Select...</option>
                {VH_HOMELANDS.map((h) => <option key={h}>{h}</option>)}
              </select>
            </Field>
            <Field label="Species">
              <select style={inp} value={species} onChange={(e) => setSpecies(e.target.value)}>
                <option value="">Select...</option>
                {VH_SPECIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <div style={sec}>
          <div style={secTitle}>Portrait</div>
          <Field label="Portrait Image" hint={existingPortrait ? `Current: ${existingPortrait.split('/').pop()}` : undefined}>
            <input type="file" accept="image/*" style={{ ...inp, padding: '0.35rem' }}
              onChange={(e) => setPortraitFile(e.target.files?.[0] ?? null)} />
            {portraitFile && <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{portraitFile.name}</span>}
          </Field>
        </div>

        <div style={sec}>
          <div style={secTitle}>Other Tags</div>
          <CheckGroup
            options={VH_OTHER.map((o) => ({ id: o, name: o }))}
            selected={other}
            onChange={toggleOther}
          />
        </div>

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

// ── Root page ──────────────────────────────────────────────────────────────────
type Game = 'dcdl' | 'vh'
type DcdlTab = 'champions' | 'legacy' | 'info' | 'guides'
type VhTab = 'hunters' | 'status-effects'

export default function AdminDCDLPage() {
  const [game, setGame] = useState<Game>('dcdl')
  const [dcdlTab, setDcdlTab] = useState<DcdlTab>('champions')
  const [vhTab, setVhTab] = useState<VhTab>('hunters')
  const [legacyOptions, setLegacyOptions] = useState<ItemOption[]>([])

  useEffect(() => {
    fetch('/api/admin/dcdl/legacy').then((r) => r.json()).then(setLegacyOptions)
  }, [])

  const dcdlTabs: { id: DcdlTab; label: string }[] = [
    { id: 'champions', label: 'Champions' },
    { id: 'legacy', label: 'Legacy Pieces' },
    { id: 'info', label: 'Game Info' },
    { id: 'guides', label: 'Guides' },
  ]

  const vhTabs: { id: VhTab; label: string }[] = [
    { id: 'hunters', label: 'Hunters' },
    { id: 'status-effects', label: 'Status Effects' },
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
      <div className="container" style={{ maxWidth: '820px', paddingTop: '2rem', paddingBottom: '4rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Site Admin</h1>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Local dev tool — writes directly to JSON/MDX files and saves images to <code>public/</code>.
        </p>

        {/* Game selector */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button type="button" style={gameTabStyle('dcdl')} onClick={() => setGame('dcdl')}>DC: Dark Legion</button>
          <button type="button" style={gameTabStyle('vh')} onClick={() => setGame('vh')}>Void Hunters</button>
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
            {dcdlTab === 'info' && <GameInfoForm />}
            {dcdlTab === 'guides' && <GuidesForm />}
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
      </div>
    </main>
  )
}
