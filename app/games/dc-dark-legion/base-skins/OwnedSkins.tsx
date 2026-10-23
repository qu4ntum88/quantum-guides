'use client'

import { formatBonus, getOwnedTotals, type BaseSkin } from '@/src/dcdl/lib/base-skins'
import { useOwnedSkins } from '@/src/dcdl/lib/owned-skins'

type SkinLite = Pick<BaseSkin, 'id' | 'name' | 'order' | 'owned'>

/** "I own this" switch on each skin card. The choice is shared with the champion Stat Calculator. */
export function OwnToggle({ id, name }: { id: string; name: string }) {
  const { owned, toggle } = useOwnedSkins()
  const on = owned.has(id)
  return (
    <button
      type="button"
      className="bsk-own"
      aria-pressed={on}
      aria-label={`I own ${name}`}
      onClick={() => toggle(id)}
    >
      <span className="bsk-own__box" aria-hidden="true">{on ? '✓' : ''}</span>
      {on ? 'Owned' : 'I own this'}
    </button>
  )
}

/** The owned-bonus totals for the skins the visitor has ticked, with own-all / clear. */
export function OwnedTotals({ skins }: { skins: SkinLite[] }) {
  const { owned, setAll } = useOwnedSkins()
  const mine = skins.filter((s) => owned.has(s.id))
  const all = getOwnedTotals(skins)
  const totals = getOwnedTotals(mine)
  const value = (key: string) => totals.find((t) => t.key === key)

  return (
    <div className="bsk-mine">
      <div className="bsk-mine__head">
        <span className="bsk-mine__count">
          You own <strong>{mine.length}</strong> of {skins.length}
        </span>
        <span className="bsk-mine__btns">
          <button type="button" onClick={() => setAll(skins.map((s) => s.id))} disabled={mine.length === skins.length}>I own them all</button>
          <button type="button" onClick={() => setAll([])} disabled={!mine.length}>Clear</button>
        </span>
      </div>
      <ul className="bsk-totals">
        {all.map((t) => {
          const v = value(t.key)
          return (
            <li key={t.key} className={v ? '' : 'is-zero'}>
              <strong>{v ? formatBonus(v) : '+0%'}</strong>
              <span>{t.stat}</span>
              <em>of {formatBonus(t)} with every skin</em>
            </li>
          )
        })}
      </ul>
      <p className="bsk-mine__note">
        {mine.length
          ? 'These are added to every champion. The champion pages’ Stat Calculator uses the same picks.'
          : 'Tick “I own this” on each skin below, or pick “I own them all”. Your picks are saved in this browser and also feed the Stat Calculator on every champion page.'}
      </p>
    </div>
  )
}
