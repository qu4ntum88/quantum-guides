'use client'

// The body of a legacy piece's page (/games/dc-dark-legion/legacy/<id>): Gear Effects per
// star, skill upgrade paths, classes, art and the in-game guidance, all from
// public/dcdl/legacy/details/<id>.json (written by scripts/sync-dcdl-kits.mjs). The page
// reads that file at build time and passes it in, so everything is in the HTML; this is a
// client component only for the star scrubber.

import { useMemo, useState } from 'react'
import TierBadge from '../TierBadge'
import type { Legacy } from '../../lib/data'
import { STAR_TIERS, UNLOCK_COLOR, starLabelColor } from '../../lib/star-tiers'
import './legacy-detail.css'

export type LegacyDetails = {
  quality: string
  uniqueTo: string | null
  classes: string[]
  art: string | null
  gearEffects: { stats: string[]; rows: string[][] } | null
  skills: { name: string; kind: 'exclusive' | 'general'; steps: { label: string; text: string }[] }[]
  // The in-game champion guide's reasons for recommending this piece, one per champion;
  // `signature` marks the champion whose signature (unique) piece it is.
  guide: { champion: string; signature: boolean; text: string }[]
}

export const LEGACY_QUALITY: Record<string, string> = { Red: 'Mythic', Orange: 'Legendary', Purple: 'Epic' }

