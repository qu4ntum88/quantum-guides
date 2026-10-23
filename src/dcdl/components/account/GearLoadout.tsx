'use client'

// A champion's five gear pieces on its Stat Calculator, like the gear row on the in-game champion
// screen: each slot shows the piece, its quality frame, level and faction tag. Stats depend only on
// the armor weight, slot and level; the look (named set) is cosmetic; a faction tag that matches the
// champion adds 20% to that piece from Orange up. Transmutes aren't included (random rolls).

import { useState } from 'react'
import {
  GEAR_SLOTS, gearPieceStats, qualityOf, statChips, tagBonus,
  type AccountData, type GearPiece,
} from '@/src/dcdl/lib/account-bonuses'
import { NumberField } from './ui'
import './account.css'

const QUALITY_COLOR: Record<string, string> = {
  Green: '#22c55e', GreenPlus: '#22c55e', Blue: '#3b82f6', BluePlus: '#3b82f6', Purple: '#a855f7', PurplePlus: '#a855f7',
  Orange: '#f59e0b', OrangePlus: '#f59e0b', Red: '#ef4444', RedPlus: '#ff4d8d',
}
const EMPTY_ART: Record<string, string> = {
  Helmet: 'img_hero_equip_preview_head', BodySuit: 'img_hero_equip_preview_chest', Greaves: 'img_hero_equip_preview_arm',
  Belt: 'img_hero_equip_preview_belt', Boots: 'img_hero_equip_preview_leg',
}
const factionIcon = (id: string) => (id.startsWith('tag-') ? null : `/dcdl/synergies/tag_images/${id}.png`)

