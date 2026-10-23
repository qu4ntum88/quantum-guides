'use client'

// Champion page sections built from the game-data export (src/dcdl/data/game/champions/<id>.json,
// written by scripts/sync-dcdl-kits.mjs): a stat calculator (level 1–700, stars 0–25, every
// Force talent 0–5 and the base skins the visitor owns, combined the way the game does), Force
// talent costs, and lore chapters with the star each one unlocks at.

import { useEffect, useMemo, useState } from 'react'
import { STAR_TIERS, UNLOCK_COLOR } from '../../lib/star-tiers'
import { useOwnedSkins } from '../../lib/owned-skins'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import {
  accountContributions, addToBuckets, emptyBuckets, emptyGear, gearContribution, loadAccountData, maxedProfile, statChips,
  type AccountData, type Buckets, type GearPiece, type Mode,
} from '../../lib/account-bonuses'
import { useAccountProfile, useAccountSync } from '../../lib/account-profile'
import GearLoadout from '../account/GearLoadout'
import './champion-data.css'

/** kind: flat = added after every multiplier, pct = the (1 + talent% + gear%) bucket,
 *  base = added to the level stat before stars. Stats other than the main four are listed only. */
type Stat = { stat: string; value: number; kind: 'flat' | 'pct' | 'base' }
type TalentUpgrade = { level: number; championLevel: number; acdc: number; dollars: number; effect: string; stats?: Stat[] }
export type ChampionTalent = { name: string; enhanced: boolean; text: string | null; upgrades: TalentUpgrade[] }
export type ChampionStars = { mythicPlus: boolean; steps: { star: number; stats: { stat: string; value: number }[] }[] }

export type ChampionGameDataProps = {
  curves: Record<string, number[]> | null
  firstLevel: number
  maxLevel: number | null
  talents: ChampionTalent[]
  lore: { unlockStar: number; text: string }[]
  stars?: ChampionStars | null
  /** Slot ("Ultimate", "Skill 1", …) → the star each skill level unlocks at (index 0 = Lv 1). */
  skillUnlocks?: Record<string, number[]>
  /** Slot → skill name, for the "reaching this star" notes. */
  skillNames?: Record<string, string>
  /** Base skins with their owned and equipped bonuses; which are owned / equipped is the visitor's pick (owned-skins.ts). */
  baseSkins?: CalcSkin[]
  /** Site champion id: turns on the account bonuses (the visitor's Account Profile, account-profile.ts). */
  championId?: string
}
type SkinStat = { stat: string; value: number }
/** bonuses / equipped: % per calculator stat. equippedOther: labels of equipped bonuses that aren't base stats. */
export type CalcSkin = { id: string; name: string; icon: string | null; bonuses: SkinStat[]; equipped: SkinStat[]; equippedOther: string[] }

const STAT_ORDER = ['HP', 'ATK', 'P. DEF', 'S. DEF']
const JUMPS = [1, 100, 200, 300, 400, 500, 600, 700]
const ACDC_ICON = '/dcdl/resource_icons/AC DC Shards.png'
const DOLLAR_ICON = '/dcdl/resource_icons/Dollars.png'
const fmt = (n: number) => Math.round(n).toLocaleString()
const fmtPct = (n: number) => `${Number(n.toFixed(2))}%`
const statClass = (k: string) => `cgd-stat--${k.replace(/[^a-z]/gi, '').toLowerCase()}`

function starLabel(star: number) {
  if (!star) return { text: 'Unlocked', short: '0★', color: UNLOCK_COLOR }
  const tier = STAR_TIERS[Math.floor((star - 1) / 5)]
  const n = ((star - 1) % 5) + 1
  return { text: `${n}★ ${tier?.name ?? ''}`, short: `${n}★ ${tier?.name ?? ''}`, color: tier?.color ?? UNLOCK_COLOR }
}

function Cost({ acdc, dollars }: { acdc: number; dollars: number }) {
  return (
    <span className="cgd-cost">
      <span><img src={ACDC_ICON} alt="AC/DC Shards" />{fmt(acdc)}</span>
      <span><img src={DOLLAR_ICON} alt="Dollars" />{fmt(dollars)}</span>
    </span>
  )
}

function OffWarning({ count, need, level, onFix }: { count: number; need: number; level: number; onFix: () => void }) {
  return (
    <div className="cgd-off" role="alert">
      <span>
        <strong>{count === 1 ? '1 Force talent is' : `${count} Force talents are`} switched off.</strong>{' '}
        Champion level {level} is below what {count === 1 ? 'it needs' : 'they need'}; move back up to level {need} to get the full Force bonus.
      </span>
      <button type="button" onClick={onFix}>Go to Lv {need}</button>
    </div>
  )
}

type Sums = { pct: Record<string, number>; flat: Record<string, number>; base: Record<string, number>; other: Map<string, { value: number; pct: boolean }> }

