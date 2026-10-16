import Link from 'next/link'
import JsonLd from '@/app/components/JsonLd'
import { breadcrumbLd, faqLd, INV_CRUMB } from '@/src/lib/seo'
import SkillKit from './SkillKit'
import QTile from '@/src/qgg/components/QTile'
import QuantumTake from '@/src/qgg/components/QuantumTake'
import { getUnitNote } from '@/src/qgg/notes'
import { getIcons, toTile } from '../lib/board'
import { getRoster, getTierLists, type Unit } from '../lib/data'
import { RARITY_COLORS, TIER_COLORS, tierIndex, tierListPath, unitPath } from '../lib/constants'

const article = (w: string) => (/^[aeiou]/i.test(w) ? 'an' : 'a')
const joinList = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

function pronouns(u: Unit) {
  if (u.kind === 'Titan') return { sub: 'it', pos: 'its' }
  if (u.gender === 'Female') return { sub: 'she', pos: 'her' }
  if (u.gender === 'Male') return { sub: 'he', pos: 'his' }
  return { sub: 'they', pos: 'their' }
}

/** Per-boss ratings, best first, with each list's display name. */
function placements(u: Unit) {
  const boss = new Map(getTierLists(u.kind).map((l) => [l.id, l.boss]))
  return Object.entries(u.ratings)
    .map(([id, tier]) => ({ id, tier, boss: boss.get(id) ?? id }))
    .sort((a, b) => tierIndex(a.tier) - tierIndex(b.tier) || a.boss.localeCompare(b.boss))
}

/** Plain-language summary built from the unit's own data, so every page reads differently. */
export function unitSummary(u: Unit) {
  const p = pronouns(u)
  const place = placements(u)
  const best = place.filter((x) => x.tier === place[0]?.tier).slice(0, 3).map((x) => x.boss)
  const aoe = u.skills.filter((s) => s.aoe).length
  const effects = [...new Set(u.skills.flatMap((s) => s.effects.map((e) => e.label)))]

  const lead =
    u.kind === 'Titan'
      ? `${u.name} is ${article(u.rarity)} ${u.rarity} ${u.role ?? ''} Titan of the ${u.faction} in Invokers: Titan Legacy.`
      : `${u.name} is ${article(u.rarity)} ${u.rarity} ${u.element} ${u.class} Invoker from the ${u.faction} faction, carrying the ${u.soulSign}.`
  const tier = u.overall
    ? ` ${p.sub[0].toUpperCase()}${p.sub.slice(1)} ${p.sub === 'they' ? 'are' : 'is'} rated ${u.overall.tier} overall (scoring ${Math.round(u.overall.score)}/100 across ${u.overall.lists} boss tier lists)${best.length ? `, ranking highest (${place[0].tier}) against ${joinList(best)}` : ''}.`
    : ''
  const kit =
    ` ${p.pos[0].toUpperCase()}${p.pos.slice(1)} kit has ${aoe === 0 ? 'no' : aoe} area-of-effect skill${aoe === 1 ? '' : 's'}` +
    (effects.length ? ` and applies ${joinList(effects.slice(0, 5))}${effects.length > 5 ? ', among others' : ''}.` : '.')
  return lead + tier + kit
}

