'use client'

import { useState, type ReactNode } from 'react'

type PointRow = { item: string; value: number | null }
type PointTable = { label: string; rows: PointRow[] }
type RewardRound = { round: number; eyes: number; points: number }
type RewardTrack = { label: string; rounds: RewardRound[] }
type Day = {
  day: number
  title: string
  pointTable: string | null
  rewardTrack: string | null
  noResources: boolean
  usableItems: string[]
  tips: string[]
}
type ItemReward = { item: string; qty: number }
type RankRewards = { rank: string; rewards: ItemReward[] }
type Metropolis = {
  milestones: { label: string; description: string; thresholds: number[]; reward: ItemReward[] }
  leagueOutcomes: { label: string; description: string; outcomes: { name: string; rewards: ItemReward[] }[] }
  ranking: { label: string; description: string; tiers: RankRewards[] }
}
// Written by scripts/sync-dcdl-supreme-commander.mjs from the game files.
type GameData = {
  days: { day: number; name: string; victoryPoints: number; track: { points: number; rewards: ItemReward[] }[]; dailyRanking: RankRewards[] }[]
  eventRanking: RankRewards[]
  maneuvers: { day: number; maps: string[] } | null
  tournament: {
    rules: string[]
    minMembers: number
    pointsRequired: number
    groups: { id: string; name: string; icon: string | null; leagueRanks: { rank: string; memberRanks: RankRewards[] }[] }[]
  }
  icons: Record<string, string>
}
export type SupremeCommanderData = {
  intro: string
  reward: { name: string; icon: string }
  itemIcons?: Record<string, string>
  itemNotes?: Record<string, string>
  days: Day[]
  pointTables: Record<string, PointTable>
  rewardTracks: Record<string, RewardTrack>
  metropolis?: Metropolis
  game?: GameData
}

