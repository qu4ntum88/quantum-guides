'use client'

// The DC: Dark Legion account editor in the Members area (/members#account): one tab per part of
// an account. Saved through account-profile.ts (this browser + the member's site account) and read
// by every champion's Stat Calculator. Gear isn't here: it belongs to each champion, so it's set
// on that champion's Stat Calculator.

import { useMemo, useState, useSyncExternalStore } from 'react'
import {
  accountContributions, activeRoster, emptyProfile, globalLevel, maxedProfile, statChips, toggleTreeNode,
  type AccountData, type AccountProfile, type Mode,
} from '@/src/dcdl/lib/account-bonuses'
import { useAccountProfile, useAccountSync, type SyncState } from '@/src/dcdl/lib/account-profile'
import { useOwnedSkins } from '@/src/dcdl/lib/owned-skins'
import { STAR_TIERS, UNLOCK_COLOR } from '@/src/dcdl/lib/star-tiers'
import ResearchTree, { type TreeItem } from './ResearchTree'
import { AfterburnerPanel, ApokolipsPanel } from './HangarPanels'
import { Chips } from './ui'
import './account.css'

export type RosterChampion = { id: string; name: string; img: string | null; rarity: string; className: string; globalName: string | null }
export type BuilderSkin = { id: string; name: string; icon: string | null; owned: { stat: string; value: number }[] }

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'roster', label: 'Roster' },
  { id: 'research', label: 'Research' },
  { id: 'league', label: 'League Research' },
  { id: 'hangar', label: 'Hangar' },
  { id: 'extras', label: 'VIP & Skins' },
] as const
type Tab = (typeof TABS)[number]['id']
const CLASSES = ['Assassin', 'Warrior', 'Guardian', 'Supporter', 'Magical', 'Intimidator', 'Firepower']

/** Sub-tab from the hash: #account/hangar → hangar. */
function subscribeHash(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
const readTab = () => window.location.hash.replace(/^#account\/?/, '')

function starText(star: number) {
  if (!star) return 'Unlocked'
  const tier = STAR_TIERS[Math.floor((star - 1) / 5)]
  return `${((star - 1) % 5) + 1}★ ${tier?.name ?? ''}`
}
const starColor = (star: number) => (star ? STAR_TIERS[Math.floor((star - 1) / 5)]?.color ?? UNLOCK_COLOR : UNLOCK_COLOR)

function StarSelect({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <select className="acct-star" value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} style={{ '--tier': starColor(value) } as React.CSSProperties}>
      {Array.from({ length: 26 }, (_, s) => <option key={s} value={s}>{starText(s)}</option>)}
    </select>
  )
}

function SyncBadge({ state }: { state: SyncState }) {
  const text = {
    local: 'Saved in this browser.',
    loading: 'Loading your saved account…',
    saving: 'Saving…',
    saved: 'Saved to your Quantum Game Guides account.',
    error: 'Couldn’t reach the site; your changes are kept in this browser and will save next time.',
  }[state]
  return <p className={`acct-sync is-${state}`} role="status">{text}</p>
}

export default function AccountBuilder({ data, champions, skins }: { data: AccountData; champions: RosterChampion[]; skins: BuilderSkin[] }) {
  const { profile, update, replace, hydrated } = useAccountProfile()
  const sync = useAccountSync()
  const hash = useSyncExternalStore(subscribeHash, readTab, () => '')
  const tab: Tab = TABS.some((t) => t.id === hash) ? (hash as Tab) : 'overview'
  const go = (t: Tab) => {
    try { history.replaceState(null, '', `#account/${t}`) } catch {}
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }
  const owned = Object.keys(profile.roster).length

  return (
    <div className="acct acct-app">
      <div className="acct-bar">
        <SyncBadge state={hydrated ? sync : 'loading'} />
        <div className="acct-bar__actions">
          <button type="button" onClick={() => { if (confirm('Fill every section with the maximum? This replaces your current account (gear set on champion pages is kept).')) replace({ ...maxedProfile(data), champGear: profile.champGear }) }}>Fill with a maxed account</button>
          <button type="button" className="is-danger" onClick={() => { if (confirm('Clear your whole account? Gear set on champion pages is kept.')) replace({ ...emptyProfile(), champGear: profile.champGear }) }}>Clear all</button>
        </div>
      </div>

      <nav className="acct-tabs" aria-label="Account sections">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? 'is-active' : ''} aria-current={tab === t.id ? 'page' : undefined} onClick={() => go(t.id)}>
            {t.label}
            {t.id === 'roster' && owned > 0 && <span className="acct-tabs__n">{owned}</span>}
          </button>
        ))}
      </nav>

      {tab === 'overview' && <Overview data={data} profile={profile} champions={champions} go={go} />}
      {tab === 'roster' && <Roster data={data} profile={profile} update={update} champions={champions} />}
      {tab === 'research' && <Research data={data} profile={profile} update={update} />}
      {tab === 'league' && <League data={data} profile={profile} update={update} />}
      {tab === 'hangar' && <Hangar data={data} profile={profile} update={update} />}
      {tab === 'extras' && <Extras data={data} profile={profile} update={update} skins={skins} />}
    </div>
  )
}