function faqs(u: Unit) {
  const place = placements(u)
  const out: { q: string; a: string }[] = [
    { q: `What rarity is ${u.name} in Invokers: Titan Legacy?`, a: `${u.name} is ${article(u.rarity)} ${u.rarity} ${u.kind}.` },
  ]
  if (u.kind === 'Invoker') {
    out.push({
      q: `What element and class is ${u.name}?`,
      a: `${u.name} is ${article(u.element ?? '')} ${u.element} ${u.class} from the ${u.faction} faction, with the ${u.soulSign}.`,
    })
  } else {
    out.push({ q: `Which faction does ${u.name} belong to?`, a: `${u.name} is a ${u.faction} Titan with the ${u.role} role.` })
  }
  if (place.length) {
    const top = place.slice(0, 3).map((x) => `${x.boss} (${x.tier})`)
    const low = place[place.length - 1]
    out.push({
      q: `Where is ${u.name} best?`,
      a: `${u.name} ranks highest against ${joinList(top)}${tierIndex(low.tier) > tierIndex(place[0].tier) ? ` and lowest against ${low.boss} (${low.tier})` : ''}.${u.overall ? ` Overall: ${u.overall.tier}.` : ''}`,
    })
  }
  const m = u.stats.max
  const hp = m.Health ?? m['Bonus HP']
  const atk = m.Attack ?? m['Bonus ATK']
  const def = m.Defense ?? m['Bonus DEF']
  if (hp && atk && def) {
    out.push({
      q: u.kind === 'Titan' ? `What bonuses does ${u.name} give at max level?` : `What are ${u.name}'s max level stats?`,
      a:
        u.kind === 'Titan'
          ? `At max level ${u.name} gives its bound Invoker ${hp} HP, ${atk} ATK and ${def} DEF${m["Bound Invoker's ATK"] ? `, plus ${m["Bound Invoker's ATK"]} ATK` : ''}.`
          : `At max level ${u.name} has ${hp} HP, ${atk} ATK and ${def} DEF.`,
    })
  }
  return out
}

function Chip({ label, icon, color }: { label: string; icon?: string | null; color?: string }) {
  return (
    <span className="inv-pill" style={color ? ({ '--pill': color } as React.CSSProperties) : undefined}>
      {icon && <img src={icon} alt="" />}
      {label}
    </span>
  )
}

