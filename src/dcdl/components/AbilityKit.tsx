'use client'

import { useState } from 'react'

export type Ability = { name: string; description: string; image?: string }

type Slot = {
  star: number
  kind: 'ultimate' | 'global' | 'skill'
  label: string
  ability: Ability
  enhancement: Ability | null
}

// In-game rank order. A champion gains one upgrade to each ability at every
// rank from White through Red (abilities are absent at 0 stars / grey).
const RANKS = [
  { name: 'White', color: '#e5e7eb' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Purple', color: '#a855f7' },
  { name: 'Yellow', color: '#f59e0b' },
  { name: 'Red', color: '#ef4444' },
]

// Descriptions embed [bracketed] tokens: keyword/ability references such as
// [Awakened], filled scaling values such as [300/400/500%], and placeholders
// such as [%] where per-star values haven't been entered yet. Each gets its
// own treatment instead of rendering as flat body text.
function renderDescription(text: string) {
  return text.split(/(\[[^\]]*\])/g).map((part, i) => {
    if (!part.startsWith('[') || !part.endsWith(']')) return <span key={i}>{part}</span>

    const inner = part.slice(1, -1).trim()

    // Unfilled placeholders in the source data: [%], [X], [x], [].
    if (inner === '' || inner === '%' || /^[Xx]$/.test(inner) || !/[a-zA-Z0-9]/.test(inner)) {
      return (
        <span key={i} className="ak-tok ak-tok--todo" title="Per-star values not published yet">
          {inner === '' ? '?' : inner}
        </span>
      )
    }
    // Real numbers: single values like 10s or 50%, and per-star scaling like 20/30/40/50/60%.
    if (/\d/.test(inner) && /^[\d.,/\s%sx+×-]+$/.test(inner)) {
      return <span key={i} className="ak-tok ak-tok--value">{inner}</span>
    }
    // Keyword / status / ability references.
    return <span key={i} className="ak-tok ak-tok--key">{inner}</span>
  })
}

function RankPips() {
  return (
    <span className="ak-ranks" aria-label={'Upgrades at ' + RANKS.map((r) => r.name).join(', ')}>
      {RANKS.map((r) => (
        <span key={r.name} className="ak-ranks__pip" style={{ background: r.color }} title={r.name + ' rank'} />
      ))}
    </span>
  )
}

export default function AbilityKit({
  ultimate,
  globalSkill,
  skills,
  upgrades,
}: {
  ultimate: Ability | null
  globalSkill: Ability | null
  skills: Ability[]
  upgrades: Ability[]
}) {
  // Star position within each rank band is fixed by the game: the Ultimate
  // upgrades on the 1st star, Skill 1 on the 2nd, the Global Skill on the 3rd,
  // Skill 2 on the 4th and Skill 3 on the 5th. Multiversal Force Enhancements
  // pair to their parent skill by position (the icon filenames agree: a skill's
  // sub0N maps to sub0N_enhanced), so they nest under the skill they enhance
  // rather than sitting in a separate list.
  const slots: Slot[] = []
  if (ultimate) slots.push({ star: 1, kind: 'ultimate', label: 'Ultimate', ability: ultimate, enhancement: null })
  if (skills[0]) slots.push({ star: 2, kind: 'skill', label: 'Skill 1', ability: skills[0], enhancement: upgrades[0] ?? null })
  if (globalSkill) slots.push({ star: 3, kind: 'global', label: 'Global Skill', ability: globalSkill, enhancement: null })
  if (skills[1]) slots.push({ star: 4, kind: 'skill', label: 'Skill 2', ability: skills[1], enhancement: upgrades[1] ?? null })
  if (skills[2]) slots.push({ star: 5, kind: 'skill', label: 'Skill 3', ability: skills[2], enhancement: upgrades[2] ?? null })

  // Anything that couldn't be paired to a skill still gets shown rather than dropped.
  const orphans = upgrades.slice(Math.max(skills.length, 0)).filter(Boolean)

  const [active, setActive] = useState<number>(slots[0]?.star ?? 0)

  if (slots.length === 0 && orphans.length === 0) return null

  return (
    <section className="card ak" aria-labelledby="ak-heading">
      <div className="ak__head">
        <h2 id="ak-heading" className="ak__title">Champion Abilities</h2>
        <p className="ak__note">
          Abilities unlock from 1 star and gain an upgrade at every rank —
          {RANKS.map((r, i) => (
            <span key={r.name}>
              {i === 0 ? ' ' : ', '}
              <span className="ak__rank" style={{ color: r.color }}>{r.name}</span>
            </span>
          ))}
          . The star each ability upgrades on is shown on its card.
        </p>
      </div>

      {slots.length > 0 && (
        <div className="ak-rail" role="tablist" aria-label="Jump to ability">
          {slots.map((s) => (
            <button
              key={s.star}
              type="button"
              role="tab"
              aria-selected={active === s.star}
              id={'ak-tab-' + s.star}
              aria-controls={'ak-panel-' + s.star}
              className={'ak-rail__item' + (active === s.star ? ' is-active' : '') + ' ak-rail__item--' + s.kind}
              onClick={() => setActive(s.star)}
            >
              <span className="ak-rail__star">{s.star}</span>
              <span className="ak-rail__frame">
                {s.ability.image && <img src={s.ability.image} alt="" loading="lazy" />}
              </span>
              <span className="ak-rail__label">{s.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="ak-list">
        {slots.map((s) => (
          <article
            key={s.star}
            id={'ak-panel-' + s.star}
            role="tabpanel"
            aria-labelledby={'ak-tab-' + s.star}
            className={'ak-card ak-card--' + s.kind + (active === s.star ? ' is-shown' : '')}
          >
            <div className="ak-card__main">
              <div className="ak-card__frame">
                {s.ability.image && <img src={s.ability.image} alt={s.ability.name} loading="lazy" />}
                <span className="ak-card__star" aria-label={'Upgrades on star ' + s.star}>★{s.star}</span>
              </div>

              <div className="ak-card__body">
                <div className="ak-card__meta">
                  <span className="ak-pill">{s.label}</span>
                  <RankPips />
                </div>
                <h3 className="ak-card__name">{s.ability.name}</h3>
                <p className="ak-card__desc">{renderDescription(s.ability.description)}</p>
              </div>
            </div>

            {s.enhancement && (
              <div className="ak-enh">
                {s.enhancement.image && <img className="ak-enh__icon" src={s.enhancement.image} alt={s.enhancement.name} loading="lazy" />}
                <div>
                  <div className="ak-enh__tag">Multiversal Force Enhancement</div>
                  <div className="ak-enh__name">{s.enhancement.name}</div>
                  <p className="ak-enh__desc">{renderDescription(s.enhancement.description)}</p>
                </div>
              </div>
            )}
          </article>
        ))}

        {orphans.map((u) => (
          <article key={u.name} className="ak-card ak-card--skill">
            <div className="ak-card__main">
              <div className="ak-card__frame">
                {u.image && <img src={u.image} alt={u.name} loading="lazy" />}
              </div>
              <div className="ak-card__body">
                <div className="ak-card__meta">
                  <span className="ak-pill">Multiversal Force Enhancement</span>
                </div>
                <h3 className="ak-card__name">{u.name}</h3>
                <p className="ak-card__desc">{renderDescription(u.description)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