export default function GearLoadout({ data, championId, pieces, onChange }: {
  data: AccountData
  championId: string
  pieces: GearPiece[]
  onChange: (next: GearPiece[]) => void
}) {
  const me = data.champions[championId]
  const type = me?.armor ? data.gear.types[me.armor] : null
  const [sel, setSel] = useState<number | null>(null)
  if (!me || !type) return null
  const mine = me.factions
  const setPiece = (i: number, p: Partial<GearPiece>) => onChange(pieces.map((x, j) => (j === i ? { ...x, ...p } : x)))
  const all = (p: Partial<GearPiece>) => onChange(pieces.map((x) => ({ ...x, ...p })))
  const piece = sel != null ? pieces[sel] : null
  const q = piece ? qualityOf(data, piece.level) : null
  const slot = sel != null ? GEAR_SLOTS[sel] : null

  return (
    <div className="gear">
      <div className="gear__row">
        {GEAR_SLOTS.map((s, i) => {
          const p = pieces[i]
          const pq = qualityOf(data, p.level)
          const icon = p.level ? type.sets[p.set]?.icons[s] ?? type.sets[0]?.icons[s] : null
          const bonus = tagBonus(data, championId, p)
          const tagIcon = p.tag && p.tag !== 'other' ? factionIcon(p.tag) : null
          return (
            <button
              key={s} type="button"
              className={'gear__slot' + (p.level ? '' : ' is-empty') + (sel === i ? ' is-sel' : '')}
              style={{ '--q': pq ? QUALITY_COLOR[pq.key] ?? '#94a3b8' : 'rgba(255,255,255,0.15)' } as React.CSSProperties}
              aria-pressed={sel === i}
              aria-label={`${type.slots[s]?.name}: ${p.level ? `${pq?.name} Lv ${p.level}` : 'empty'}`}
              onClick={() => setSel(sel === i ? null : i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="gear__icon" src={icon ?? `/dcdl/account/ui/${EMPTY_ART[s]}.png`} alt="" />
              {p.tag && p.tag !== 'other' && (
                <span className={'gear__tag' + (bonus ? ' is-match' : '')} title={data.factions[p.tag]?.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {tagIcon ? <img src={tagIcon} alt="" /> : '◆'}
                </span>
              )}
              {p.tag === 'other' && <span className="gear__tag is-other" title="Another faction">◆</span>}
              <span className="gear__lv">{p.level ? `Lv ${p.level}` : 'Empty'}</span>
              <span className="gear__slotname">{type.slots[s]?.name}</span>
              {bonus > 0 && <span className="gear__bonus">+{bonus}%</span>}
            </button>
          )
        })}
      </div>
      <div className="gear__quick">
        <button type="button" onClick={() => all({ level: 500, tag: null })}>All Lv 500</button>
        {mine.length > 0 && <button type="button" onClick={() => all({ level: 500, tag: mine[0] })}>All Lv 500, faction-matched</button>}
        <button type="button" onClick={() => onChange(pieces.map(() => ({ level: 0, set: 0, tag: null })))}>Clear</button>
      </div>

      {piece && slot && sel != null && (
        <div className="gear__edit">
          <div className="gear__edit-head">
            <strong>{type.slots[slot]?.name}</strong>
            <span className="acct-muted">{type.name} armor · {type.classes.join(', ')}</span>
            <button type="button" className="gear__close" onClick={() => setSel(null)} aria-label="Close">×</button>
          </div>

          <span className="acct-label">Quality</span>
          <div className="gear__qualities">
            <button type="button" className={!piece.level ? 'is-on' : ''} onClick={() => setPiece(sel, { level: 0 })}>Empty</button>
            {data.gear.qualities.map((x) => (
              <button
                key={x.key} type="button" className={q?.key === x.key ? 'is-on' : ''}
                style={{ '--q': QUALITY_COLOR[x.key] } as React.CSSProperties}
                onClick={() => setPiece(sel, { level: x.max })}
              >
                {x.name}<em>{x.min === x.max ? `Lv ${x.min}` : `Lv ${x.min}–${x.max}`}</em>
              </button>
            ))}
          </div>

          {q && q.min !== q.max && (
            <div className="gear__level">
              <span className="acct-label">Level</span>
              <input type="range" min={q.min} max={q.max} value={piece.level} onChange={(e) => setPiece(sel, { level: Number(e.target.value) })} aria-label="Gear level" />
              <NumberField value={piece.level} min={q.min} max={q.max} onChange={(n) => setPiece(sel, { level: Math.round(n) })} label="Gear level" />
            </div>
          )}

          {piece.level > 0 && (
            <>
              <span className="acct-label">Faction tag on the piece</span>
              {(q?.factionBonus ?? 0) > 0 ? (
                <div className="gear__tags">
                  <button type="button" className={!piece.tag ? 'is-on' : ''} onClick={() => setPiece(sel, { tag: null })}>No tag</button>
                  {mine.map((f) => (
                    <button key={f} type="button" className={piece.tag === f ? 'is-on is-match' : 'is-match'} onClick={() => setPiece(sel, { tag: f })}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {factionIcon(f) && <img src={factionIcon(f)!} alt="" />}
                      {data.factions[f]?.name ?? f}<em>+{q?.factionBonus}%</em>
                    </button>
                  ))}
                  <button type="button" className={piece.tag === 'other' ? 'is-on' : ''} onClick={() => setPiece(sel, { tag: 'other' })}>Another faction<em>no bonus</em></button>
                </div>
              ) : (
                <p className="acct-muted">Faction tags only roll on Orange gear and up.</p>
              )}

              <span className="acct-label">Look (the named set changes the art, not the stats)</span>
              <div className="gear__sets">
                {type.sets.map((st, i) => (
                  <button key={st.name} type="button" className={piece.set === i ? 'is-on' : ''} title={st.name} aria-label={st.name} onClick={() => setPiece(sel, { set: i })}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {st.icons[slot] && <img src={st.icons[slot]!} alt="" />}
                  </button>
                ))}
              </div>

              <div className="gear__stats">
                <span className="acct-label">This piece</span>
                <span className="acct-chips">
                  {statChips(data, gearPieceStats(data, me.armor!, slot, piece.level).map(([k, v]) => [k, Math.floor(v * (1 + tagBonus(data, championId, piece) / 100))])).map((c) => <span key={c} className="acct-chip">{c}</span>)}
                </span>
              </div>
              <button type="button" className="gear__copy" onClick={() => all({ level: piece.level, tag: piece.tag, set: piece.set })}>Use this quality, level, tag and look on all five slots</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