export default function UnitPage({ unit: u }: { unit: Unit }) {
  const icons = getIcons()
  const place = placements(u)
  const path = unitPath(u.kind, u.slug)
  const kindList = u.kind === 'Titan' ? 'Titan Tier List' : 'Invoker Tier List'
  const faq = faqs(u)
  const statKeys = [...new Set([...Object.keys(u.stats.base), ...Object.keys(u.stats.max)])]
  const corner = u.kind === 'Titan' ? u.role : u.class

  const roster = getRoster()
  const similar = roster
    .filter((r) => r.kind === u.kind && r.slug !== u.slug && (u.kind === 'Titan' ? r.faction === u.faction : r.class === u.class && r.element === u.element))
    .sort((a, b) => (b.overall?.score ?? 0) - (a.overall?.score ?? 0))
    .slice(0, 8)
  const browse = u.kind === 'Titan'
    ? [{ label: `All ${u.faction} Titans`, q: `faction=${u.faction}` }, { label: `All ${u.role} Titans`, q: `role=${u.role}` }]
    : [
        { label: `All ${u.faction} Invokers`, q: `faction=${encodeURIComponent(u.faction)}` },
        { label: `All ${u.element} Invokers`, q: `element=${u.element}` },
        { label: `All ${u.class} Invokers`, q: `class=${encodeURIComponent(u.class ?? '')}` },
        { label: `All ${u.soulSign} Invokers`, q: `sign=${encodeURIComponent(u.soulSign ?? '')}` },
      ]

  const note = getUnitNote('invokers', u.slug)
  const hasTake = !!(note.take || note.p2w || note.isNew)

  return (
    <main className="inv-root">
      <JsonLd
        data={[
          breadcrumbLd([INV_CRUMB, [kindList, tierListPath(u.kind)], [u.name, path]]),
          faqLd(faq),
        ]}
      />
      <section className="inv-unit-hero" style={{ '--rarity': RARITY_COLORS[u.rarity] ?? '#888' } as React.CSSProperties}>
        <div className="container inv-unit-hero-inner">
          <div className="inv-unit-hero-text">
            <nav className="inv-crumbs" aria-label="Breadcrumb">
              <Link href="/games/invokers/guides">Invokers</Link> › <Link href={tierListPath(u.kind)}>{u.kind === 'Titan' ? 'Titans' : 'Invokers'}</Link> › <span>{u.name}</span>
            </nav>
            <h1>{u.name}</h1>
            <div className="inv-pills">
              <Chip label={u.rarity} color={RARITY_COLORS[u.rarity]} />
              {u.element && <Chip label={u.element} icon={icons[u.element]} />}
              {corner && <Chip label={corner} icon={icons[corner]} />}
              <Chip label={u.faction} icon={icons[u.faction]} />
              {u.soulSign && <Chip label={u.soulSign} icon={icons[u.soulSign]} />}
            </div>
            {u.overall && (
              <div className="inv-overall">
                <span className="inv-overall-tier" style={{ background: TIER_COLORS[u.overall.tier] }}>{u.overall.tier}</span>
                <span>
                  <strong>Overall {u.overall.tier}</strong> · {Math.round(u.overall.score)}/100
                  <small>Score averaged across {u.overall.lists} boss tier lists</small>
                </span>
              </div>
            )}
            <p className="inv-summary">{unitSummary(u)}</p>
          </div>
          <div className="inv-unit-art">
            <img src={u.fullArt} alt={`${u.name} full art`} />
          </div>
        </div>
      </section>

      <div className="container inv-unit-body">
        <nav className="inv-toc" aria-label="On this page">
          {hasTake && <a href="#take">Quantum&apos;s Take</a>}
          {place.length > 0 && <a href="#where">Where to use</a>}
          <a href="#skills">Skills</a>
          <a href="#stats">Stats</a>
          {u.tolerances.length > 0 && <a href="#tolerances">Tolerances</a>}
          {u.bio && <a href="#lore">Lore</a>}
          <a href="#faq">FAQ</a>
        </nav>

        {hasTake && <div id="take"><QuantumTake game="invokers" id={u.slug} /></div>}

        {place.length > 0 && (
          <section id="where" className="inv-card">
            <h2>Where to use {u.name}</h2>
            <p className="inv-muted">{u.name}&apos;s tier on each boss list, best first. Each one opens that boss&apos;s full tier list.</p>
            <div className="inv-where">
              {place.map((x) => (
                <Link key={x.id} href={tierListPath(u.kind, x.id)} className="inv-where-item">
                  <span className="inv-where-tier" style={{ background: TIER_COLORS[x.tier] ?? '#555' }}>{x.tier}</span>
                  {x.boss}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section id="skills" className="inv-card">
          <h2>{u.name} skills</h2>
          <SkillKit skills={u.skills} name={u.name} />
        </section>

        <section id="stats" className="inv-card">
          <h2>{u.kind === 'Titan' ? `${u.name} bound bonuses` : `${u.name} stats`}</h2>
          {u.kind === 'Titan' && <p className="inv-muted">What the Titan adds to the Invoker it is bound to.</p>}
          <table className="inv-table">
            <thead>
              <tr><th>Stat</th><th>Level 1</th><th>Max level</th></tr>
            </thead>
            <tbody>
              {statKeys.map((k) => (
                <tr key={k}><td>{k}</td><td>{u.stats.base[k] ?? '—'}</td><td>{u.stats.max[k] ?? '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        {u.tolerances.length > 0 && (
          <section id="tolerances" className="inv-card">
            <h2>Tolerances</h2>
            <p className="inv-muted">Resistance to these control effects, from level 1 to level {u.tolerances[0].byLevel.length}.</p>
            <table className="inv-table">
              <tbody>
                {u.tolerances.map((t) => (
                  <tr key={t.label}>
                    <td>{t.label}</td>
                    <td>{t.byLevel[0]} → {t.byLevel[t.byLevel.length - 1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {u.bio && (
          <section id="lore" className="inv-card">
            <h2>{u.name} lore</h2>
            <p className="inv-bio">{u.bio}</p>
          </section>
        )}

        <section id="faq" className="inv-card">
          <h2>Frequently asked questions</h2>
          {faq.map((f) => (
            <details key={f.q} className="inv-faq">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>

        <section className="inv-card">
          <h2>More {u.kind === 'Titan' ? 'Titans' : 'Invokers'}</h2>
          <div className="inv-browse">
            {browse.map((b) => (
              <Link key={b.label} href={`${tierListPath(u.kind)}?view=grid&${b.q}`}>{b.label}</Link>
            ))}
          </div>
          {similar.length > 0 && (
            <>
              <h3 className="inv-similar-title">
                {u.kind === 'Titan' ? `Other ${u.faction} Titans` : `Other ${u.element} ${u.class}s`}
              </h3>
              <div className="qtb-grid inv-tight">
                {similar.map((s) => (
                  <QTile key={s.slug} e={toTile(s, icons)} tier={s.overall?.tier} size="sm" />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
