'use client'

// The Hangar part of the Account Profile, drawn after the game's own screens: the Apokolips dial
// (tier numeral, the number under it, a ring for the ten levels inside that number) and the
// Firepit Afterburner "Enhance" bay (six parts around the ship, the milestone banner underneath).

import { useState } from 'react'
import {
  afterburnerCountFromBanner, afterburnerMilestone, apokolipsLabel, partQuality, seriesAt, statChips,
  type AccountData, type AccountProfile,
} from '@/src/dcdl/lib/account-bonuses'
import { Chips, NumberField, Stepper } from './ui'

type Update = (fn: (p: AccountProfile) => AccountProfile) => void
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
// Tier colours from the game (CastleVehicleHelper.GetApokolipsLevelColor); the last repeats.
const TIER_COLOR = ['#dce2fe', '#00d699', '#529aff', '#ee38ff', '#ffcc00', '#ee425e']
const tierColor = (tier: number) => TIER_COLOR[Math.min(Math.max(tier, 1), TIER_COLOR.length) - 1]

// ---------------- Apokolips ----------------
function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)]
  const [x0, y0] = p(a0), [x1, y1] = p(a1)
  return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`
}

export function ApokolipsPanel({ data, profile, update }: { data: AccountData; profile: AccountProfile; update: Update }) {
  const max = data.apokolips.max
  const lv = profile.apokolips
  const tier = lv > 0 ? Math.min(10, Math.floor(lv / 1000) + 1) : 1
  const num = Math.floor((lv % 1000) / 10)
  const step = lv % 10
  const set = (n: number) => update((p) => ({ ...p, apokolips: Math.max(0, Math.min(max, n)) }))
  const setParts = (t: number, n: number, s: number) => set((t - 1) * 1000 + n * 10 + s)
  const color = tierColor(tier)
  const maxNum = tier === 10 ? Math.floor((max - 9000) / 10) : 99
  // Ten segments over the 270° of an open ring, like the in-game dial.
  const START = 135, SWEEP = 270, GAP = 4
  const seg = SWEEP / 10
  const stats = (l: number) => Object.entries(data.apokolips.flat).map(([k, s]): [string, number] => [k, seriesAt(s, l)])
  const cur = stats(lv)
  const next = stats(Math.min(max, lv + 1))
  const reached = data.apokolips.milestones.filter((m) => m.level <= lv)
  const upcoming = data.apokolips.milestones.find((m) => m.level > lv)
  const label = (k: string) => data.stats[k]?.calc ?? data.stats[k]?.label ?? k

  return (
    <div className="acct-card acct-card--wide apok">
      <div className="acct-section__head">
        <h3>Apokolips</h3>
        <span className="acct-actions">
          <button type="button" onClick={() => set(max)}>Max</button>
          <button type="button" onClick={() => set(0)}>Clear</button>
        </span>
      </div>
      <p className="acct-muted">Match the dial to your Hangar → Apokolips screen: the numeral, the number under it, and the ring (one notch per level; all nine lit means Ascend is ready). Its bonuses apply to every champion.</p>
      <div className="apok__layout">
        <div className="apok__dial" style={{ '--tier': color } as React.CSSProperties}>
          <svg viewBox="0 0 220 220" className="apok__ring">
            {Array.from({ length: 10 }, (_, i) => {
              const a0 = START + i * seg + GAP / 2
              const a1 = START + (i + 1) * seg - GAP / 2
              const lit = i < step
              return (
                <path
                  key={i} d={arc(110, 110, 96, a0, a1)}
                  className={'apok__seg' + (lit ? ' is-lit' : '') + (i === 9 ? ' is-last' : '')}
                  onClick={() => setParts(tier, num, step === i + 1 ? i : Math.min(i + 1, 9))}
                >
                  <title>{`Level ${i + 1} of 10 inside this number`}</title>
                </path>
              )
            })}
          </svg>
          <div className="apok__face">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dcdl/account/ui/icon_vehicle_apokolips.png" alt="" className="apok__atom" />
            <span className="apok__roman">{lv > 0 ? ROMAN[tier - 1] : '—'}</span>
            <span className="apok__num">{lv > 0 ? num : 0}</span>
          </div>
          <button type="button" className="apok__arrow is-left" aria-label="Lower tier" disabled={tier <= 1} onClick={() => setParts(tier - 1, num, step)}>‹</button>
          <button type="button" className="apok__arrow is-right" aria-label="Higher tier" disabled={tier >= 10} onClick={() => setParts(tier + 1, Math.min(num, tier + 1 === 10 ? Math.floor((max - 9000) / 10) : 99), step)}>›</button>
        </div>
        <div className="apok__controls">
          <label><span className="acct-label">Number under the numeral</span><Stepper value={num} min={0} max={maxNum} onChange={(n) => setParts(tier, n, step)} label="Apokolips number" /></label>
          <label><span className="acct-label">Ring notches lit</span><Stepper value={step} min={0} max={9} onChange={(s) => setParts(tier, num, s)} label="Ring notches" /></label>
          <label><span className="acct-label">Or the exact level</span><NumberField value={lv} min={0} max={max} onChange={(n) => set(Math.round(n))} label="Apokolips level" /></label>
          <p className="apok__read">Level <strong>{lv.toLocaleString()}</strong> · {apokolipsLabel(lv)}</p>
        </div>
        <div className="apok__table">
          <p className="acct-label">Bonuses apply to all Champions</p>
          <table>
            <tbody>
              {cur.map(([k, v], i) => (
                <tr key={k}>
                  <th>{label(k)}</th>
                  <td>+{v.toLocaleString()}</td>
                  <td className="apok__next">» +{next[i][1].toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="apok__miles">
        <div><span className="acct-label">{reached.length} of {data.apokolips.milestones.length} milestones reached</span><Chips list={statChips(data, reached.flatMap((m) => m.stats))} empty="None yet" /></div>
        {upcoming && <div><span className="acct-label">Next milestone at {apokolipsLabel(upcoming.level)} ({(upcoming.level - lv).toLocaleString()} levels away)</span><Chips list={statChips(data, upcoming.stats)} /></div>}
      </div>
    </div>
  )
}

// ---------------- Firepit Afterburners ----------------
// Where each part sits around the ship on the in-game Enhance screen.
const PART_POS: Record<string, { x: number; y: number }> = {
  'Fuel System': { x: 24, y: 22 },
  Wings: { x: 76, y: 22 },
  Engine: { x: 13, y: 48 },
  Weapon: { x: 87, y: 48 },
  Thruster: { x: 24, y: 74 },
  Cockpit: { x: 76, y: 74 },
}
const MILESTONE_LABEL: Record<string, string> = { HpHero: 'HP', AtkHero: 'ATK', HpTechRatio: 'HP %', AtkTechRatio: 'ATK %' }

export function AfterburnerPanel({ data, profile, update, shipIcon }: { data: AccountData; profile: AccountProfile; update: Update; shipIcon: string | null }) {
  const ab = data.afterburners
  const [sel, setSel] = useState(1)
  const levels = profile.afterburners.parts
  const total = levels.reduce((a, b) => a + b, 0)
  const setPart = (i: number, v: number) => update((p) => ({ ...p, afterburners: { ...p.afterburners, parts: p.afterburners.parts.map((x, j) => (j === i ? v : x)) } }))
  const setCount = (n: number) => update((p) => ({ ...p, afterburners: { ...p.afterburners, count: Math.max(0, Math.min(ab.maxCount, n)) } }))
  const count = profile.afterburners.count
  const { now, next } = afterburnerMilestone(data, count)
  const banner = next?.stats[0] ?? null
  const fmt = (k: string, raw: number) => (data.stats[k]?.pct ? `${Number((raw / 100).toFixed(2))}%` : raw.toLocaleString())
  const part = ab.parts[sel]
  const partVal = (i: number) => statChips(data, [[ab.parts[i].stat, seriesAt(ab.parts[i].levels, levels[i] ?? 0)]])[0] ?? '—'
  // Editing the banner: values are as the game shows them (percent stats in %). What the visitor
  // typed stays until it resolves to a count.
  const display = (k: string, raw: number) => (data.stats[k]?.pct ? raw / 100 : raw)
  const [draft, setDraft] = useState<{ times: number; stat: string; value: number } | null>(null)
  const shown = draft ?? (banner && next ? { times: next.at - count, stat: banner[0], value: display(banner[0], banner[1]) } : { times: 0, stat: 'AtkHero', value: 0 })
  const tryBanner = (b: { times: number; stat: string; value: number }) => {
    const raw = data.stats[b.stat]?.pct ? Math.round(b.value * 100) : Math.round(b.value)
    const c = afterburnerCountFromBanner(data, b.times, b.stat, raw)
    if (c != null) { setDraft(null); setCount(c) } else setDraft(b)
  }

  return (
    <div className="acct-card acct-card--wide burn">
      <div className="acct-section__head">
        <h3>Firepit Afterburners</h3>
        <span className="acct-actions">
          <button type="button" onClick={() => update((p) => ({ ...p, afterburners: { parts: ab.parts.map(() => ab.maxPartLevel), count: ab.maxCount } }))}>Max</button>
          <button type="button" onClick={() => update((p) => ({ ...p, afterburners: { parts: ab.parts.map(() => 0), count: 0 } }))}>Clear</button>
        </span>
      </div>
      <p className="acct-muted">Copy the six part levels from Hangar → Enhance (progress is shared across all vehicles). Tap a part to edit it. These bonuses count for squads on a vehicle.</p>
      <div className="burn__bay">
        <div className="burn__total" title="Total part levels"><span aria-hidden="true">⚙</span>{total}</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {shipIcon && <img className="burn__ship" src={shipIcon} alt="" />}
        {ab.parts.map((p, i) => {
          const at = PART_POS[p.name] ?? { x: 50, y: 50 }
          const q = partQuality(data, levels[i] ?? 0)
          return (
            <button
              key={p.name} type="button"
              className={'burn__part is-' + q + (sel === i ? ' is-sel' : '')}
              style={{ left: `${at.x}%`, top: `${at.y}%`, backgroundImage: `url(/dcdl/account/ui/img_vehicle_refit_bg_${q}.png)` }}
              aria-pressed={sel === i} aria-label={`${p.name}, level ${levels[i] ?? 0}`}
              onClick={() => setSel(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.icon && <img src={p.icon} alt="" />}
              <span className="burn__lv">{levels[i] ?? 0}</span>
              {sel === i && <span className="burn__name">{p.name}</span>}
            </button>
          )
        })}
      </div>
      {part && (
        <div className="burn__edit">
          <span className="burn__edit-name">{part.name}</span>
          <Stepper value={levels[sel] ?? 0} min={0} max={ab.maxPartLevel} onChange={(v) => setPart(sel, v)} label={`${part.name} level`} />
          <span className="burn__edit-val">{partVal(sel)}</span>
        </div>
      )}
      <div className="burn__banner">
        <span className="acct-label">Copy the banner above the Enhance button</span>
        <div className="burn__banner-row">
          Enhance
          <NumberField className="acct-num acct-num--sm" value={shown.times} min={0} max={ab.maxCount} onChange={(n) => tryBanner({ ...shown, times: Math.round(n) })} label="Times left" />
          more time(s):
          <select value={shown.stat} onChange={(e) => tryBanner({ ...shown, stat: e.target.value })} aria-label="Stat in the banner">
            {Object.keys(ab.milestones).map((k) => <option key={k} value={k}>{MILESTONE_LABEL[k] ?? data.stats[k]?.label ?? k}</option>)}
          </select>
          +
          <NumberField className="acct-num acct-num--sm" value={shown.value} min={0} max={1e7} onChange={(n) => tryBanner({ ...shown, value: n })} label="Value in the banner" />
        </div>
        {draft
          ? <p className="acct-warn">No milestone matches that banner yet; check the stat and number.</p>
          : <p className="acct-muted">Upgrades counted: <strong>{count.toLocaleString()}</strong>{next && <> · next milestone at {next.at.toLocaleString()} ({next.stats.map(([k, v]) => `${MILESTONE_LABEL[k] ?? k} +${fmt(k, v)}`).join(', ')})</>}</p>}
        <div><span className="acct-label">Milestone bonus now</span><Chips list={statChips(data, now.filter(([, v]) => v))} empty="None yet" /></div>
      </div>
    </div>
  )
}
