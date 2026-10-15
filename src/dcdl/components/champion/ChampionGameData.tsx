'use client'

// Champion page sections built from the game-data export (src/dcdl/data/game/champions.json,
// written by scripts/sync-dcdl-kits.mjs): base stats at any level, Force talents with their
// per-level effects and costs, and lore chapters with the star each one unlocks at.

import { useMemo, useState } from 'react'
import { STAR_TIERS, UNLOCK_COLOR } from '../../lib/star-tiers'
import './champion-data.css'

type TalentUpgrade = { level: number; championLevel: number; acdc: number; dollars: number; effect: string }
export type ChampionTalent = { name: string; enhanced: boolean; text: string | null; upgrades: TalentUpgrade[] }

export type ChampionGameDataProps = {
  curves: Record<string, number[]> | null
  firstLevel: number
  maxLevel: number | null
  talents: ChampionTalent[]
  lore: { unlockStar: number; text: string }[]
}

const STAT_ORDER = ['HP', 'ATK', 'P. DEF', 'S. DEF']
const JUMPS = [1, 100, 200, 300, 400, 500, 600, 700]
const ACDC_ICON = '/dcdl/resource_icons/AC DC Shards.png'
const DOLLAR_ICON = '/dcdl/resource_icons/Dollars.png'
const fmt = (n: number) => n.toLocaleString()

function starLabel(star: number) {
  if (!star) return { text: 'Unlocked', color: UNLOCK_COLOR }
  const tier = STAR_TIERS[Math.floor((star - 1) / 5)]
  return { text: `${((star - 1) % 5) + 1}★ ${tier?.name ?? ''}`, color: tier?.color ?? UNLOCK_COLOR }
}

function Cost({ acdc, dollars }: { acdc: number; dollars: number }) {
  return (
    <span className="cgd-cost">
      <span><img src={ACDC_ICON} alt="AC/DC Shards" />{fmt(acdc)}</span>
      <span><img src={DOLLAR_ICON} alt="Dollars" />{fmt(dollars)}</span>
    </span>
  )
}

export default function ChampionGameData({ curves, firstLevel, maxLevel, talents, lore }: ChampionGameDataProps) {
  const top = maxLevel ?? 700
  const [level, setLevel] = useState(top)
  const [openTalent, setOpenTalent] = useState<number | null>(null)
  const [openLore, setOpenLore] = useState(0)

  const totals = useMemo(() => talents.reduce((s, t) => {
    for (const u of t.upgrades) { s.acdc += u.acdc; s.dollars += u.dollars }
    return s
  }, { acdc: 0, dollars: 0 }), [talents])

  if (!curves && !talents.length && !lore.length) return null
  const at = (k: string, lv: number) => curves?.[k]?.[lv - firstLevel]
  const stats = curves ? STAT_ORDER.filter((k) => curves[k]?.length) : []

  return (
    <>
      {stats.length > 0 && (
        <section className="card cgd" aria-labelledby="cgd-stats">
          <div className="cgd-head">
            <h2 id="cgd-stats">Base Stats</h2>
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
          <div className="cgd-stats">
            {stats.map((k) => {
              const v = at(k, level) ?? 0
              const max = at(k, top) || v || 1
              return (
                <div key={k} className={`cgd-stat cgd-stat--${k.replace(/[^a-z]/gi, '').toLowerCase()}`}>
                  <span className="cgd-stat__name">{k}</span>
                  <span className="cgd-stat__value">{fmt(v)}</span>
                  <span className="cgd-stat__bar"><span style={{ width: `${Math.max(3, Math.round((v / max) * 100))}%` }} /></span>
                </div>
              )
            })}
          </div>
          <p className="cgd-note">Base stats before gear, legacy pieces, talents, and team bonuses.</p>
        </section>
      )}

      {talents.length > 0 && (
        <section className="card cgd" aria-labelledby="cgd-talents">
          <div className="cgd-head">
            <h2 id="cgd-talents">Force Talents</h2>
            <span className="cgd-total">Max every talent: <Cost {...totals} /></span>
          </div>
          <p className="cgd-note cgd-note--top">Each talent has five upgrades. Tap one to see what every level gives, the champion level it needs, and what it costs.</p>
          <div className="cgd-talents">
            {talents.map((t, i) => {
              const open = openTalent === i
              const last = t.upgrades[t.upgrades.length - 1]
              const sum = t.upgrades.reduce((s, u) => ({ acdc: s.acdc + u.acdc, dollars: s.dollars + u.dollars }), { acdc: 0, dollars: 0 })
              return (
                <article key={t.name + i} className={'cgd-talent' + (t.enhanced ? ' is-enhanced' : '') + (open ? ' is-open' : '')}>
                  <button type="button" className="cgd-talent__head" aria-expanded={open} onClick={() => setOpenTalent(open ? null : i)}>
                    <span className="cgd-talent__n">{i + 1}</span>
                    <span className="cgd-talent__main">
                      <span className="cgd-talent__name">{t.name}</span>
                      <span className="cgd-talent__sub">
                        {t.enhanced ? 'Multiversal Force Enhancement' : last ? `Max: ${last.effect}` : ''}
                      </span>
                    </span>
                    <span className="cgd-talent__cost"><Cost {...sum} /></span>
                    <span className="cgd-talent__chev" aria-hidden="true">{open ? '−' : '+'}</span>
                  </button>
                  {open && (
                    <div className="cgd-talent__body">
                      {t.text && <p className="cgd-talent__text">{t.text}</p>}
                      <div className="cgd-table-wrap">
                        <table className="cgd-table">
                          <thead><tr><th>Lv</th><th>Champion Lv</th><th>Cost</th><th>Effect</th></tr></thead>
                          <tbody>
                            {t.upgrades.map((u) => (
                              <tr key={u.level}>
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
