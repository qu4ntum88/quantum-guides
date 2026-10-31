export type StatusEffect = {
  id: string
  name: string
  image: string
  description: string
  /** hunters.json ids of every hunter whose kit names the effect. */
  hunters?: string[]
  /** The effect belongs to one hunter (their vow, resource, stance…). */
  unique?: boolean
}

export type EffectOwner = { name: string; portrait: string | null; href: string }

function Portrait({ owner }: { owner: EffectOwner }) {
  return owner.portrait ? <img src={owner.portrait} alt="" loading="lazy" /> : <span aria-hidden="true">?</span>
}

/** One status effect: icon, name and the game's description (line breaks kept), then who uses it:
 *  a large portrait for an effect unique to one hunter, a row of small ones for a shared effect. */
export default function StatusEffectBox({ effect, owners }: { effect: StatusEffect; owners: EffectOwner[] }) {
  const unique = effect.unique && owners.length > 0
  return (
    <article className={`vh-effect${unique ? ' vh-effect--unique' : ''}`}>
      <div className="vh-effect-main">
        <div className="vh-effect-icon">
          {effect.image ? <img src={effect.image} alt="" loading="lazy" /> : <span aria-hidden="true">?</span>}
        </div>
        <div className="vh-effect-body">
          <h3>
            {effect.name}
            {unique && <span className="vh-effect-tag">Unique</span>}
          </h3>
          {effect.description
            ? <p>{effect.description}</p>
            : <p className="vh-effect-none">Unknown. To be updated.</p>}
        </div>
        {unique && (
          <a className="vh-effect-owner" href={owners[0].href} title={`Unique to ${owners[0].name}`}>
            <Portrait owner={owners[0]} />
            <small>Unique to<br />{owners[0].name}</small>
          </a>
        )}
      </div>
      {!unique && owners.length > 0 && (
        <div className="vh-effect-users">
          <small>In {owners.length} hunter{owners.length === 1 ? "'s" : "s'"} kit{owners.length === 1 ? '' : 's'}</small>
          <ul>
            {owners.map((o) => (
              <li key={o.href}>
                <a href={o.href} title={o.name} aria-label={o.name}><Portrait owner={o} /></a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