const fmt = (n: number) => n.toLocaleString('en-US')
// "Gotham or Metropolis"
const orList = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} or ${xs[xs.length - 1]}`)

// Encode only the path segments so spaces in filenames survive as %20.
const encodeIcon = (p: string) => p.split('/').map(encodeURIComponent).join('/')

// Item icons are assigned in the admin panel (data.itemIcons). Items without an
// assigned icon fall back to showing their text name.
function ItemLabel({ name, icon, note }: { name: string; icon?: string; note?: string }) {
  if (!icon) return <span className="sc-ptable-item">{name}</span>
  const label = note ? `${name} ${note}` : name
  return (
    <span className="sc-ptable-item sc-ptable-item--icon">
      <span className="sc-item-icon" tabIndex={0}>
        <img src={encodeIcon(icon)} alt={name} title={label} />
        <span className="sc-item-tip" role="tooltip">{label}</span>
      </span>
    </span>
  )
}

function EyeCount({ count, icon, name }: { count: number; icon: string; name: string }) {
  return (
    <span className="sc-eyes" title={`${count} ${name}${count === 1 ? '' : 's'}`}>
      <img src={icon} alt={name} />
      <span className="sc-eyes-x">×{count}</span>
    </span>
  )
}

function PointTableCard({ table, highlight, icons, notes }: { table: PointTable; highlight?: string[]; icons?: Record<string, string>; notes?: Record<string, string> }) {
  const usable = new Set(highlight ?? [])
  return (
    <div className="sc-ptable">
      <div className="sc-ptable-head">
        <span>{table.label}</span>
        <span className="sc-ptable-head-val">Points</span>
      </div>
      <ul className="sc-ptable-rows">
        {table.rows.map((r) => (
          <li key={r.item} className={usable.has(r.item) ? 'is-usable' : undefined}>
            <ItemLabel name={r.item} icon={icons?.[r.item]} note={notes?.[r.item]} />
            <span className={`sc-ptable-val${r.value == null ? ' sc-ptable-val--tbd' : ''}`}>
              {r.value == null ? 'TBD' : fmt(r.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RewardLadder({ track, reward }: { track: RewardTrack; reward: { name: string; icon: string } }) {
  return (
    <div className="sc-ladder">
      <div className="sc-ladder-head">{track.label}</div>
      <ol className="sc-ladder-rounds">
        {track.rounds.map((rd) => (
          <li key={rd.round} className="sc-round">
            <span className="sc-round-no">RD.{rd.round}</span>
            <EyeCount count={rd.eyes} icon={reward.icon} name={reward.name} />
            <span className="sc-round-pts">{fmt(rd.points)} pts</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function RewardPills({ rewards, icons }: { rewards: ItemReward[]; icons?: Record<string, string> }) {
  return (
    <div className="sc-reward-pills">
      {rewards.map((r, i) => {
        const icon = icons?.[r.item]
        return (
          <span key={i} className="sc-reward-pill">
            <span className="sc-reward-qty">{fmt(r.qty)}×</span>
            {icon ? (
              <span className="sc-item-icon sc-reward-pill-icon" tabIndex={0}>
                <img src={encodeIcon(icon)} alt={r.item} title={r.item} />
                <span className="sc-item-tip" role="tooltip">{r.item}</span>
              </span>
            ) : (
              <span>{r.item}</span>
            )}
          </span>
        )
      })}
    </div>
  )
}

// Long tables fold away behind a summary so the page stays scannable.
function Fold({ title, meta, children, accent = 'purple' }: { title: string; meta?: string; children: ReactNode; accent?: 'purple' | 'gold' }) {
  return (
    <details className={`sc-fold sc-fold--${accent}`}>
      <summary>
        <span className="sc-fold-title">{title}</span>
        {meta && <span className="sc-fold-meta">{meta}</span>}
        <span className="sc-fold-chevron" aria-hidden="true" />
      </summary>
      <div className="sc-fold-body">{children}</div>
    </details>
  )
}

function RankList({ tiers, icons, prefix = '#' }: { tiers: RankRewards[]; icons?: Record<string, string>; prefix?: string }) {
  return (
    <div className="sc-metro-ranks">
      {tiers.map((t) => (
        <div key={t.rank} className="sc-rank">
          <span className="sc-rank-badge">{prefix}{t.rank}</span>
          <RewardPills rewards={t.rewards} icons={icons} />
        </div>
      ))}
    </div>
  )
}

// Every step of a day's reward track; Magic Eye steps glow, rounds of 5 are marked.
function FullTrack({ steps, reward, icons }: { steps: { points: number; rewards: ItemReward[] }[]; reward: { name: string; icon: string }; icons?: Record<string, string> }) {
  return (
    <ol className="sc-steps">
      {steps.map((s, i) => {
        const eye = s.rewards.some((r) => r.item === reward.name)
        return (
          <li key={i} className={`sc-step${eye ? ' is-eye' : ''}${i % 5 === 0 ? ' is-round-start' : ''}`}>
            {i % 5 === 0 && <span className="sc-step-round">Round {i / 5 + 1}</span>}
            <span className="sc-step-no">{i + 1}</span>
            <span className="sc-step-pts">{fmt(s.points)}</span>
            <RewardPills rewards={s.rewards} icons={icons} />
          </li>
        )
      })}
    </ol>
  )
}

function MetropolisRewards({ metro, icons }: { metro: Metropolis; icons?: Record<string, string> }) {
  return (
    <div className="sc-metro">
      {/* Milestones */}
      <div className="sc-metro-card">
        <h3 className="sc-metro-title">{metro.milestones.label}</h3>
        <p className="sc-metro-desc">{metro.milestones.description}</p>
        <div className="sc-metro-milestones">
          {metro.milestones.thresholds.map((t) => (
            <span key={t} className="sc-milestone">{t}<small>battles</small></span>
          ))}
        </div>
        <div className="sc-metro-reward-label">Reward at each milestone</div>
        <RewardPills rewards={metro.milestones.reward} icons={icons} />
      </div>

      {/* League outcomes */}
      <div className="sc-metro-card">
        <h3 className="sc-metro-title">{metro.leagueOutcomes.label}</h3>
        <p className="sc-metro-desc">{metro.leagueOutcomes.description}</p>
        <div className="sc-metro-outcomes">
          {metro.leagueOutcomes.outcomes.map((o) => (
            <div key={o.name} className={`sc-outcome sc-outcome--${o.name.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
              <span className="sc-outcome-name">{o.name}</span>
              <RewardPills rewards={o.rewards} icons={icons} />
            </div>
          ))}
        </div>
      </div>

      {/* Ranking */}
      <div className="sc-metro-card">
        <h3 className="sc-metro-title">{metro.ranking.label}</h3>
        <p className="sc-metro-desc">{metro.ranking.description}</p>
        <RankList tiers={metro.ranking.tiers} icons={icons} />
      </div>
    </div>
  )
}

function VictoryPoints({ days, active }: { days: GameData['days']; active?: number }) {
  return (
    <ol className="sc-vp">
      {days.map((d) => (
        <li key={d.day} className={d.day === active ? 'is-active' : undefined}>
          <span className="sc-vp-day">Day {d.day}</span>
          <span className="sc-vp-val">{d.victoryPoints}</span>
          <span className="sc-vp-name">{d.name}</span>
        </li>
      ))}
    </ol>
  )
}

