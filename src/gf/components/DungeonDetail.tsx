'use client'

import { useState } from 'react'
import Link from 'next/link'
import { lookupEffect } from '../lib/statusEffects'
import { StatusEffectToken } from './StatusEffectToken'

// ── Types ──────────────────────────────────────────────────────────────────────

type Skill = {
  type: string
  name: string
  icon_url?: string | null
  description: string
  cooldown?: number | null
  divinity_cost?: number | null
}

type MinionSkill = Skill & { divinity_cost?: number | null; cooldown?: number | null }

type Minion = {
  name: string
  skills: MinionSkill[]
}

type BossData = {
  id: number | null
  name: string
  portrait_url: string | null
  skills?: Skill[]
  phases?: { label: string; skills: Skill[] }[]
  minions: Minion[]
}

type DungeonMeta = {
  id: number
  name: string
  slug: string
  type: 'ascension_dungeon' | 'equipment_dungeon'
  affinity: string | null
  stage_count: number
  image_url: string
  youtube_id?: string | null
  boss: BossData
}

type HeroSlot = {
  position: number
  enemy_level: number
  star_rank: number
  hero: { id: number; name: string; portrait_url: string | null; rarity: string }
}

type Wave = {
  id: number
  wave_number: number
  is_boss_wave: boolean
  name: string | null
  slots: HeroSlot[]
}

type GearDetail = {
  sets?: string[]
  rarities?: { name: string; weight_pct: number }[]
  qualities?: { name: string; weight_pct: number }[]
}

type Stage = {
  id: number
  stage_number: number
  energy_cost: number
  is_boss_stage: boolean
  boss: { id: number; name: string; portrait_url: string | null } | null
  wave_count: number
  waves: Wave[]
  reward_summary: {
    drops: { type: string; amount?: number; chance_pct: number; gear_detail?: GearDetail }[]
    guaranteed: { type: string; amount?: number }[]
  }
}

type RewardIcon = { name: string; icon_url: string | null }

type DungeonRecEnriched = {
  hero_id: string
  writeup: string
  hero_name: string
  portrait_url: string | null
  rarity: string | null
}

// ── Rich text parser ───────────────────────────────────────────────────────────

