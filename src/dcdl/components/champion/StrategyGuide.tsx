// The game's own A.C.C. Strategy Guide for a champion (AccHeroCultivate, synced into
// src/dcdl/data/game/champions/<id>.json by scripts/sync-dcdl-kits.mjs), with Quantum's
// notes on it (`guideNotes` in heros.json) shown alongside. Legacy tiles open the pop-up.

import type { ReactNode } from 'react'
import LegacyPieceBox from '../LegacyPieceBox'
import TakeBody from '../TakeBody'
import { LegacyDetailProvider } from '../legacy/LegacyDetail'
import type { HeroResolved, LegacyResolved } from '../../lib/data'
import './champion-data.css'

type Ref = { id: string | null; name: string }
export type InGameGuide = {
  overview: string
  recommendedStats: string[]
  tags: string[]
  bestFor: string[]
  legacyPieces: (Ref & { reason: string | null; signature: boolean })[]
  alternatives: Ref[]
  champions: Ref[]
  lineups: { name: string; tags: string[] }[]
}

const PLACEHOLDER = '/dcdl/heros/headshot_images/_placeholder.png'

function Chips({ label, items, tone }: { label: string; items: string[]; tone?: 'gold' }) {
  if (!items.length) return null
  return (
    <div className="sg-chips">
      <span className="sg-label">{label}</span>
      <div className="sg-chips__row">
        {items.map((x) => <span key={x} className={'sg-chip' + (tone ? ` sg-chip--${tone}` : '')}>{x}</span>)}
      </div>
    </div>
  )
}

export default function StrategyGuide({ guide, notes, legacy, heros, children }: {
  guide: InGameGuide
  notes?: string
  /** Extra Quantum commentary rendered at the top of the notes box. */
  children?: ReactNode
  legacy: LegacyResolved[]
  heros: HeroResolved[]
}) {
  const piece = (id: string | null) => (id ? legacy.find((l) => l.id === id) : undefined)
  const champs = guide.champions.map((c) => ({ ...c, hero: c.id ? heros.find((h) => h.id === c.id) : undefined }))

  return (
    <section className="card cgd sg" aria-labelledby="sg-title">
      <h2 id="sg-title">Strategy Guide</h2>

      {guide.overview && <div className="sg-overview"><TakeBody text={guide.overview} /></div>}

      <div className="sg-meta">
        <Chips label="Recommended Stats" items={guide.recommendedStats} tone="gold" />
        <Chips label="Best For" items={guide.bestFor} />
        <Chips label="Strengths" items={guide.tags} />
      </div>

      {guide.legacyPieces.length > 0 && (
        <>
          <h3 className="sg-h3">Recommended Legacy Pieces</h3>
          <LegacyDetailProvider>
            <div className="sg-pieces">
              {guide.legacyPieces.map((p) => {
                const l = piece(p.id)
                return (
                  <div key={p.name} className="sg-piece">
                    <div className="sg-piece__tile">
                      {l ? <LegacyPieceBox piece={l} /> : <div className="sg-piece__missing">{p.name}</div>}
                    </div>
                    <div className="sg-piece__body">
                      <div className="sg-piece__name">
                        {p.name}
                        {p.signature && <span className="sg-badge">Signature</span>}
                      </div>
                      {p.reason && <p className="sg-piece__reason">{p.reason}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
            {guide.alternatives.length > 0 && (
              <div className="sg-alts">
                <span className="sg-label">Alternatives</span>
                <div className="sg-alts__row">
                  {guide.alternatives.map((a) => {
                    const l = piece(a.id)
                    return l
                      ? <div key={a.name} className="sg-alts__tile"><LegacyPieceBox piece={l} compact /></div>
                      : <span key={a.name} className="sg-chip">{a.name}</span>
                  })}
                </div>
              </div>
            )}
          </LegacyDetailProvider>
        </>
      )}

      {(champs.length > 0 || guide.lineups.length > 0) && (
        <div className="sg-team">
          {champs.length > 0 && (
            <div>
              <h3 className="sg-h3">Recommended Champions</h3>
              <div className="sg-champs">
                {champs.map((c) => {
                  const inner = (
                    <>
                      <img src={c.hero?.imageHeadshot || PLACEHOLDER} alt="" loading="lazy" />
                      <span>{c.hero?.name.split('(')[0].trim() || c.name}</span>
                    </>
                  )
                  return c.hero
                    ? <a key={c.name} className="sg-champ" href={`/games/dc-dark-legion/heros/${c.hero.id}`}>{inner}</a>
                    : <span key={c.name} className="sg-champ">{inner}</span>
                })}
              </div>
            </div>
          )}
          {guide.lineups.length > 0 && (
            <div>
              <h3 className="sg-h3">Recommended Lineup</h3>
              {guide.lineups.map((l) => (
                <div key={l.name} className="sg-lineup">
                  <span className="sg-lineup__name">{l.name}</span>
                  {l.tags.map((t) => <span key={t} className="sg-chip">{t}</span>)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(notes || children) && (
        <aside className="sg-notes" aria-label="Quantum's notes on the in-game guide">
          <div className="sg-notes__head">
            <img src="/images/site/Q GOLD FULL ICON.png" alt="" />
            <span>Quantum&apos;s Notes</span>
          </div>
          {children}
          {notes && <TakeBody text={notes} />}
        </aside>
      )}
    </section>
  )
}
