'use client'

import { Fragment, useState } from 'react'
import type { Skill } from '../lib/data'

const NUM = /\d[\d,]*(?:\.\d+)?%?/g

/**
 * One skill description at one level. Lines that start "#n" are combo / multi-hit
 * stages, "Damage: 24% ATK"-style lines are the scaling formula, and "[15% DEF Up]" is
 * a status effect (hover for its description). Numbers that differ from the previous
 * level are highlighted.
 */
function SkillText({ text, prev, effects }: { text: string; prev?: string; effects: Skill['effects'] }) {
  const prevNums = prev ? prev.match(NUM) ?? [] : null
  let n = 0
  const desc = new Map(effects.map((e) => [e.label.toLowerCase(), e.description]))

  const renderPlain = (s: string, key: string) => {
    const out: React.ReactNode[] = []
    let last = 0
    for (const m of s.matchAll(NUM)) {
      const i = n++
      if (m.index! > last) out.push(s.slice(last, m.index))
      const changed = prevNums && prevNums[i] !== undefined && prevNums[i] !== m[0]
      out.push(changed ? <mark key={`${key}-${i}`} className="inv-up">{m[0]}</mark> : m[0])
      last = m.index! + m[0].length
    }
    if (last < s.length) out.push(s.slice(last))
    return out
  }

  const renderLine = (line: string, li: number) => {
    const parts: React.ReactNode[] = []
    let last = 0
    for (const m of line.matchAll(/\[([^\]]+)\]/g)) {
      if (m.index! > last) parts.push(<Fragment key={`t${li}-${last}`}>{renderPlain(line.slice(last, m.index), `${li}-${last}`)}</Fragment>)
      const label = m[1].replace(/^[\d.,]+%?\s*/, '')
      parts.push(
        <span key={`e${li}-${m.index}`} className="inv-effect" title={desc.get(label.toLowerCase())}>
          {renderPlain(m[1], `${li}-e${m.index}`)}
        </span>,
      )
      last = m.index! + m[0].length
    }
    if (last < line.length) parts.push(<Fragment key={`t${li}-end`}>{renderPlain(line.slice(last), `${li}-end`)}</Fragment>)
    return parts
  }

  return (
    <div className="inv-skill-text">
      {text.split('\n').map((raw, li) => {
        const line = raw.trim()
        if (!line) return null
        const stage = line.match(/^#(\d+)\s*(.*)$/)
        const body = stage ? stage[2] : line
        const formula = /^(Damage|Heal|Shield|Accuracy required for|Barrier|Absorb)\b[^:]*:/i.test(body)
        const banner = /^INVOKATION( END)?$/.test(body)
        return (
          <p key={li} className={formula ? 'is-formula' : banner ? 'is-banner' : undefined}>
            {stage && <span className="inv-stage">{stage[1]}</span>}
            {renderLine(body, li)}
          </p>
        )
      })}
    </div>
  )
}

export default function SkillKit({ skills, name }: { skills: Skill[]; name: string }) {
  const maxLevel = Math.max(...skills.map((s) => s.levels.length))
  const [level, setLevel] = useState(maxLevel)

  return (
    <div className="inv-kit">
      <div className="inv-level">
        <label htmlFor="inv-level">
          Skill level <strong>{level}</strong>
          {skills[0]?.levels[level - 1]?.crown && <span className="inv-crown" title="Crown level">♛</span>}
        </label>
        <input
          id="inv-level"
          type="range"
          min={1}
          max={maxLevel}
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          aria-label={`${name} skill level`}
        />
        <span className="inv-level-hint">Highlighted numbers changed from the level before.</span>
      </div>

      {skills.map((s) => {
        // Bound Effects have fewer levels than the rest of the kit; clamp to the last one.
        const idx = Math.min(level, s.levels.length) - 1
        const cur = s.levels[idx]
        const prev = idx > 0 ? s.levels[idx - 1] : undefined
        return (
          <article key={s.type} className="inv-skill">
            <div className="inv-skill-head">
              {s.icon ? <img src={s.icon} alt="" width={56} height={56} loading="lazy" /> : <span className="inv-skill-noicon" />}
              <div>
                <span className="inv-skill-type">
                  {s.label !== s.name && s.label}
                  {s.aoe && <span className="inv-aoe">AoE</span>}
                </span>
                <h3>{s.name}</h3>
                <span className="inv-skill-meta">
                  {cur.cooldown && cur.cooldown !== '-' && <span>Cooldown {cur.cooldown}</span>}
                  {cur.cost && cur.cost !== '-' && cur.cost !== '0' && <span>Cost {cur.cost}</span>}
                  {s.manaGen?.ult && <span>Ult mana {s.manaGen.ult}</span>}
                  {s.manaGen?.titan && <span>Titan mana {s.manaGen.titan}</span>}
                  {s.levels.length < maxLevel && <span>Level {idx + 1} of {s.levels.length}</span>}
                </span>
              </div>
            </div>
            <SkillText text={cur.text} prev={prev?.text} effects={s.effects} />
            {s.effects.length > 0 && (
              <ul className="inv-skill-effects">
                {s.effects.map((e) => (
                  <li key={e.label}>
                    <span className={`inv-effect inv-effect--${e.group === 'Buffs' ? 'buff' : e.group === 'Debuffs' ? 'debuff' : 'other'}`}>
                      {e.label}
                    </span>{' '}
                    {e.description}
                  </li>
                ))}
              </ul>
            )}
          </article>
        )
      })}
    </div>
  )
}
