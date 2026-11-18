import type { StatusEffect } from './StatusEffectBox'
import RichText from './RichText'

// "Kit History" on a hunter page: what each game update changed in the kit, as a redline
// (deleted words red + struck through, added words green). Data: src/vh/data/kit-history.json,
// written by scripts/sync-vh-kits.mjs. Styles: .vh-redline* in app/games/void-hunters/void-hunters.css.

type Op = ['=' | '-' | '+', string]
type HistorySkill = {
  name: string
  change: 'changed' | 'renamed' | 'added' | 'removed'
  kind?: 'numbers' | 'wording'
  renamedFrom?: string
  ops?: Op[]
  upgradeOps?: Op[]
  text?: string
}
type HistoryEntry = { id: string; date: string; title: string; from: string; skills: HistorySkill[] }

export function getKitHistory(hunterId: string): HistoryEntry[] {
  const all = require('@/src/vh/data/kit-history.json') as Record<string, HistoryEntry[]>
  return all[hunterId] ?? []
}

const longDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

function Redline({ ops, effects }: { ops: Op[]; effects: StatusEffect[] }) {
  return (
    <>
      {ops.map(([t, s], i) =>
        t === '=' ? <RichText key={i} text={s} effects={effects} />
          : t === '-' ? <del key={i}>{s}</del>
            : <ins key={i}><RichText text={s} effects={effects} /></ins>,
      )}
    </>
  )
}

const BADGE: Record<string, string> = {
  numbers: 'Numbers changed',
  wording: 'Wording',
  added: 'New skill',
  removed: 'Removed',
}

export default function KitHistory({ hunterId, effects }: { hunterId: string; effects: StatusEffect[] }) {
  const entries = getKitHistory(hunterId)
  if (!entries.length) return null
  return (
    <div className="vh-redline">
      <p className="vh-redline-key">
        <del>Removed text</del> <ins>Added text</ins>
      </p>
      {entries.map((e) => (
        <section key={e.id} className="vh-redline-entry">
          <h3>
            {e.title} <span>{longDate(e.date)} · changes since the {e.from}</span>
          </h3>
          {e.skills.map((s) => {
            const badge = s.change === 'added' || s.change === 'removed' ? s.change : s.kind ?? 'wording'
            return (
              <div key={s.name} className="vh-redline-skill">
                <div className="vh-redline-name">
                  {s.name}
                  {s.renamedFrom && <small> (was {s.renamedFrom})</small>}
                  <span className={`vh-redline-badge vh-redline-badge--${badge}`}>{BADGE[badge]}</span>
                </div>
                <p>
                  {s.ops ? <Redline ops={s.ops} effects={effects} />
                    : s.change === 'removed' ? <del>{s.text}</del>
                      : <ins><RichText text={s.text ?? ''} effects={effects} /></ins>}
                </p>
                {s.upgradeOps && (
                  <details>
                    <summary>Level-up changes</summary>
                    <p className="vh-redline-levels"><Redline ops={s.upgradeOps} effects={effects} /></p>
                  </details>
                )}
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}