/** Adds up the stats of every talent at its chosen level (an upgrade's stats are that level's totals). */
function sumTalents(talents: ChampionTalent[], levels: number[]): Sums {
  const s: Sums = { pct: {}, flat: {}, base: {}, other: new Map() }
  talents.forEach((t, i) => {
    const u = levels[i] ? t.upgrades[levels[i] - 1] : null
    for (const st of u?.stats ?? []) {
      if (STAT_ORDER.includes(st.stat)) s[st.kind][st.stat] = (s[st.kind][st.stat] ?? 0) + st.value
      else {
        const key = `${st.stat}|${st.kind}`
        s.other.set(key, { value: (s.other.get(key)?.value ?? 0) + st.value, pct: st.kind === 'pct' })
      }
    }
  })
  return s
}

/** Cumulative star bonus (in percent) per stat at star `star`. */
function starTotals(stars: ChampionStars | null | undefined, star: number) {
  const out: Record<string, number> = {}
  for (const step of stars?.steps ?? []) if (step.star <= star) for (const s of step.stats) out[s.stat] = (out[s.stat] ?? 0) + s.value
  return out
}

/** Percent per stat from the owned bonuses of `owned` plus the equipped bonus of `equipped`. */
function skinTotals(owned: CalcSkin[], equipped: CalcSkin | null) {
  const out: Record<string, number> = {}
  for (const b of [...owned.flatMap((s) => s.bonuses), ...(equipped?.equipped ?? [])]) out[b.stat] = (out[b.stat] ?? 0) + b.value
  return out
}
const skinLabel = (list: SkinStat[]) => list.map((b) => `${b.stat} +${fmtPct(b.value)}`).join(', ')

/** The game's formula (BUPropertyCalculator): (base + base bonuses) × (1 + star%) × (1 + every %) + flat bonuses.
 *  Base skin owned bonuses and most account bonuses are tech / battle / gear % stats, all in the same % bucket. */
function combine(base: number, star: number, sums: Sums, k: string, skin = 0, acct: Buckets | null = null, gear: Buckets | null = null) {
  const part = (b: Buckets | null) => ({ base: b?.base[k] ?? 0, pct: b?.pct[k] ?? 0, flat: b?.flat[k] ?? 0 })
  const a = part(acct), g = part(gear)
  const fBase = sums.base[k] ?? 0, fPct = sums.pct[k] ?? 0, fFlat = sums.flat[k] ?? 0
  const s = 1 + star / 100
  const B = base + fBase + a.base + g.base, P = fPct + skin + a.pct + g.pct, F = fFlat + a.flat + g.flat
  const total = B * s * (1 + P / 100) + F
  // Each part's share: what the total loses without it (the % bucket is shared, so this is the fair split).
  const without = (x: { base: number; pct: number; flat: number }) => (B - x.base) * s * (1 + (P - x.pct) / 100) + F - x.flat
  const skinGain = total - without({ base: 0, pct: skin, flat: 0 })
  const acctGain = total - without(a)
  const gearGain = total - without(g)
  const starGain = base * (star / 100)
  return { base, starGain, forceGain: total - base - starGain - skinGain - acctGain - gearGain, skinGain, acctGain, gearGain, total }
}

type AcctSource = 'mine' | 'max' | 'off'
const MODE_LABEL: Record<Mode, string> = { normal: 'Any mode', Gve: 'Defeat the Dark Legion', Gvg: 'Guardian Challenge', AllianceBoss: 'Umbral Rift' }