export function LegacyDetailView({ piece, data, footer }: { piece: Legacy; data: LegacyDetails | null; footer?: React.ReactNode }) {
  const rows = data?.gearEffects?.rows ?? []
  const [star, setStar] = useState(Math.max(rows.length - 1, 0))
  const [showAll, setShowAll] = useState(true)

  const rank = piece.rank || (data ? LEGACY_QUALITY[data.quality] : undefined)
  const current = rows[star]

  return (
    <>
      {/* Header: art, icon, name, rank, classes, tiers */}
      <header className="ld-head">
        <div className="ld-art">
          {data?.art
            ? <img src={data.art} alt={`${piece.name} legacy piece art`} />
            : piece.image && <img src={piece.image} alt="" className="ld-art--icon" />}
        </div>
        <div className="ld-head__body">
          <div className="ld-title-row">
            {piece.image && <img className="ld-icon" src={piece.image} alt="" />}
            <h1 className="ld-title">{piece.name}</h1>
          </div>
          <div className="ld-chips">
            {rank && <span className={`ld-chip ld-chip--rank ld-chip--${(data?.quality || 'Red').toLowerCase()}`}>{rank}</span>}
            {data?.uniqueTo && <span className="ld-chip ld-chip--unique">Unique · {data.uniqueTo}</span>}
            {piece.isNew && <span className="ld-chip ld-chip--new">New</span>}
          </div>
          {data && data.classes.length > 0 && (
            <div className="ld-classes">
              <span className="ld-label">Equippable by</span>
              {data.classes.map((c) => (
                <span key={c} className="ld-class"><img src={`/dcdl/role_images/${c}.png`} alt="" />{c}</span>
              ))}
            </div>
          )}
          <div className="ld-tiers">
            <span className="ld-tier"><span className="ld-label">Quantum</span><TierBadge tier={piece.tier} /></span>
          </div>
        </div>
      </header>

      {!data && <p className="ld-note">Detailed game data isn&apos;t available for this piece yet.</p>}

      {/* Gear Effects, scrubbable by star */}
      {data?.gearEffects && current && (
        <section className="ld-section">
          <div className="ld-section__head">
            <h2 className="ld-h">Gear Effects</h2>
            <span className="ld-star-label" style={{ color: starLabelColor(current[0]) }}>{current[0]}</span>
          </div>
          <StarTrack count={rows.length} value={star} onChange={setStar} />
          <div className="ld-stats">
            {data.gearEffects.stats.map((s, i) => (
              <div key={s + i} className="ld-stat">
                <span className="ld-stat__value">+{current[i + 1]}</span>
                <span className="ld-stat__name">{s.replace(/ %$/, '')}</span>
              </div>
            ))}
          </div>
          <button type="button" className="ld-link" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Hide' : 'Show'} every star
          </button>
          {showAll && (
            <div className="ld-table-wrap">
              <table className="ld-table">
                <thead><tr><th>Star</th>{data.gearEffects.stats.map((s, i) => <th key={s + i}>{s}</th>)}</tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r[0]} className={i === star ? 'is-current' : ''} onClick={() => setStar(i)}>
                      <td style={{ color: starLabelColor(r[0]) }}>{r[0]}</td>
                      {r.slice(1).map((v, j) => <td key={j}>+{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Skills with their upgrade paths */}
      {data && data.skills.length > 0 && (
        <section className="ld-section">
          <h2 className="ld-h">Skills</h2>
          {data.skills.map((s) => {
            const icon = piece.legacySkills?.find((x) => x.name.toLowerCase() === (s.name || '').toLowerCase())?.image
              ?? piece.legacySkills?.find((x) => (s.kind === 'general') === /general/i.test(x.image || ''))?.image
            return (
              <article key={s.name + s.kind} className={`ld-skill ld-skill--${s.kind}`}>
                <div className="ld-skill__head">
                  {icon && <img src={icon} alt="" />}
                  <div>
                    <span className="ld-skill__kind">{s.kind === 'exclusive' ? `Exclusive${data.uniqueTo ? ` · ${data.uniqueTo} only` : ''}` : 'General · any wearer'}</span>
                    <h3 className="ld-skill__name">{s.name || 'Unnamed skill'}</h3>
                  </div>
                </div>
                <ol className="ld-steps">
                  {s.steps.map((st, i) => (
                    <li key={st.label} style={{ '--step': starLabelColor(st.label) } as React.CSSProperties}>
                      <span className="ld-steps__label">{st.label}</span>
                      <span className="ld-steps__text"><Diff text={st.text} prev={s.steps[i - 1]?.text} /></span>
                    </li>
                  ))}
                </ol>
              </article>
            )
          })}
        </section>
      )}

      {data && data.guide.length > 0 && (
        <section className="ld-section">
          <h2 className="ld-h">In-game recommendations</h2>
          <p className="ld-sub">Champions the game&apos;s own champion guide recommends this piece for, and why.</p>
          <ul className="ld-recs">
            {data.guide.map((g) => (
              <li key={g.champion + g.text} className={g.signature ? 'is-signature' : ''}>
                <span className="ld-recs__who">
                  {g.champion}
                  {g.signature && <span className="ld-recs__sig">Signature piece</span>}
                </span>
                <span className="ld-recs__why">{g.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {footer}
    </>
  )
}

/** Unlock + 25 stars as five colour bands; click/drag/arrow keys to scrub. */
function StarTrack({ count, value, onChange }: { count: number; value: number; onChange: (n: number) => void }) {
  const dots = useMemo(() => Array.from({ length: count }, (_, i) => (i === 0 ? UNLOCK_COLOR : STAR_TIERS[Math.floor((i - 1) / 5)]?.color ?? UNLOCK_COLOR)), [count])
  return (
    <div className="ld-track">
      <input
        type="range" min={0} max={count - 1} value={value} onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Star level" aria-valuetext={value === 0 ? 'Unlock' : `${((value - 1) % 5) + 1} star ${STAR_TIERS[Math.floor((value - 1) / 5)]?.name}`}
      />
      <div className="ld-track__dots" aria-hidden="true">
        {dots.map((c, i) => (
          <span key={i} className={'ld-track__dot' + (i <= value ? ' is-on' : '') + (i % 5 === 0 && i > 0 ? ' is-band-end' : '')} style={{ '--dot': c } as React.CSSProperties} />
        ))}
      </div>
      <div className="ld-track__bands" aria-hidden="true">
        <span style={{ color: UNLOCK_COLOR }}>Unlock</span>
        {STAR_TIERS.map((t) => <span key={t.name} style={{ color: t.color }}>{t.name}</span>)}
      </div>
    </div>
  )
}

/** Highlight the numbers that changed since the previous upgrade step. */
function Diff({ text, prev }: { text: string; prev?: string }) {
  if (!prev) return <>{text}</>
  const before = prev.match(/\d+(?:\.\d+)?%?/g) ?? []
  let k = 0
  return (
    <>
      {text.split(/(\d+(?:\.\d+)?%?)/g).map((part, i) => {
        if (!/^\d/.test(part)) return <span key={i}>{part}</span>
        const changed = before[k++] !== part
        return changed ? <mark key={i} className="ld-up">{part}</mark> : <span key={i}>{part}</span>
      })}
    </>
  )
}