function RichSkillText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/g)
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[([^\]]+)\]$/)
        if (m) {
          const effect = lookupEffect(m[1])
          if (effect) return <StatusEffectToken key={i} effect={effect} />
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

// ── Constants ──────────────────────────────────────────────────────────────────

const AFFINITY_COLORS: Record<string, string> = {
  strength: '#ef4444',
  cunning: '#22c55e',
  wisdom: '#3b82f6',
  eternal: '#a855f7',
}

const SKILL_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Basic:   { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af' },
  Core:    { bg: 'rgba(59,130,246,0.18)',  text: '#60a5fa' },
  Ultimate:{ bg: 'rgba(251,191,36,0.18)',  text: '#fbbf24' },
  Passive: { bg: 'rgba(168,85,247,0.18)',  text: '#c084fc' },
}

const RARITY_COLORS: Record<string, string> = {
  Legendary: '#f59e0b',
  Epic:      '#a855f7',
  Rare:      '#3b82f6',
  Uncommon:  '#22c55e',
  Common:    '#6b7280',
  None:      '#4b5563',
}

// ── Main component ──────────────────────────────────────────────────────────────

export default function DungeonDetail({
  dungeon,
  stages,
  reward_icons,
  recommendations,
}: {
  dungeon: DungeonMeta
  stages: Stage[]
  reward_icons: Record<string, RewardIcon>
  recommendations: DungeonRecEnriched[]
}) {
  const [tab, setTab] = useState<'overview' | 'stages' | 'champions'>('overview')
  const accentColor = dungeon.affinity ? AFFINITY_COLORS[dungeon.affinity] : '#a855f7'

  return (
    <>
      {/* Hero banner */}
      <section className="gh-hero" style={{ minHeight: '220px' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${dungeon.image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          opacity: 0.35,
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <p className="gh-overline" style={{ color: accentColor }}>
            {dungeon.type === 'ascension_dungeon' ? 'Ascension Dungeon' : 'Equipment Dungeon'}
            {dungeon.affinity ? ` · ${dungeon.affinity.charAt(0).toUpperCase() + dungeon.affinity.slice(1)}` : ''}
          </p>
          <h1 className="gh-hero-title">{dungeon.name}</h1>
          <p className="gh-hero-sub">
            Boss: <strong style={{ color: '#fff' }}>{dungeon.boss.name}</strong>
            &nbsp;·&nbsp;{dungeon.stage_count} stages
          </p>
          <div className="gh-hero-divider" />
          <div className="gh-hero-back">
            <Link href="/games/godforge/dungeons" className="btn" style={{ fontSize: '0.78rem', padding: '0.45rem 1rem' }}>← All Dungeons</Link>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0f0f0f' }}>
        <div className="container" style={{ display: 'flex', gap: 0 }}>
          {(['overview', 'stages', 'champions'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${tab === t ? accentColor : 'transparent'}`,
                color: tab === t ? '#fff' : '#888',
                cursor: 'pointer',
                fontFamily: 'Unbounded, sans-serif',
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '0.9rem 1.25rem',
                transition: 'color 0.15s',
              }}
            >
              {t === 'overview' ? 'Boss Overview' : t === 'stages' ? 'Stages' : 'Champions'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="container" style={{ padding: '2rem 1rem 3rem' }}>
        {tab === 'overview' ? (
          <BossOverview boss={dungeon.boss} accentColor={accentColor} youtubeId={dungeon.youtube_id} />
        ) : tab === 'stages' ? (
          <StagesView stages={stages} reward_icons={reward_icons} bossName={dungeon.boss.name} />
        ) : (
          <ChampionsTab recs={recommendations} accentColor={accentColor} />
        )}
      </div>
    </>
  )
}

// ── Boss Overview ──────────────────────────────────────────────────────────────

function BossOverview({ boss, accentColor, youtubeId }: { boss: BossData; accentColor: string; youtubeId?: string | null }) {
  const hasData = (boss.skills && boss.skills.length > 0) || (boss.phases && boss.phases.length > 0)

  if (!hasData) {
    return (
      <div style={{ padding: '3rem 0', textAlign: 'center', color: '#666' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Boss data coming soon</p>
        <p style={{ fontSize: '0.85rem' }}>Check back after the dungeon launches in-game.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '860px' }}>
      {youtubeId && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Unbounded, sans-serif', marginBottom: '0.75rem' }}>
            Video Guide
          </h3>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title="Video Guide"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        </div>
      )}

      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem', borderBottom: `1px solid ${accentColor}40`, paddingBottom: '0.6rem' }}>
        {boss.name}
      </h2>

      {/* Flat skills (no phases) */}
      {boss.skills && boss.skills.length > 0 && (
        <SkillList skills={boss.skills} />
      )}

      {/* Phased bosses */}
      {boss.phases && boss.phases.map(phase => (
        <div key={phase.label} style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: accentColor, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Unbounded, sans-serif', marginBottom: '1rem' }}>
            {phase.label}
          </h3>
          <SkillList skills={phase.skills} />
        </div>
      ))}

      {/* Minions */}
      {boss.minions && boss.minions.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
            Minions
          </h3>
          {boss.minions.map(minion => (
            <div key={minion.name} style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#ccc', fontWeight: 600, marginBottom: '0.75rem' }}>{minion.name}</h4>
              <SkillList skills={minion.skills} compact />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SkillList({ skills, compact = false }: { skills: Skill[]; compact?: boolean }) {
  const ordered = ['Basic', 'Core', 'Ultimate', 'Passive']
  const sorted = [...skills].sort((a, b) => {
    const ia = ordered.indexOf(a.type)
    const ib = ordered.indexOf(b.type)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '0.6rem' : '0.75rem' }}>
      {sorted.map((skill, i) => {
        const colors = SKILL_TYPE_COLORS[skill.type] ?? { bg: 'rgba(255,255,255,0.06)', text: '#aaa' }
        return (
          <div
            key={i}
            style={{
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              padding: compact ? '0.65rem 0.9rem' : '0.9rem 1.1rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            {/* Left column — fixed width so all cards align identically */}
            <div style={{
              flexShrink: 0,
              width: compact ? '60px' : '76px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
            }}>
              {skill.icon_url ? (
                <>
                  <img
                    src={skill.icon_url}
                    alt={`${skill.type} icon`}
                    style={{
                      width: compact ? '48px' : '62px',
                      height: compact ? '48px' : '62px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: `1px solid ${colors.text}50`,
                    }}
                  />
                  <span style={{
                    fontSize: '0.55rem',
                    fontWeight: 700,
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    fontFamily: 'Unbounded, sans-serif',
                    color: colors.text,
                    textAlign: 'center',
                  }}>
                    {skill.type}
                  </span>
                </>
              ) : (
                <span style={{
                  width: '100%',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  fontFamily: 'Unbounded, sans-serif',
                  background: colors.bg,
                  color: colors.text,
                  padding: '0.25rem 0.4rem',
                  borderRadius: '4px',
                  textAlign: 'center',
                }}>
                  {skill.type}
                </span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 600, color: '#e5e7eb', fontSize: compact ? '0.88rem' : '0.95rem' }}>
                  {skill.name}
                </span>
                {skill.cooldown != null && (
                  <span style={{ fontSize: '0.72rem', color: '#60a5fa', background: 'rgba(59,130,246,0.1)', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                    {skill.cooldown}T cooldown
                  </span>
                )}
                {skill.divinity_cost != null && (
                  <span style={{ fontSize: '0.72rem', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                    {skill.divinity_cost.toLocaleString()} Divinity
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af', lineHeight: 1.65 }}>
                <RichSkillText text={skill.description} />
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Stages View ────────────────────────────────────────────────────────────────

function StagesView({
  stages,
  reward_icons,
  bossName,
}: {
  stages: Stage[]
  reward_icons: Record<string, RewardIcon>
  bossName: string
}) {
  const [expanded, setExpanded] = useState<number | null>(null)

  if (stages.length === 0) {
    return (
      <div style={{ padding: '3rem 0', textAlign: 'center', color: '#666' }}>
        <p>Stage data not yet available.</p>
      </div>
    )
  }

  // Collect ordered union of all guaranteed reward types across every stage
  const allRewardTypes: string[] = []
  for (const stage of stages) {
    for (const g of stage.reward_summary?.guaranteed ?? []) {
      if (g.amount != null && !allRewardTypes.includes(g.type)) {
        allRewardTypes.push(g.type)
      }
    }
  }

  return (
    <div style={{ maxWidth: '960px' }}>
      <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Click any stage to see the full wave compositions and reward details.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {stages.map(stage => (
          <StageRow
            key={stage.id}
            stage={stage}
            reward_icons={reward_icons}
            bossName={bossName}
            allRewardTypes={allRewardTypes}
            isExpanded={expanded === stage.stage_number}
            onToggle={() => setExpanded(prev => prev === stage.stage_number ? null : stage.stage_number)}
          />
        ))}
      </div>
    </div>
  )
}

function StageRow({
  stage,
  reward_icons,
  bossName,
  allRewardTypes,
  isExpanded,
  onToggle,
}: {
  stage: Stage
  reward_icons: Record<string, RewardIcon>
  bossName: string
  allRewardTypes: string[]
  isExpanded: boolean
  onToggle: () => void
}) {
  const guaranteed = stage.reward_summary?.guaranteed ?? []
  const drops = stage.reward_summary?.drops ?? []

  // Group drops: items with same type but different amounts/chances
  const dropsByType: Record<string, { name: string; icon_url: string | null; entries: { amount?: number; chance_pct: number }[]; gear_detail?: GearDetail }> = {}
  for (const drop of drops) {
    if (drop.type === 'cosmetic') continue
    const icon = reward_icons[drop.type]
    const label = drop.type === 'gear' ? 'Equipment' : drop.type === 'weapon' ? 'Weapon' : (icon?.name ?? drop.type)
    if (!dropsByType[drop.type]) {
      dropsByType[drop.type] = { name: label, icon_url: icon?.icon_url ?? null, entries: [], gear_detail: drop.gear_detail }
    }
    dropsByType[drop.type].entries.push({ amount: drop.amount, chance_pct: drop.chance_pct })
  }

  return (
    <div style={{
      background: '#111',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      {/* Header row */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          textAlign: 'left',
        }}
      >
        {/* Stage number */}
        <span style={{
          flexShrink: 0,
          fontFamily: 'Unbounded, sans-serif',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#a855f7',
          minWidth: '5.25rem',
        }}>
          Stage {stage.stage_number}
        </span>

        {/* Energy cost */}
        <span style={{ flexShrink: 0, fontSize: '0.85rem', color: '#60a5fa', minWidth: '3.5rem' }}>
          ⚡ {stage.energy_cost}
        </span>

        {/* Guaranteed rewards — one fixed-width slot per type so columns align */}
        <div style={{ flex: 1, display: 'flex', gap: '0' }}>
          {allRewardTypes.map(type => {
            const g = guaranteed.find(g => g.type === type && g.amount != null)
            const icon = reward_icons[type]
            return (
              <div key={type} style={{ minWidth: '130px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {g ? (
                  <>
                    {icon?.icon_url ? (
                      <img
                        src={`https://www.ravenpyros.com${icon.icon_url}`}
                        alt={icon.name}
                        title={icon.name}
                        style={{ width: '22px', height: '22px', objectFit: 'contain', flexShrink: 0 }}
                      />
                    ) : null}
                    <span style={{ fontSize: '0.85rem', color: '#aaa' }}>
                      {icon?.name ?? type}: <strong style={{ color: '#fff' }}>{g.amount!.toLocaleString()}</strong>
                    </span>
                  </>
                ) : null}
              </div>
            )
          })}
        </div>

        {/* Chevron */}
        <svg
          width="12"
          height="8"
          viewBox="0 0 12 8"
          style={{ flexShrink: 0, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}
        >
          <path d="M1 1l5 5 5-5" stroke="#666" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1rem' }}>
          {/* Waves */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Unbounded, sans-serif', marginBottom: '0.75rem' }}>
              Waves
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {stage.waves.map(wave => (
                <WaveRow key={wave.id} wave={wave} bossName={bossName} />
              ))}
            </div>
          </div>

          {/* Drop rewards */}
          {Object.keys(dropsByType).length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Unbounded, sans-serif', marginBottom: '0.75rem' }}>
                Drop Rewards
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {Object.entries(dropsByType).map(([type, info]) => {
                  const gd = info.gear_detail
                  const tooltip = gd
                    ? [
                        gd.sets?.length ? `Sets: ${gd.sets.join(', ')}` : null,
                        gd.rarities?.length ? `Rarity: ${gd.rarities.map(r => `${r.name} ${r.weight_pct}%`).join(', ')}` : null,
                        gd.qualities?.length ? `Quality: ${gd.qualities.map(q => `${q.name} ${q.weight_pct}%`).join(', ')}` : null,
                      ].filter(Boolean).join('\n')
                    : info.entries.map(e => e.amount != null ? `${e.amount.toLocaleString()} (${e.chance_pct}%)` : `${e.chance_pct}%`).join(' / ')
                  return (
                    <div
                      key={type}
                      title={tooltip}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '6px',
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.78rem',
                        color: '#bbb',
                      }}
                    >
                      {info.icon_url ? (
                        <img
                          src={`https://www.ravenpyros.com${info.icon_url}`}
                          alt={info.name}
                          style={{ width: '16px', height: '16px', objectFit: 'contain', flexShrink: 0 }}
                        />
                      ) : null}
                      <span>{info.name}</span>
                      {gd?.sets?.length ? (
                        <span style={{ color: '#888', fontSize: '0.7rem' }}>({gd.sets.slice(0, 2).join(', ')}{gd.sets.length > 2 ? '…' : ''})</span>
                      ) : (
                        <span style={{ color: '#666', fontSize: '0.72rem' }}>
                          ({info.entries.map(e => e.amount != null ? `x${e.amount} ${e.chance_pct}%` : `${e.chance_pct}%`).join(', ')})
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function WaveRow({ wave, bossName }: { wave: Wave; bossName: string }) {
  const label = wave.is_boss_wave ? `Wave ${wave.wave_number} — Boss` : `Wave ${wave.wave_number}`

  return (
    <div style={{
      background: wave.is_boss_wave ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${wave.is_boss_wave ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)'}`,
      borderRadius: '6px',
      padding: '0.6rem 0.8rem',
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: wave.is_boss_wave ? '#fbbf24' : '#888', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {wave.slots.map(slot => (
          <EnemyChip key={slot.position} slot={slot} isBoss={slot.hero.name === bossName || slot.hero.rarity === 'None'} />
        ))}
      </div>
    </div>
  )
}

// ── Champions Tab ──────────────────────────────────────────────────────────────

function ChampionsTab({ recs, accentColor }: { recs: DungeonRecEnriched[]; accentColor: string }) {
  if (recs.length === 0) {
    return (
      <div style={{ padding: '3rem 0', textAlign: 'center', color: '#666' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#888' }}>Coming Soon</p>
        <p style={{ fontSize: '0.85rem' }}>Champion recommendations for this dungeon are being prepared.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '860px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {recs.map((rec) => (
        <ChampionRecCard key={rec.hero_id} rec={rec} accentColor={accentColor} />
      ))}
    </div>
  )
}

function ChampionRecCard({ rec, accentColor }: { rec: DungeonRecEnriched; accentColor: string }) {
  const rarityColor = RARITY_COLORS[rec.rarity ?? ''] ?? '#6b7280'

  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid rgba(255,255,255,0.06)',
      borderLeft: `3px solid ${accentColor}`,
      borderRadius: '10px',
      padding: '1rem 1.25rem',
      display: 'flex',
      gap: '1.1rem',
      alignItems: 'flex-start',
    }}>
      <div style={{
        flexShrink: 0,
        width: '70px',
        height: '70px',
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid ${rarityColor}50`,
        background: `${rarityColor}15`,
      }}>
        {rec.portrait_url ? (
          <img src={rec.portrait_url} alt={rec.hero_name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '1.4rem' }}>?</div>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{rec.hero_name}</span>
          {rec.rarity && (
            <span style={{
              fontSize: '0.62rem', fontWeight: 700, color: rarityColor,
              background: `${rarityColor}20`, padding: '0.15rem 0.45rem',
              borderRadius: '3px', fontFamily: 'Unbounded, sans-serif', letterSpacing: '0.05em',
            }}>
              {rec.rarity}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '0.88rem', color: '#aaa', lineHeight: 1.7 }}>{rec.writeup}</p>
      </div>
    </div>
  )
}

function EnemyChip({ slot, isBoss }: { slot: HeroSlot; isBoss: boolean }) {
  const rarityColor = RARITY_COLORS[slot.hero.rarity] ?? '#6b7280'

  return (
    <div
      title={`${slot.hero.name} · Lv.${slot.enemy_level}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        background: `${rarityColor}18`,
        border: `1px solid ${rarityColor}40`,
        borderRadius: '6px',
        padding: '0.25rem 0.5rem',
        fontSize: '0.78rem',
        color: isBoss ? '#fbbf24' : '#ddd',
      }}
    >
      {slot.hero.portrait_url ? (
        <img
          src={slot.hero.portrait_url}
          alt={slot.hero.name}
          style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `1px solid ${rarityColor}60` }}
        />
      ) : (
        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: `${rarityColor}30`, flexShrink: 0 }} />
      )}
      <span style={{ fontWeight: isBoss ? 600 : 400 }}>{slot.hero.name}</span>
      <span style={{ color: '#666', fontSize: '0.7rem' }}>Lv{slot.enemy_level}</span>
    </div>
  )
}