export default function ChampionGameData({ curves, firstLevel, maxLevel, talents, lore, stars, skillUnlocks = {}, skillNames = {}, baseSkins = [], championId }: ChampionGameDataProps) {
  const top = maxLevel ?? 700
  const maxStar = stars?.steps.length ? stars.steps[stars.steps.length - 1].star : 0
  const [level, setLevel] = useState(firstLevel)
  const [star, setStar] = useState(0)
  const [tLevels, setTLevels] = useState<number[]>(() => talents.map(() => 0))
  const [openTalent, setOpenTalent] = useState<number | null>(null)
  const [openLore, setOpenLore] = useState(0)

  const maxCost = useMemo(() => talents.reduce((s, t) => {
    for (const u of t.upgrades) { s.acdc += u.acdc; s.dollars += u.dollars }
    return s
  }, { acdc: 0, dollars: 0 }), [talents])
  const chosenCost = useMemo(() => talents.reduce((s, t, i) => {
    for (const u of t.upgrades.slice(0, tLevels[i])) { s.acdc += u.acdc; s.dollars += u.dollars }
    return s
  }, { acdc: 0, dollars: 0 }), [talents, tLevels])
  // A talent whose chosen level needs a higher champion level stays chosen but adds nothing
  // until the level slider is back up to that requirement.
  const needOf = (t: ChampionTalent, lv: number) => (lv ? t.upgrades[lv - 1]?.championLevel ?? 0 : 0)
  const activeLevels = useMemo(() => talents.map((t, i) => (needOf(t, tLevels[i]) <= level ? tLevels[i] : 0)), [talents, tLevels, level])
  const sums = useMemo(() => sumTalents(talents, activeLevels), [talents, activeLevels])
  const maxSums = useMemo(() => sumTalents(talents, talents.map((t) => t.upgrades.length)), [talents])
  const starPct = useMemo(() => starTotals(stars, star), [stars, star])
  const maxStarPct = useMemo(() => starTotals(stars, maxStar), [stars, maxStar])
  const { owned, equipped, toggle: toggleSkin, setAll: setOwnedSkins, equip } = useOwnedSkins()
  const mySkins = useMemo(() => baseSkins.filter((s) => owned.has(s.id)), [baseSkins, owned])
  const worn = useMemo(() => baseSkins.find((s) => s.id === equipped) ?? null, [baseSkins, equipped])
  const skinPct = useMemo(() => skinTotals(mySkins, worn), [mySkins, worn])
  // Bar scale: every skin owned plus the biggest equipped bonus per stat.
  const maxSkinPct = useMemo(() => {
    const out = skinTotals(baseSkins, null)
    for (const s of baseSkins) for (const b of s.equipped) out[b.stat] = Math.max(out[b.stat] ?? 0, skinTotals(baseSkins, s)[b.stat])
    return out
  }, [baseSkins])

  // Account bonuses: the visitor's profile (or a maxed one), loaded as its own chunk.
  const [acctData, setAcctData] = useState<AccountData | null>(null)
  useEffect(() => {
    if (!championId) return
    let live = true
    loadAccountData().then((d) => { if (live) setAcctData(d) }).catch(() => {})
    return () => { live = false }
  }, [championId])
  const { profile, update: updateProfile, empty: profileEmpty, hydrated } = useAccountProfile()
  useAccountSync()
  // Your own account is for signed-in members (set up in the Members area); anyone can use Maxed.
  const { isSignedIn } = useUser()
  const [acctPick, setAcctPick] = useState<AcctSource | null>(null)
  const pick = acctPick === 'mine' && !isSignedIn ? null : acctPick
  const acctSource: AcctSource = pick ?? (hydrated && isSignedIn && !profileEmpty ? 'mine' : 'off')
  const [mode, setMode] = useState<Mode>('normal')
  const [shipPick, setShipPick] = useState<number | null | undefined>(undefined)
  // Gear belongs to this champion: saved with the profile (this browser, and the member's account).
  const gearPieces = useMemo(() => (championId && profile.champGear[championId]) || emptyGear(), [profile, championId])
  const setGear = (next: GearPiece[]) => { if (championId) updateProfile((p) => ({ ...p, champGear: { ...p.champGear, [championId]: next } })) }
  const gearC = useMemo(() => (acctData && championId ? gearContribution(acctData, championId, gearPieces) : null), [acctData, championId, gearPieces])
  const gearB = useMemo(() => (acctData && gearC ? addToBuckets(acctData, emptyBuckets(), gearC.stats) : null), [acctData, gearC])
  const usedProfile = useMemo(() => (acctData && acctSource === 'max' ? maxedProfile(acctData) : profile), [acctData, acctSource, profile])
  const ownedShips = acctData?.ships.filter((s) => usedProfile.ships[s.id] != null) ?? []
  const ship = shipPick !== undefined ? shipPick : usedProfile.mainShip != null && usedProfile.ships[usedProfile.mainShip] != null ? usedProfile.mainShip : null
  const acctList = useMemo(() => {
    if (!acctData || !championId || acctSource === 'off' || !acctData.champions[championId]) return []
    return accountContributions(acctData, usedProfile, { championId, mode, ship })
  }, [acctData, championId, acctSource, usedProfile, mode, ship])
  const acct = useMemo(() => {
    if (!acctData || !acctList.length) return null
    const b = emptyBuckets()
    for (const c of acctList) addToBuckets(acctData, b, c.stats)
    return b
  }, [acctData, acctList])
  const acctChamp = acctData && championId ? acctData.champions[championId] : null
  // Stats beyond the main four (Crit Rate, Effect RES, PEN…) from gear and the account together.
  const otherStats = useMemo(() => {
    const m = new Map<string, { value: number; pct: boolean }>()
    for (const b of [gearB, acct]) for (const [label, o] of Object.entries(b?.other ?? {})) {
      const t = m.get(label) ?? { value: 0, pct: o.pct }
      t.value += o.value
      m.set(label, t)
    }
    return [...m]
  }, [gearB, acct])

  if (!curves && !talents.length && !lore.length) return null
  const at = (k: string, lv: number) => curves?.[k]?.[lv - firstLevel] ?? 0
  const stats = curves ? STAT_ORDER.filter((k) => curves[k]?.length) : []
  const hasStars = !!stars?.steps.length
  const talentMax = talents.reduce((n, t) => n + t.upgrades.length, 0)
  const talentNow = tLevels.reduce((n, l) => n + l, 0)
  // Raising talents pulls the level slider up to what they need (never down).
  const applyTalents = (next: number[]) => {
    const need = Math.max(0, ...talents.map((t, i) => (next[i] > tLevels[i] ? needOf(t, next[i]) : 0)))
    if (need > level) setLevel(Math.min(need, top))
    setTLevels(next)
  }
  const setTalent = (i: number, v: number) => applyTalents(tLevels.map((l, j) => (j === i ? v : l)))
  const offTalents = talents.map((t, i) => ({ t, need: needOf(t, tLevels[i]) })).filter((x) => x.need > level)
  const offNeed = Math.max(0, ...offTalents.map((x) => x.need))
  const forceChips = [
    ...STAT_ORDER.flatMap((k) => [
      sums.flat[k] ? { label: `${k} +${fmt(sums.flat[k])}`, main: true } : null,
      sums.base[k] ? { label: `Base ${k} +${fmt(sums.base[k])}`, main: true } : null,
      sums.pct[k] ? { label: `${k} +${fmtPct(sums.pct[k])}`, main: true } : null,
    ]),
    ...[...sums.other].map(([key, o]) => ({ label: `${key.split('|')[0]} +${o.pct ? fmtPct(o.value) : fmt(o.value)}`, main: false })),
  ].filter((c): c is { label: string; main: boolean } => !!c)

  // What reaching the selected star adds: its stat step, skill levels and lore chapters.
  const step = stars?.steps.find((s) => s.star === star)
  const skillUps = Object.entries(skillUnlocks).flatMap(([slot, list]) => {
    const i = list.indexOf(star)
    return i > 0 ? [`${skillNames[slot] || slot} → Lv ${i + 1}`] : []
  })
  const loreUps = lore.flatMap((ch, i) => (star > 0 && ch.unlockStar === star ? [`Lore chapter ${i + 1}`] : []))
  const tierOf = starLabel(star)

  return (
    <>
      {(stats.length > 0 || talents.length > 0) && (
        <section className="card cgd cgd-calc" aria-labelledby="cgd-stats">
          <div className="cgd-head">
            <h2 id="cgd-stats">{stats.length ? 'Stat Calculator' : 'Force Talents'}</h2>
            {stats.length > 0 && (
              <span className="cgd-actions">
                <button type="button" onClick={() => { setLevel(top); setStar(maxStar); setTLevels(talents.map((t) => t.upgrades.length)) }}>Max all</button>
                <button type="button" onClick={() => { setLevel(firstLevel); setStar(0); setTLevels(talents.map(() => 0)) }}>Reset</button>
              </span>
            )}
          </div>

          {stats.length > 0 && (
            <>
              <p className="cgd-note cgd-note--top">
                Set the level, stars and Force talents on their own; the totals combine all three the way the game does:
                stars multiply the level stat, then Force % bonuses{baseSkins.length > 0 && ' and base skin bonuses'} multiply that, then flat Force bonuses are added.
              </p>
              <div className="cgd-summary">
                <span>Level <strong>{level}</strong></span>
                {hasStars && <span style={{ '--tier': tierOf.color } as React.CSSProperties}>Stars <strong className="cgd-summary__star">{tierOf.short}</strong></span>}
                {talents.length > 0 && <span>Force <strong>{talentNow}</strong> / {talentMax}</span>}
                {baseSkins.length > 0 && <span>Base skins <strong>{mySkins.length}</strong> / {baseSkins.length}{worn && <> · {worn.name} equipped</>}</span>}
                {acctChamp && <span>Account <strong>{acctSource === 'mine' ? 'Yours' : acctSource === 'max' ? 'Maxed' : 'Off'}</strong>{acct && mode !== 'normal' && <> · {MODE_LABEL[mode]}</>}</span>}
              </div>
              {offTalents.length > 0 && <OffWarning count={offTalents.length} need={offNeed} level={level} onFix={() => setLevel(offNeed)} />}
              <div className="cgd-stats">
                {stats.map((k) => {
                  const r = combine(at(k, level), starPct[k] ?? 0, sums, k, skinPct[k] ?? 0, acct, gearB)
                  const max = Math.max(combine(at(k, top), maxStarPct[k] ?? 0, maxSums, k, maxSkinPct[k] ?? 0, acct, gearB).total, r.total) || 1
                  return (
                    <div key={k} className={`cgd-stat ${statClass(k)}`}>
                      <span className="cgd-stat__name">{k}</span>
                      <span className="cgd-stat__value">{fmt(r.total)}</span>
                      <span className="cgd-stat__bar"><span style={{ width: `${Math.max(3, Math.round((r.total / max) * 100))}%` }} /></span>
                      <dl className="cgd-stat__parts">
                        <div><dt>Level {level}</dt><dd>{fmt(r.base)}</dd></div>
                        {hasStars && <div className={r.starGain ? '' : 'is-zero'}><dt>Stars +{fmtPct(starPct[k] ?? 0)}</dt><dd>+{fmt(r.starGain)}</dd></div>}
                        {talents.length > 0 && <div className={Math.round(r.forceGain) ? '' : 'is-zero'}><dt>Force</dt><dd>+{fmt(r.forceGain)}</dd></div>}
                        {(maxSkinPct[k] ?? 0) > 0 && <div className={Math.round(r.skinGain) ? '' : 'is-zero'}><dt>Base skins +{fmtPct(skinPct[k] ?? 0)}</dt><dd>+{fmt(r.skinGain)}</dd></div>}
                        {acctChamp?.armor && <div className={Math.round(r.gearGain) ? '' : 'is-zero'}><dt>Gear</dt><dd>+{fmt(r.gearGain)}</dd></div>}
                        {acctChamp && <div className={Math.round(r.acctGain) ? '' : 'is-zero'}><dt>Account</dt><dd>+{fmt(r.acctGain)}</dd></div>}
                      </dl>
                    </div>
                  )
                })}
              </div>
              {otherStats.length > 0 && (
                <div className="cgd-otherstats">
                  <span className="sg-label">Other stats from gear and your account</span>
                  <div className="cgd-chips">
                    {otherStats.map(([label, o]) => <span key={label} className="cgd-chip">{label} +{o.pct ? fmtPct(o.value) : fmt(o.value)}</span>)}
                  </div>
                </div>
              )}

              <div className="cgd-block">
                <div className="cgd-block__head">
                  <h3>Level</h3>
                  <span className="cgd-level">Level <strong>{level}</strong><span className="cgd-level__max"> / {top}</span></span>
                </div>
                <div className="cgd-slider">
                  <input
                    type="range" min={firstLevel} max={top} value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    aria-label="Champion level" style={{ '--pct': `${((level - firstLevel) / Math.max(1, top - firstLevel)) * 100}%` } as React.CSSProperties}
                  />
                  <div className="cgd-jumps">
                    {JUMPS.filter((j) => j >= firstLevel && j <= top).map((j) => (
                      <button key={j} type="button" className={j === level ? 'is-active' : ''} onClick={() => setLevel(j)}>{j}</button>
                    ))}
                  </div>
                </div>
              </div>

              {hasStars && (
                <div className="cgd-block">
                  <div className="cgd-block__head">
                    <h3>Stars</h3>
                    <span className="cgd-level" style={{ '--tier': tierOf.color } as React.CSSProperties}>
                      <strong className="cgd-starname">{tierOf.text}</strong>
                    </span>
                  </div>
                  <div className="cgd-slider cgd-slider--star" style={{ '--tier': tierOf.color } as React.CSSProperties}>
                    <input
                      type="range" min={0} max={maxStar} value={star}
                      onChange={(e) => setStar(Number(e.target.value))}
                      aria-label="Champion stars" aria-valuetext={tierOf.text}
                      style={{ '--pct': `${(star / Math.max(1, maxStar)) * 100}%` } as React.CSSProperties}
                    />
                    <div className="cgd-startrack" aria-hidden="true">
                      <button type="button" tabIndex={-1} className={'cgd-startrack__zero' + (star === 0 ? ' is-on' : '')} onClick={() => setStar(0)}>0</button>
                      {STAR_TIERS.map((t, ti) => (
                        <span key={t.name} className="cgd-startrack__tier" style={{ '--c': t.color } as React.CSSProperties}>
                          {[1, 2, 3, 4, 5].map((n) => {
                            const s = ti * 5 + n
                            if (s > maxStar) return null
                            return <button key={s} type="button" tabIndex={-1} title={`${n}★ ${t.name}`} className={s <= star ? 'is-on' : ''} onClick={() => setStar(s)}>★</button>
                          })}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="cgd-starinfo">
                    <div>
                      <span className="sg-label">Reaching {tierOf.text}</span>
                      {star === 0 ? (
                        <p className="cgd-starinfo__none">No star bonus yet. Each star from here adds to HP, ATK and both DEFs.</p>
                      ) : (
                        <div className="cgd-chips">
                          {step?.stats.map((s) => <span key={s.stat} className={`cgd-chip ${statClass(s.stat)}`}>{s.stat} +{fmtPct(s.value)}</span>)}
                          {skillUps.map((x) => <span key={x} className="cgd-chip cgd-chip--skill">{x}</span>)}
                          {loreUps.map((x) => <span key={x} className="cgd-chip cgd-chip--lore">{x}</span>)}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="sg-label">Total from stars</span>
                      <div className="cgd-chips">
                        {STAT_ORDER.map((k) => <span key={k} className={`cgd-chip ${statClass(k)}`}>{k} +{fmtPct(starPct[k] ?? 0)}</span>)}
                      </div>
                    </div>
                  </div>
                  {stars?.mythicPlus && (
                    <p className="cgd-note">Mythic+ champions use the game&apos;s stronger star table: HP and ATK rise faster from Purple on.</p>
                  )}
                  <details className="cgd-everystar">
                    <summary>What every star adds</summary>
                    <div className="cgd-table-wrap">
                      <table className="cgd-table">
                        <thead><tr><th>Star</th>{STAT_ORDER.map((k) => <th key={k}>{k}</th>)}<th>Also unlocks</th></tr></thead>
                        <tbody>
                          {stars!.steps.map((s) => {
                            const lbl = starLabel(s.star)
                            const cum = starTotals(stars, s.star)
                            const ups = [
                              ...Object.entries(skillUnlocks).flatMap(([slot, list]) => { const i = list.indexOf(s.star); return i > 0 ? [`${skillNames[slot] || slot} Lv ${i + 1}`] : [] }),
                              ...lore.flatMap((ch, i) => (ch.unlockStar === s.star ? [`Lore ${i + 1}`] : [])),
                            ]
                            return (
                              <tr key={s.star} className={s.star === star ? 'is-current' : ''} onClick={() => setStar(s.star)}>
                                <td><span className="cgd-starcell" style={{ '--tier': lbl.color } as React.CSSProperties}>{lbl.text}</span></td>
                                {STAT_ORDER.map((k) => {
                                  const v = s.stats.find((x) => x.stat === k)?.value ?? 0
                                  return <td key={k}>+{fmtPct(v)} <span className="cgd-cum">({fmtPct(cum[k] ?? 0)})</span></td>
                                })}
                                <td>{ups.join(', ') || '—'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="cgd-note">Each row is what that star adds; the total so far is in brackets. Tap a row to set the slider.</p>
                  </details>
                </div>
              )}
              {baseSkins.length > 0 && (
                <div className="cgd-block">
                  <div className="cgd-block__head">
                    <h3>Base Skins</h3>
                    <span className="cgd-actions">
                      <button type="button" onClick={() => setOwnedSkins(baseSkins.map((s) => s.id))}>I own them all</button>
                      <button type="button" onClick={() => setOwnedSkins([])}>None</button>
                    </span>
                  </div>
                  <p className="cgd-note cgd-note--top">Tap each base skin you own: its owned bonus applies to every champion. Then pick the one your base has equipped to add its equipped bonus. Your picks are saved in this browser and shared with the <a href="/games/dc-dark-legion/base-skins">Base Skins</a> page.</p>
                  <div className="cgd-skins">
                    {baseSkins.map((s) => {
                      const on = owned.has(s.id)
                      const what = skinLabel(s.bonuses)
                      return (
                        <button
                          key={s.id} type="button" className={'cgd-skin' + (s.id === equipped ? ' is-equipped' : '')} aria-pressed={on}
                          title={`${s.name}: ${what}`} aria-label={`${s.name} (${what})`}
                          onClick={() => toggleSkin(s.id)}
                        >
                          {s.id === equipped && <span className="cgd-skin__eq">Equipped</span>}
                          {s.icon ? <img src={s.icon} alt="" /> : <span className="cgd-skin__name">{s.name}</span>}
                          <span className="cgd-skin__bonus">{what}</span>
                        </button>
                      )
                    })}
                  </div>
                  <label className="cgd-equip">
                    <span className="sg-label">Equipped skin</span>
                    <select value={equipped ?? ''} onChange={(e) => equip(e.target.value || null)}>
                      <option value="">None</option>
                      {baseSkins.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}: {[...s.equipped.map((b) => `+${fmtPct(b.value)} ${b.stat}`), ...s.equippedOther].join(', ')}
                        </option>
                      ))}
                    </select>
                  </label>
                  {worn && worn.equippedOther.length > 0 && (
                    <p className="cgd-note cgd-note--top">
                      While equipped, {worn.name} also gives {worn.equippedOther.join(' and ')}. That isn&apos;t one of the four stats above, so it isn&apos;t in the totals.
                    </p>
                  )}
                  <div className="cgd-chips cgd-skins__total">
                    {STAT_ORDER.some((k) => skinPct[k])
                      ? STAT_ORDER.filter((k) => skinPct[k]).map((k) => <span key={k} className={`cgd-chip ${statClass(k)}`}>{k} +{fmtPct(skinPct[k])}</span>)
                      : <span className="cgd-starinfo__none">No base skins picked. Tap the ones you own.</span>}
                  </div>
                </div>
              )}
              {acctChamp?.armor && acctData && championId && (
                <div className="cgd-block">
                  <div className="cgd-block__head">
                    <h3>Gear</h3>
                    {gearC && <span className="cgd-chips">{statChips(acctData, gearC.stats).filter((x) => /^(HP|ATK|P\. DEF|S\. DEF) \+/.test(x)).map((x) => <span key={x} className="cgd-chip cgd-chip--main">{x}</span>)}</span>}
                  </div>
                  <p className="cgd-note cgd-note--top">
                    This champion&apos;s five pieces. Tap a slot to set its quality, level and faction tag. Stats depend on the armor weight, slot and level only;
                    a faction tag matching this champion adds 20% to that piece from Orange up. Transmutes aren&apos;t included.
                    {!isSignedIn && ' Saved in this browser.'}
                  </p>
                  <GearLoadout data={acctData} championId={championId} pieces={gearPieces} onChange={setGear} />
                </div>
              )}
              {acctChamp && acctData && (
                <div className="cgd-block cgd-acct">
                  <div className="cgd-block__head">
                    <h3>Your Account</h3>
                    <span className="cgd-actions" role="group" aria-label="Account bonuses">
                      {(isSignedIn ? (['mine', 'max', 'off'] as const) : (['max', 'off'] as const)).map((s) => (
                        <button key={s} type="button" className={acctSource === s ? 'is-active' : ''} aria-pressed={acctSource === s} onClick={() => setAcctPick(s)}>
                          {s === 'mine' ? 'My account' : s === 'max' ? 'Maxed' : 'Off'}
                        </button>
                      ))}
                    </span>
                  </div>
                  {!isSignedIn ? (
                    <div className="cgd-signin">
                      <p><strong>Sign in to add your own game account information.</strong> Members enter their roster, research, hangar, VIP and skins once, and every champion&apos;s Stat Calculator adds those bonuses.</p>
                      <Link className="cgd-signin__btn" href="/sign-in">Sign in</Link>
                      {acctSource === 'max' && <p className="cgd-note">Showing a theoretical maxed account meanwhile: every champion at 5★ Red, all research, a maxed hangar and VIP.</p>}
                    </div>
                  ) : (
                    <p className="cgd-note cgd-note--top">
                      {acctSource === 'off'
                        ? <>Account bonuses are off. </>
                        : acctSource === 'max'
                          ? <>Showing a theoretical maxed account: every champion at 5★ Red, all research, a maxed hangar and VIP. </>
                          : profileEmpty
                            ? <>Your account is empty, so this adds nothing yet. </>
                            : <>Global Skills, research, Apokolips, VIP and room skins from your account. </>}
                      <a href="/members#account">{profileEmpty ? 'Set up your account in the Members area' : 'Edit your account'} →</a>
                    </p>
                  )}
                  {acctSource !== 'off' && (
                    <>
                      <div className="cgd-acct__ctl">
                        <label>
                          <span className="sg-label">Mode</span>
                          <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                            {(Object.keys(MODE_LABEL) as Mode[]).map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}
                          </select>
                        </label>
                        <label>
                          <span className="sg-label">Squad&apos;s vehicle</span>
                          <select value={ship ?? ''} onChange={(e) => setShipPick(e.target.value ? Number(e.target.value) : null)}>
                            <option value="">None</option>
                            {(ownedShips.length ? ownedShips : acctData.ships).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </label>
                      </div>
                      <ul className="cgd-acct__list">
                        {acctList.map((c) => (
                          <li key={c.key}>
                            <span className="cgd-acct__src">{c.source}{c.detail && <em> · {c.detail}</em>}</span>
                            <span className="cgd-chips">{statChips(acctData, c.stats).map((x) => <span key={x} className="cgd-chip">{x}</span>)}</span>
                            {c.note && <span className="cgd-acct__note">In battle, not in the totals: {c.note}</span>}
                          </li>
                        ))}
                        {!acctList.length && <li className="cgd-starinfo__none">Nothing from the account applies here yet.</li>}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {talents.length > 0 && (
            <div className={stats.length ? 'cgd-block' : ''}>
              <div className="cgd-block__head">
                {stats.length > 0 && <h3>Force Talents</h3>}
                <span className="cgd-total">Max every talent: <Cost {...maxCost} /></span>
              </div>
              <div className="cgd-force">
                <div className="cgd-force__row">
                  <span className="sg-label">From Force at these levels</span>
                  <span className="cgd-force__btns">
                    <button type="button" onClick={() => applyTalents(talents.map((t) => t.upgrades.length))}>Max all</button>                    <button type="button" onClick={() => setTLevels(talents.map(() => 0))}>Reset</button>
                  </span>
                </div>
                <div className="cgd-chips">
                  {forceChips.length
                    ? forceChips.map((c) => <span key={c.label} className={'cgd-chip' + (c.main ? ' cgd-chip--main' : '')}>{c.label}</span>)
                    : <span className="cgd-starinfo__none">Every talent is at 0. Slide one up to see what it adds.</span>}
                </div>
                <div className="cgd-force__cost">Cost of these levels: <Cost {...chosenCost} /></div>
                {offTalents.length > 0 && <OffWarning count={offTalents.length} need={offNeed} level={level} onFix={() => setLevel(offNeed)} />}
              </div>
              <div className="cgd-talents">
                {talents.map((t, i) => {
                  const open = openTalent === i
                  const lv = tLevels[i]
                  const cur = lv ? t.upgrades[lv - 1] : null
                  const max = t.upgrades.length
                  const counted = t.upgrades.some((u) => u.stats?.length)
                  const needs = cur && cur.championLevel > level ? cur.championLevel : null // talent switched off
                  const sum = t.upgrades.reduce((s, u) => ({ acdc: s.acdc + u.acdc, dollars: s.dollars + u.dollars }), { acdc: 0, dollars: 0 })
                  return (
                    <article key={t.name + i} className={'cgd-talent' + (t.enhanced ? ' is-enhanced' : '') + (open ? ' is-open' : '') + (lv ? ' is-set' : '') + (needs ? ' is-off' : '')}>
                      <div className="cgd-talent__head">
                        <span className="cgd-talent__n">{i + 1}</span>
                        <span className="cgd-talent__main">
                          <span className="cgd-talent__name">{t.name}</span>
                          <span className="cgd-talent__sub">
                            {cur ? cur.effect : t.enhanced ? 'Multiversal Force Enhancement' : `Max: ${t.upgrades[max - 1]?.effect ?? ''}`}
                            {t.enhanced && !counted && <em className="cgd-talent__flag"> · skill effect, not in the stat totals</em>}
                          </span>
                        </span>
                        <span className="cgd-talent__level">
                          <input
                            type="range" min={0} max={max} value={lv}
                            onChange={(e) => setTalent(i, Number(e.target.value))}
                            aria-label={`${t.name} level`} aria-valuetext={`Level ${lv} of ${max}`}
                            style={{ '--pct': `${(lv / Math.max(1, max)) * 100}%` } as React.CSSProperties}
                          />
                          <span className="cgd-talent__lv">{lv}<span>/{max}</span></span>
                        </span>
                        <button type="button" className="cgd-talent__chev" aria-expanded={open} aria-label={`${open ? 'Hide' : 'Show'} ${t.name} levels and costs`} onClick={() => setOpenTalent(open ? null : i)}><span className="cgd-plus" aria-hidden="true" /></button>
                      </div>
                      {needs && (
                        <div className="cgd-talent__off" role="alert">
                          <strong>Bonus switched off.</strong> Level {lv} of this talent needs champion level {needs} (you&apos;re at {level}).
                          <button type="button" onClick={() => setLevel(needs)}>Go to Lv {needs}</button>
                        </div>
                      )}
                      {open && (
                        <div className="cgd-talent__body">
                          {t.text && <p className="cgd-talent__text">{t.text}</p>}
                          <div className="cgd-talent__total">All five levels: <Cost {...sum} /></div>
                          <div className="cgd-table-wrap">
                            <table className="cgd-table">
                              <thead><tr><th>Lv</th><th>Champion Lv</th><th>Cost</th><th>Effect</th></tr></thead>
                              <tbody>
                                {t.upgrades.map((u) => (
                                  <tr key={u.level} className={u.level === lv ? 'is-current' : ''} onClick={() => setTalent(i, u.level)}>
                                    <td><span className="cgd-pip">{u.level}</span></td>
                                    <td>{u.championLevel}</td>
                                    <td><Cost acdc={u.acdc} dollars={u.dollars} /></td>
                                    <td>{u.effect}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            </div>
          )}

          {stats.length > 0 && (
            <p className="cgd-note">
              {acct || gearB ? 'Before legacy pieces, gear transmutations, Kord chips, team bonuses and in-battle buffs.' : 'Before gear, legacy pieces, Global Skills, team bonuses and in-battle buffs.'}{' '}
              Enhanced talents count only when they are a plain stat boost.
            </p>
          )}
        </section>
      )}

      {lore.length > 0 && (
        <section className="card cgd" aria-labelledby="cgd-lore">
          <h2 id="cgd-lore">Lore</h2>
          <div className="cgd-lore">
            {lore.map((ch, i) => {
              const s = starLabel(ch.unlockStar)
              const open = openLore === i
              return (
                <article key={i} className={'cgd-chapter' + (open ? ' is-open' : '')} style={{ '--ch': s.color } as React.CSSProperties}>
                  <button type="button" className="cgd-chapter__head" aria-expanded={open} onClick={() => setOpenLore(open ? -1 : i)}>
                    <span className="cgd-chapter__n">Chapter {i + 1}</span>
                    <span className="cgd-chapter__star">{s.text}</span>
                    <span className="cgd-chapter__chev" aria-hidden="true">{open ? '−' : '+'}</span>
                  </button>
                  {/* Text stays in the DOM (indexable); collapsed chapters are just visually clamped. */}
                  <p className="cgd-chapter__text">{ch.text}</p>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}