type SectionProps = { data: AccountData; profile: AccountProfile; update: (fn: (p: AccountProfile) => AccountProfile) => void }

// ---------------- Overview ----------------
function Overview({ data, profile, champions, go }: { data: AccountData; profile: AccountProfile; champions: RosterChampion[]; go: (t: Tab) => void }) {
  const firstOwned = champions.find((c) => profile.roster[c.id] != null)?.id
  const [pick, setPick] = useState<string>('')
  const [mode, setMode] = useState<Mode>('normal')
  const champ = pick || firstOwned || champions[0]?.id || ''
  const ship = profile.mainShip != null && profile.ships[profile.mainShip] != null ? profile.mainShip : null
  const list = useMemo(() => (champ ? accountContributions(data, profile, { championId: champ, mode, ship }) : []), [data, profile, champ, mode, ship])
  const c = champions.find((x) => x.id === champ)
  const steps = [
    { tab: 'roster' as Tab, done: Object.keys(profile.roster).length > 0, text: 'Mark the champions you own and their stars (Global Skills).' },
    { tab: 'research' as Tab, done: Object.keys(profile.research).length > 0, text: 'Mark the research you’ve finished.' },
    { tab: 'league' as Tab, done: Object.keys(profile.league).length > 0, text: 'Mark your league’s research.' },
    { tab: 'hangar' as Tab, done: profile.apokolips > 0, text: 'Copy your Apokolips, Afterburners and ships.' },
    { tab: 'extras' as Tab, done: profile.vip > 0 || profile.rooms.length > 0, text: 'Pick your VIP level and skins.' },
  ]
  return (
    <section className="acct-section" aria-labelledby="acct-ov-h">
      <h2 id="acct-ov-h">What your account adds</h2>
      <ol className="acct-steps">
        {steps.map((s) => (
          <li key={s.tab} className={s.done ? 'is-done' : ''}>
            <button type="button" onClick={() => go(s.tab)}>{s.text}</button>
          </li>
        ))}
      </ol>
      <p className="acct-muted">Gear is set per champion, on each champion&apos;s Stat Calculator.</p>
      <div className="acct-preview">
        <div className="acct-preview__pick">
          <label>
            <span className="acct-label">Preview for</span>
            <select value={champ} onChange={(e) => setPick(e.target.value)}>
              {champions.map((x) => <option key={x.id} value={x.id}>{x.name}{profile.roster[x.id] != null ? '' : ' (not owned)'}</option>)}
            </select>
          </label>
          <label>
            <span className="acct-label">Mode</span>
            <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              <option value="normal">Any mode</option>
              {Object.entries(data.modes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          {c && <a className="acct-link" href={`/games/dc-dark-legion/heros/${c.id}#cgd-stats`}>Open {c.name.split(' (')[0]}&apos;s Stat Calculator →</a>}
        </div>
        {list.length ? (
          <ul className="acct-sources">
            {list.map((x) => (
              <li key={x.key}>
                <span className="acct-sources__name">{x.source}{x.detail && <em> · {x.detail}</em>}</span>
                <Chips list={statChips(data, x.stats)} />
                {x.note && <p className="acct-muted">In battle: {x.note}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="acct-muted">Nothing set yet. Start with your roster, or fill the account with the maximum to see the ceiling.</p>
        )}
      </div>
    </section>
  )
}

// ---------------- Roster ----------------
function Roster({ data, profile, update, champions }: SectionProps & { champions: RosterChampion[] }) {
  const [q, setQ] = useState('')
  const [show, setShow] = useState<'all' | 'owned' | 'missing'>('all')
  const [cls, setCls] = useState('')
  const active = activeRoster(data, profile.roster)
  const shown = champions.filter((c) => {
    const owned = profile.roster[c.id] != null
    if (show === 'owned' && !owned) return false
    if (show === 'missing' && owned) return false
    if (cls && data.champions[c.id]?.class !== cls) return false
    return !q || c.name.toLowerCase().includes(q.toLowerCase())
  })
  const toggle = (id: string) => update((p) => {
    const roster = { ...p.roster }
    if (roster[id] != null) delete roster[id]
    else roster[id] = 0
    return { ...p, roster }
  })
  const setStars = (id: string, s: number) => update((p) => ({ ...p, roster: { ...p.roster, [id]: s } }))
  return (
    <section className="acct-section" aria-labelledby="acct-roster-h">
      <div className="acct-section__head">
        <h2 id="acct-roster-h">Roster</h2>
        <span className="acct-actions">
          <button type="button" onClick={() => update((p) => ({ ...p, roster: Object.fromEntries(champions.map((c) => [c.id, p.roster[c.id] ?? 25])) }))}>Own all</button>
          <button type="button" onClick={() => update((p) => ({ ...p, roster: {} }))}>Clear</button>
        </span>
      </div>
      <p className="acct-lead">
        Tap a champion you own, then set its stars. Its Global Skill counts for every champion it covers, levelling up at
        3★ White, 3★ Blue, 3★ Purple, 3★ Yellow and 3★ Red. A Mythic+ version replaces the champion it was upgraded from.
      </p>
      <div className="acct-filters">
        <input type="search" placeholder="Search champions" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search champions" />
        <select value={show} onChange={(e) => setShow(e.target.value as typeof show)} aria-label="Show">
          <option value="all">All champions</option>
          <option value="owned">Owned</option>
          <option value="missing">Not owned</option>
        </select>
        <select value={cls} onChange={(e) => setCls(e.target.value)} aria-label="Class">
          <option value="">Every class</option>
          {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="acct-roster">
        {shown.map((c) => {
          const stars = profile.roster[c.id]
          const owned = stars != null
          const ch = data.champions[c.id]
          const lv = ch ? globalLevel(ch, active[c.id]) : 0
          const replaced = owned && active[c.id] == null
          return (
            <div key={c.id} className={'acct-hero' + (owned ? ' is-owned' : '')}>
              <button type="button" className="acct-hero__face" aria-pressed={owned} onClick={() => toggle(c.id)} title={owned ? 'Owned: tap to remove' : 'Tap if you own this champion'}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.img ? <img src={c.img} alt="" loading="lazy" /> : <span />}
                <span className="acct-hero__name">{c.name}</span>
              </button>
              {owned && (
                <div className="acct-hero__ctl">
                  <StarSelect value={stars} onChange={(s) => setStars(c.id, s)} label={`${c.name} stars`} />
                  {ch?.globalSkill && (
                    <span className="acct-hero__gs" title={c.globalName ?? 'Global Skill'}>
                      {replaced ? 'GS from Mythic+' : lv ? `GS Lv ${lv}/${ch.globalSkill.levels.length}` : 'GS at 3★ White'}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {!shown.length && <p className="acct-muted">No champions match.</p>}
    </section>
  )
}

// ---------------- Research trees ----------------
function Research({ data, profile, update }: SectionProps) {
  const items: TreeItem[] = data.research.map((n) => ({
    ...n, top: n.levels.length,
    value: statChips(data, [[n.stat, n.levels[n.levels.length - 1]]]).join(', '),
    tag: n.class === 'All' ? 'All champions' : n.class,
  }))
  const done = items.filter((n) => (profile.research[n.id] ?? 0) > 0).length
  return (
    <section className="acct-section" aria-labelledby="acct-res-h">
      <div className="acct-section__head">
        <h2 id="acct-res-h">Research <span className="acct-count">{done} / {items.length}</span></h2>
        <span className="acct-actions">
          <button type="button" onClick={() => update((p) => ({ ...p, research: Object.fromEntries(items.map((n) => [n.id, n.top])) }))}>All researched</button>
          <button type="button" onClick={() => update((p) => ({ ...p, research: {} }))}>Clear</button>
        </span>
      </div>
      <p className="acct-lead">The Combat tree of your Research Lab, left to right as in game. Tap each node you&apos;ve finished; a node opens once the ones before it are done. Class nodes only count for that class.</p>
      <ResearchTree nodes={items} picked={profile.research} label="Personal research, Combat tree" onToggle={(n) => update((p) => ({ ...p, research: toggleTreeNode(items, p.research, n, n.top) }))} />
    </section>
  )
}

function League({ data, profile, update }: SectionProps) {
  const items: TreeItem[] = data.league.map((n) => ({
    ...n, top: n.stats[0]?.levels.length ?? 1,
    value: statChips(data, n.stats.map((s) => [s.stat, s.levels[s.levels.length - 1]])).join(', '),
    tag: `${n.class === 'All' ? 'All' : n.class} · ${n.modes.map((m) => ({ Gve: 'DtDL', Gvg: 'GC', AllianceBoss: 'Rift' })[m] ?? m).join('/')}`,
  }))
  const done = items.filter((n) => (profile.league[n.id] ?? 0) > 0).length
  return (
    <section className="acct-section" aria-labelledby="acct-league-h">
      <div className="acct-section__head">
        <h2 id="acct-league-h">League Research <span className="acct-count">{done} / {items.length}</span></h2>
        <span className="acct-actions">
          <button type="button" onClick={() => update((p) => ({ ...p, league: Object.fromEntries(items.map((n) => [n.id, n.top])) }))}>All researched</button>
          <button type="button" onClick={() => update((p) => ({ ...p, league: {} }))}>Clear</button>
        </span>
      </div>
      <p className="acct-lead">
        Your league&apos;s Combat tree. These bonuses only count in the modes on each node: DtDL = Defeat the Dark Legion, GC = Guardian Challenge,
        Rift = Umbral Rift. The Stat Calculator adds them when you pick that mode.
      </p>
      <ResearchTree nodes={items} picked={profile.league} label="League research, Combat tree" onToggle={(n) => update((p) => ({ ...p, league: toggleTreeNode(items, p.league, n, n.top) }))} />
    </section>
  )
}

// ---------------- Hangar ----------------
function Hangar({ data, profile, update }: SectionProps) {
  const main = data.ships.find((s) => s.id === profile.mainShip) ?? data.ships.find((s) => profile.ships[s.id] != null) ?? data.ships[data.ships.length - 1]
  return (
    <section className="acct-section" aria-labelledby="acct-hangar-h">
      <h2 id="acct-hangar-h">Hangar</h2>
      <ApokolipsPanel data={data} profile={profile} update={update} />
      <AfterburnerPanel data={data} profile={profile} update={update} shipIcon={main?.icon ?? null} />
      <div className="acct-card acct-card--wide">
        <h3>Ships</h3>
        <p className="acct-muted">Tick the ships you have and pick the one your main squads fly: its star bonus is added in the Stat Calculator. Ship skills trigger in battle and are listed only.</p>
        <ul className="acct-ships">
          {data.ships.map((s) => {
            const star = profile.ships[s.id]
            const owned = star != null
            const st = s.stars[Math.max(0, Math.min((star ?? 1) - 1, s.stars.length - 1))]
            return (
              <li key={s.id} className={owned ? 'is-owned' : ''}>
                <button type="button" className="acct-ships__face" aria-pressed={owned} onClick={() => update((p) => {
                  const ships = { ...p.ships }
                  if (owned) delete ships[s.id]
                  else ships[s.id] = 1
                  const mainShip = owned ? (p.mainShip === s.id ? null : p.mainShip) : p.mainShip ?? s.id
                  return { ...p, ships, mainShip }
                })}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {s.icon && <img src={s.icon} alt="" loading="lazy" />}
                  <span>{s.name}<em>{s.quality}</em></span>
                </button>
                <div className="acct-ships__info">
                  <Chips list={statChips(data, st.stats)} />
                  {st.skill && <p className="acct-muted"><strong>{st.skill.name}:</strong> {st.skill.text}</p>}
                  {owned && (
                    <div className="acct-ships__ctl">
                      {s.stars.length > 1 && (
                        <select value={star} onChange={(e) => update((p) => ({ ...p, ships: { ...p.ships, [s.id]: Number(e.target.value) } }))} aria-label={`${s.name} star`}>
                          {s.stars.map((_, i) => <option key={i} value={i + 1}>{i + 1}★</option>)}
                        </select>
                      )}
                      <label className="acct-radio">
                        <input type="radio" name="main-ship" checked={profile.mainShip === s.id} onChange={() => update((p) => ({ ...p, mainShip: s.id }))} /> Main ship
                      </label>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

// ---------------- VIP + skins ----------------
function Extras({ data, profile, update, skins }: SectionProps & { skins: BuilderSkin[] }) {
  const vipRow = [...data.vip].reverse().find((v) => v.level <= profile.vip && v.stats.length)
  const maxVip = data.vip[data.vip.length - 1]?.level ?? 0
  const { owned, equipped, toggle, equip } = useOwnedSkins()
  return (
    <section className="acct-section" aria-labelledby="acct-extra-h">
      <h2 id="acct-extra-h">VIP &amp; Skins</h2>
      <div className="acct-cards">
        <div className="acct-card">
          <h3>VIP</h3>
          <p className="acct-muted">Champion stat bonuses start at VIP 21; each level replaces the one before.</p>
          <select value={profile.vip} onChange={(e) => update((p) => ({ ...p, vip: Number(e.target.value) }))} aria-label="VIP level">
            {Array.from({ length: maxVip + 1 }, (_, i) => <option key={i} value={i}>{i ? `VIP ${i}` : 'No VIP'}</option>)}
          </select>
          <div className="acct-vip"><Chips list={vipRow ? statChips(data, vipRow.stats) : []} empty="No champion stats at this level" /></div>
          <ul className="acct-viplist">
            {data.vip.filter((v) => v.stats.length).map((v) => (
              <li key={v.level} className={v.level === profile.vip ? 'is-current' : ''}><strong>VIP {v.level}</strong> <Chips list={statChips(data, v.stats)} /></li>
            ))}
          </ul>
        </div>
        <div className="acct-card">
          <h3>Room skins</h3>
          <p className="acct-muted">Only these room skins give stats, and just for owning them.</p>
          <ul className="acct-rooms">
            {data.rooms.map((r) => {
              const on = profile.rooms.includes(r.id)
              return (
                <li key={r.id}>
                  <button type="button" aria-pressed={on} className={on ? 'is-on' : ''} onClick={() => update((p) => ({ ...p, rooms: on ? p.rooms.filter((x) => x !== r.id) : [...p.rooms, r.id] }))}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {r.icon && <img src={r.icon} alt="" loading="lazy" />}
                    <span><strong>{r.name}</strong><em>{r.room}</em></span>
                  </button>
                  <Chips list={statChips(data, r.stats)} />
                </li>
              )
            })}
          </ul>
        </div>
        <div className="acct-card">
          <h3>Base skins</h3>
          <p className="acct-muted">The same picks as the <a href="/games/dc-dark-legion/base-skins">Base Skins</a> page.</p>
          <div className="acct-skins">
            {skins.map((s) => (
              <button key={s.id} type="button" aria-pressed={owned.has(s.id)} className={owned.has(s.id) ? 'is-on' : ''} onClick={() => toggle(s.id)} title={s.owned.map((b) => `${b.stat} +${b.value}%`).join(', ')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {s.icon ? <img src={s.icon} alt="" loading="lazy" /> : null}
                <span>{s.name}</span>
              </button>
            ))}
          </div>
          <label className="acct-equip">
            <span className="acct-label">Equipped</span>
            <select value={equipped ?? ''} onChange={(e) => equip(e.target.value || null)}>
              <option value="">None</option>
              {skins.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        </div>
      </div>
    </section>
  )
}