function Tournament({ t, icons }: { t: GameData['tournament']; icons?: Record<string, string> }) {
  const [groupId, setGroupId] = useState(t.groups[t.groups.length - 1]?.id)
  const group = t.groups.find((g) => g.id === groupId) ?? t.groups[0]
  if (!group) return null
  return (
    <div className="sc-tour">
      <div className="sc-tour-facts">
        <ul className="sc-tour-rules">
          {t.rules.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
        <div className="sc-tour-req">
          <div><span className="sc-tour-req-val">{fmt(t.pointsRequired)}</span><span className="sc-tour-req-label">personal points needed for rewards</span></div>
          <div><span className="sc-tour-req-val">{t.minMembers}+</span><span className="sc-tour-req-label">league members to take part</span></div>
        </div>
      </div>

      <div className="sc-tour-groups" role="tablist" aria-label="Tournament groups">
        {t.groups.map((g) => (
          <button
            key={g.id}
            role="tab"
            aria-selected={g.id === group.id}
            className={`sc-tour-group${g.id === group.id ? ' is-active' : ''}`}
            onClick={() => setGroupId(g.id)}
          >
            {g.icon && <img src={encodeIcon(g.icon)} alt="" />}
            <span>{g.name}</span>
          </button>
        ))}
      </div>

      <div className="sc-tour-ranks">
        {group.leagueRanks.map((lr) => (
          <div key={lr.rank} className="sc-metro-card sc-tour-card">
            <h3 className="sc-metro-title">League rank #{lr.rank}</h3>
            <p className="sc-metro-desc">Your rank inside your league:</p>
            <RankList tiers={lr.memberRanks} icons={icons} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SupremeCommanderView({ data }: { data: SupremeCommanderData }) {
  const [activeDay, setActiveDay] = useState(data.days[0]?.day ?? 1)
  const day = data.days.find((d) => d.day === activeDay) ?? data.days[0]
  const game = data.game
  const gameDay = game?.days.find((d) => d.day === day?.day)
  // Tyler's icons win; the game's fill the rest.
  const icons = { ...game?.icons, ...data.itemIcons }
  const maps = game?.maneuvers?.maps ?? []

  const pointTable = day?.pointTable ? data.pointTables[day.pointTable] : null
  const rewardTrack = day?.rewardTrack ? data.rewardTracks[day.rewardTrack] : null

  return (
    <section className="sc-section">
      <div className="container">
        {/* Overview */}
        <div className="sc-overview">
          <p className="sc-intro">{data.intro}</p>
          <div className="sc-reward-chip">
            <img src={data.reward.icon} alt={data.reward.name} />
            <div>
              <span className="sc-reward-label">Event Reward</span>
              <span className="sc-reward-name">{data.reward.name}</span>
            </div>
          </div>
        </div>

        {/* Day selector */}
        <div className="sc-days" role="tablist" aria-label="Supreme Commander days">
          {data.days.map((d) => (
            <button
              key={d.day}
              role="tab"
              aria-selected={d.day === activeDay}
              className={`sc-day-pill${d.day === activeDay ? ' is-active' : ''}${d.noResources ? ' is-special' : ''}`}
              onClick={() => setActiveDay(d.day)}
            >
              <span className="sc-day-pill-no">Day {d.day}</span>
              <span className="sc-day-pill-title">{d.title}</span>
            </button>
          ))}
        </div>

        {/* Selected day */}
        {day && (
          <div className="sc-day-panel">
            <article className="sc-strat">
              <header className="sc-strat-head">
                <span className="sc-strat-daynum" aria-hidden="true">{String(day.day).padStart(2, '0')}</span>
                <div>
                  <h2 className="sc-strat-title">{day.title}</h2>
                  <span className="sc-strat-sub">
                    {day.noResources ? 'No resources required' : `Day ${day.day} of ${data.days.length}`}
                    {gameDay && gameDay.name !== day.title && <> · In game: {gameDay.name}</>}
                  </span>
                </div>
                {day.noResources && <span className="sc-badge-free">No Spend</span>}
              </header>
              {(gameDay || (day.noResources && maps.length > 1)) && (
                <div className="sc-day-facts">
                  {gameDay && (
                    <span className="sc-day-fact">
                      <strong>{gameDay.victoryPoints}</strong> League Duel victory points for the league that wins today
                    </span>
                  )}
                  {day.noResources && maps.length > 1 && (
                    <span className="sc-day-fact">Map: <strong>{orList(maps)}</strong>, picked at random</span>
                  )}
                </div>
              )}
              <ul className="sc-tips">
                {day.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </article>

            <aside className="sc-rail">
              {pointTable ? (
                <div>
                  <PointTableCard table={pointTable} highlight={day.usableItems} icons={icons} notes={data.itemNotes} />
                  <p className="sc-usable-note">
                    {day.usableItems.length > 0 ? (
                      <><span className="sc-usable-dot" /> Glowing rows can be spent for points on Day {day.day}.</>
                    ) : (
                      <>Usable items for Day {day.day} are being finalized.</>
                    )}
                  </p>
                </div>
              ) : (
                <div className="sc-rail-empty">
                  <strong>No resource spending today.</strong>
                  <span>
                    Points come from combat on the Maneuvers map{maps.length > 1 ? ` (${orList(maps)}, picked at random)` : ''}, not from spending resources.
                  </span>
                </div>
              )}
              {rewardTrack && <RewardLadder track={rewardTrack} reward={data.reward} />}
            </aside>
          </div>
        )}

        {/* The selected day's full reward track + daily ranking */}
        {gameDay && (gameDay.track.length > 0 || gameDay.dailyRanking.length > 0) && (
          <div className="sc-day-extras">
            {gameDay.track.length > 0 && (
              <Fold title={`Day ${gameDay.day}: all ${gameDay.track.length} reward steps`} meta={`up to ${fmt(gameDay.track[gameDay.track.length - 1].points)} pts`}>
                <FullTrack steps={gameDay.track} reward={data.reward} icons={icons} />
              </Fold>
            )}
            {gameDay.dailyRanking.length > 0 && (
              <Fold title={`Day ${gameDay.day}: daily ranking rewards`} meta={`top ${gameDay.dailyRanking[gameDay.dailyRanking.length - 1].rank.split('–').pop()}`} accent="gold">
                <p className="sc-metro-desc">Paid on your rank for this day&apos;s points, against every player on your server.</p>
                <RankList tiers={gameDay.dailyRanking} icons={icons} />
              </Fold>
            )}
          </div>
        )}

        {day?.noResources && data.metropolis && <MetropolisRewards metro={data.metropolis} icons={icons} />}

        {/* Full reference */}
        <div className="sc-reference">
          <h2 className="sc-ref-title">Point Values Reference</h2>
          <p className="sc-ref-note">
            Every item&apos;s point value. Days 1–4 use the standard table; on the Final Day (Day 5) everything is worth roughly 33% less.
          </p>
          <div className="sc-ref-grid">
            {Object.entries(data.pointTables).map(([key, table]) => (
              <PointTableCard key={key} table={table} icons={icons} notes={data.itemNotes} />
            ))}
          </div>

          <h2 className="sc-ref-title" style={{ marginTop: '2.5rem' }}>Reward Tracks</h2>
          <p className="sc-ref-note">
            {data.reward.name}s are handed out at point thresholds. Days 3 &amp; 4 have higher thresholds — and bigger payouts.
          </p>
          <div className="sc-ref-grid">
            {Object.entries(data.rewardTracks).map(([key, track]) => (
              <RewardLadder key={key} track={track} reward={data.reward} />
            ))}
          </div>

          {game && game.eventRanking.length > 0 && (
            <>
              <h2 className="sc-ref-title" style={{ marginTop: '2.5rem' }}>Event Ranking Rewards</h2>
              <p className="sc-ref-note">
                Paid at the end of the event on your total points across all days, ranked against the whole server (top {game.eventRanking[game.eventRanking.length - 1].rank.split('–').pop()}).
              </p>
              <Fold title="Event ranking rewards" meta={`${game.eventRanking.length} brackets`} accent="gold">
                <RankList tiers={game.eventRanking} icons={icons} />
              </Fold>
            </>
          )}

          {game && (
            <>
              <h2 className="sc-ref-title" style={{ marginTop: '2.5rem' }}>League Duel</h2>
              <p className="sc-ref-note">
                Your league is matched against another league for the week. The league that wins each day earns that day&apos;s victory points; the later days are worth more.
              </p>
              <VictoryPoints days={game.days} active={day?.day} />
            </>
          )}

          {game && game.tournament.groups.length > 0 && (
            <>
              <h2 className="sc-ref-title" style={{ marginTop: '2.5rem' }}>Monthly Tournament</h2>
              <p className="sc-ref-note">
                League Duel wins also count toward a season-long Tournament. Leagues compete in one of {game.tournament.groups.length} groups, and rewards at the end of the season depend on your group, your league&apos;s rank in it, and your own rank inside your league.
              </p>
              <Tournament t={game.tournament} icons={icons} />
            </>
          )}
        </div>
      </div>
    </section>
  )
}
