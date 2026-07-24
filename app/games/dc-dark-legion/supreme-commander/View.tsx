'use client'

import { useState } from 'react'

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
type Metropolis = {
  milestones: { label: string; description: string; thresholds: number[]; reward: ItemReward[] }
  leagueOutcomes: { label: string; description: string; outcomes: { name: string; rewards: ItemReward[] }[] }
  ranking: { label: string; description: string; tiers: { rank: string; rewards: ItemReward[] }[] }
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
}

const fmt = (n: number) => n.toLocaleString('en-US')

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
        <div className="sc-metro-ranks">
          {metro.ranking.tiers.map((t) => (
            <div key={t.rank} className="sc-rank">
              <span className="sc-rank-badge">#{t.rank}</span>
              <RewardPills rewards={t.rewards} icons={icons} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SupremeCommanderView({ data }: { data: SupremeCommanderData }) {
  const [activeDay, setActiveDay] = useState(data.days[0]?.day ?? 1)
  const day = data.days.find((d) => d.day === activeDay) ?? data.days[0]

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
                    {day.noResources ? 'No resources required' : `Day ${day.day} of 6`}
                  </span>
                </div>
                {day.noResources && <span className="sc-badge-free">No Spend</span>}
              </header>
              <ul className="sc-tips">
                {day.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </article>

            <aside className="sc-rail">
              {pointTable ? (
                <div>
                  <PointTableCard table={pointTable} highlight={day.usableItems} icons={data.itemIcons} notes={data.itemNotes} />
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
                  <span>Points come from combat on the Metropolis map, not from spending resources.</span>
                </div>
              )}
              {rewardTrack && <RewardLadder track={rewardTrack} reward={data.reward} />}
            </aside>
          </div>
        )}

        {day?.noResources && data.metropolis && <MetropolisRewards metro={data.metropolis} icons={data.itemIcons} />}

        {/* Full reference */}
        <div className="sc-reference">
          <h2 className="sc-ref-title">Point Values Reference</h2>
          <p className="sc-ref-note">
            Every item&apos;s point value. Days 1–4 use the standard table; on the Final Day (Day 5) everything is worth roughly 33% less.
          </p>
          <div className="sc-ref-grid">
            {Object.entries(data.pointTables).map(([key, table]) => (
              <PointTableCard key={key} table={table} icons={data.itemIcons} notes={data.itemNotes} />
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
        </div>
      </div>
    </section>
  )
}
