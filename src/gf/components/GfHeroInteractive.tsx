'use client'

import { useState } from 'react'
import type { GfHero, GfHeroEffect, GfHeroSkill, GfHeroAscensionBonus, GfHeroAwakeningBonus } from './GfHeroBox'
import { lookupEffect } from '../lib/statusEffects'
import { StatusEffectToken } from './StatusEffectToken'

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

// ── Scaling ────────────────────────────────────────────────────────────────

const RANKS_INTERNAL: Record<number, number> = {
  1: 1.080060, 2: 1.034372, 3: 1.020480, 4: 1.013702, 5: 1.010889, 6: 1.009035,
}
const RANK_SPIKES: Record<number, number> = {
  1: 1.084130, 2: 1.175795, 3: 1.186924, 4: 1.220385, 5: 1.243010,
}
const SEGMENT_STEPS = [10, 11, 11, 11, 11, 11]

function indexToRankLevel(i: number): { rank: number; level: number } {
  if (i <= 9)  return { rank: 1, level: i + 1 }
  if (i <= 20) return { rank: 2, level: i }
  if (i <= 31) return { rank: 3, level: i - 1 }
  if (i <= 42) return { rank: 4, level: i - 2 }
  if (i <= 53) return { rank: 5, level: i - 3 }
  return         { rank: 6, level: i - 4 }
}

function calcScaled(base: number, rank: number, level: number): number {
  let m = 1.0
  if (rank > 1) {
    m *= Math.pow(RANKS_INTERNAL[1], 9)
    for (let r = 1; r < rank; r++) {
      m *= RANK_SPIKES[r]
      if (r + 1 < rank) m *= Math.pow(RANKS_INTERNAL[r + 1], 10)
    }
  }
  const steps = rank === 1 ? level - 1 : level - (rank - 1) * 10
  m *= Math.pow(RANKS_INTERNAL[rank], steps)
  return Math.round(base * m)
}

// ── Label / icon maps ──────────────────────────────────────────────────────

const STAT_LABELS: Record<string, string> = {
  hp: 'HP', atk: 'ATK', def: 'DEF', spd: 'SPD', init: 'FTH',
  acc: 'ACC', res: 'RES', initial_divinity: 'Divinity',
  cdmg: 'C.DMG', crate: 'C.Rate', divinity: 'Divinity', ignore_res: 'Ignore RES',
  barrier_mult: 'Barrier', heal_mult: 'Heal', attunement_mult: 'Attunement',
  armor_mult: 'Armor', weapon_mult: 'Weapon',
}

const SKILL_COLORS: Record<string, string> = {
  Basic: '#9ca3af', Core: '#3b82f6', Passive: '#a855f7',
  Ultimate: '#f59e0b', Imprint: '#22c55e', 'Leader Bonus': '#ec4899',
}


// ── Small shared helpers ───────────────────────────────────────────────────

function SectionHeading({ children, accent = '#a855f7' }: { children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
      <div style={{ width: '3px', height: '1rem', background: accent, borderRadius: '2px', flexShrink: 0 }} />
      <h2 style={{ color: '#888', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', margin: 0 }}>
        {children}
      </h2>
    </div>
  )
}

function EffectBadge({ effect }: { effect: GfHeroEffect }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      background: '#1a1a1a', border: '1px solid #2a2a2a',
      color: '#ccc', fontSize: '0.68rem', padding: '0.2rem 0.55rem', borderRadius: '0.35rem',
      fontWeight: 500,
    }}>
      {effect.chance < 100 && <span style={{ color: '#f87171', fontWeight: 700 }}>{effect.chance}%</span>}
      <span>{effect.effect_name}</span>
      {effect.duration > 1 && <span style={{ color: '#555', marginLeft: '0.1rem' }}>{effect.duration}t</span>}
      <span style={{ color: '#444', fontSize: '0.6rem' }}>· {effect.target_label}</span>
    </span>
  )
}

function AwakeningBonus({ aw, awakeningLevel }: { aw: { level: number; upgrade_description: string }; awakeningLevel: number }) {
  const unlocked = aw.level <= awakeningLevel
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', opacity: unlocked ? 1 : 0.38, transition: 'opacity 0.15s' }}>
      <img
        src={unlocked ? `/godforge/awakening/${aw.level}.png` : '/godforge/awakening/locked.png'}
        alt={`Awakening ${aw.level}`}
        style={{ width: '1.25rem', height: '1.25rem', objectFit: 'contain', flexShrink: 0, marginTop: '0.1rem' }}
      />
      <span style={{ color: unlocked ? '#a78bfa' : '#555', fontSize: '0.75rem', lineHeight: 1.5 }}>
        <RichSkillText text={aw.upgrade_description} />
      </span>
    </div>
  )
}

// ── Skill cards ────────────────────────────────────────────────────────────

function SkillCard({ skill, awakeningLevel }: { skill: GfHeroSkill; awakeningLevel: number }) {
  const color = SKILL_COLORS[skill.type] ?? '#9ca3af'
  const displayedEffects = (skill.effects ?? []).filter(e => e.visibility === 'Displayed')
  const uniqueEffects = displayedEffects.filter((e, i, arr) =>
    arr.findIndex(x => x.effect_name === e.effect_name && x.target === e.target) === i
  )

  return (
    <div style={{ background: '#0f0f0f', border: `1px solid ${color}33`, borderRadius: '0.75rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ background: `${color}14`, borderBottom: `1px solid ${color}2a`, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {skill.icon_url
          ? <img src={skill.icon_url} alt={skill.name ?? skill.type} style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.4rem', objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.4rem', background: `${color}22`, border: `1px solid ${color}33`, flexShrink: 0 }} />
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {skill.name && <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{skill.name}</span>}
            <span style={{ background: `${color}22`, border: `1px solid ${color}55`, color, fontSize: '0.58rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>{skill.type}</span>
            {skill.cooldown != null && <span style={{ color: '#555', fontSize: '0.68rem' }}>CD: {skill.cooldown}</span>}
          </div>
          {skill.damage_formula && skill.damage_formula.length > 0 && (
            <div style={{ color: '#f87171', fontSize: '0.68rem', marginTop: '0.15rem', fontFamily: 'monospace', fontWeight: 600 }}>{skill.damage_formula.join(' / ')}</div>
          )}
        </div>
      </div>

      <div style={{ padding: '0.85rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <p style={{ color: '#ccc', fontSize: '0.83rem', lineHeight: 1.65, margin: 0 }}><RichSkillText text={skill.description} /></p>
        {uniqueEffects.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {uniqueEffects.map((eff, i) => <EffectBadge key={i} effect={eff} />)}
          </div>
        )}
        {skill.awakening_bonuses && skill.awakening_bonuses.length > 0 && (
          <div style={{ borderTop: '1px solid #1e1e1e', paddingTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {skill.awakening_bonuses.map((aw, i) => <AwakeningBonus key={i} aw={aw} awakeningLevel={awakeningLevel} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function UltimateCard({ skill, awakeningLevel }: { skill: GfHeroSkill; awakeningLevel: number }) {
  const color = '#f59e0b'
  const displayedEffects = (skill.effects ?? []).filter(e => e.visibility === 'Displayed')
  const uniqueEffects = displayedEffects.filter((e, i, arr) =>
    arr.findIndex(x => x.effect_name === e.effect_name && x.target === e.target) === i
  )

  return (
    <div style={{ background: '#0f0f0f', border: `1px solid ${color}55`, borderRadius: '0.75rem', overflow: 'hidden', boxShadow: `0 0 28px ${color}14` }}>
      <div style={{ height: '3px', background: `linear-gradient(90deg, ${color}, ${color}55, transparent)` }} />
      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {skill.icon_url
          ? <img src={skill.icon_url} alt={skill.name ?? 'Ultimate'} style={{ width: '5rem', height: '5rem', borderRadius: '0.6rem', objectFit: 'cover', flexShrink: 0, border: `2px solid ${color}55` }} />
          : <div style={{ width: '5rem', height: '5rem', borderRadius: '0.6rem', background: `${color}22`, border: `2px solid ${color}44`, flexShrink: 0 }} />
        }
        <div style={{ flex: 1, minWidth: '16rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
            {skill.name && <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>{skill.name}</span>}
            <span style={{ background: `${color}22`, border: `1px solid ${color}66`, color, fontSize: '0.6rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ultimate</span>
            {skill.divinity_cost != null && (
              <span style={{ color: '#f59e0bcc', fontSize: '0.75rem', fontWeight: 600 }}>✦ {skill.divinity_cost.toLocaleString()} Divinity</span>
            )}
          </div>
          {skill.damage_formula && skill.damage_formula.length > 0 && (
            <div style={{ color: '#f87171', fontSize: '0.72rem', marginBottom: '0.65rem', fontFamily: 'monospace', fontWeight: 600 }}>{skill.damage_formula.join(' / ')}</div>
          )}
          <p style={{ color: '#ccc', fontSize: '0.87rem', lineHeight: 1.7, margin: '0 0 0.75rem' }}><RichSkillText text={skill.description} /></p>
          {uniqueEffects.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {uniqueEffects.map((eff, i) => <EffectBadge key={i} effect={eff} />)}
            </div>
          )}
          {skill.awakening_bonuses && skill.awakening_bonuses.length > 0 && (
            <div style={{ borderTop: `1px solid ${color}22`, paddingTop: '0.65rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {skill.awakening_bonuses.map((aw, i) => <AwakeningBonus key={i} aw={aw} awakeningLevel={awakeningLevel} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Bonus sections ─────────────────────────────────────────────────────────

function AscensionSection({ bonuses, ascensionLevel }: { bonuses: GfHeroAscensionBonus[]; ascensionLevel: number }) {
  const byRank = Array.from({ length: 6 }, (_, i) => ({
    rank: i + 1,
    bonuses: bonuses.filter(b => b.rank === i + 1),
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {byRank.map(({ rank, bonuses: bs }) => {
        const unlocked = rank <= ascensionLevel
        return (
          <div key={rank} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: unlocked ? '#0f0b18' : '#0a0a0a',
            border: `1px solid ${unlocked ? '#9333ea22' : '#161616'}`,
            borderRadius: '0.5rem', padding: '0.5rem 0.75rem',
            opacity: unlocked ? 1 : 0.4,
            transition: 'opacity 0.2s, background 0.2s',
          }}>
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center', minWidth: '5.5rem', flexShrink: 0 }}>
              {Array.from({ length: rank }, (_, i) => (
                <img key={i} src="/godforge/stars/purple.png" alt="" style={{ width: '0.85rem', height: '0.85rem', objectFit: 'contain' }} />
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {bs.length === 0
                ? <span style={{ color: '#3a3a3a', fontSize: '0.75rem' }}>—</span>
                : bs.map((b, i) => (
                  <span key={i} style={{ color: unlocked ? '#ddd' : '#555', fontSize: '0.78rem' }}>
                    <span style={{ color: unlocked ? '#888' : '#444' }}>{STAT_LABELS[b.stat] ?? b.stat}: </span>
                    {b.multiplier > 0 ? `+${(b.multiplier * 100).toFixed(0)}%` : ''}
                    {b.flat_bonus > 0 ? `+${b.flat_bonus}` : ''}
                  </span>
                ))
              }
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AwakeningSection({ bonuses, awakeningLevel }: { bonuses: GfHeroAwakeningBonus[]; awakeningLevel: number }) {
  const byLevel = Array.from({ length: 5 }, (_, i) => ({
    level: i + 1,
    bonuses: bonuses.filter(b => b.level === i + 1),
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {byLevel.map(({ level, bonuses: bs }) => {
        const unlocked = level <= awakeningLevel
        return (
          <div key={level} style={{
            background: unlocked ? '#0d0b18' : '#0a0a0a',
            border: `1px solid ${unlocked ? '#a855f71a' : '#161616'}`,
            borderRadius: '0.5rem', padding: '0.65rem 0.9rem',
            display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
            opacity: unlocked ? 1 : 0.4,
            transition: 'opacity 0.2s, background 0.2s',
          }}>
            <img
              src={unlocked ? `/godforge/awakening/${level}.png` : '/godforge/awakening/locked.png'}
              alt={`Awakening ${level}`}
              style={{ width: '2rem', height: '2rem', objectFit: 'contain', flexShrink: 0, marginTop: '0.1rem' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ color: unlocked ? '#7c3aed' : '#444', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.35rem' }}>
                Awakening {level}
              </div>
              {bs.length === 0
                ? <span style={{ color: '#3a3a3a', fontSize: '0.78rem' }}>—</span>
                : bs.map((b, i) => (
                  <div key={i} style={{ color: unlocked ? '#c4b5fd' : '#555', fontSize: '0.82rem', lineHeight: 1.6, marginTop: i > 0 ? '0.3rem' : 0 }}>
                    {b.type === 'Ability' && b.description && <span><RichSkillText text={b.description} /></span>}
                    {b.type === 'Stat' && b.stat && (
                      <span>
                        <span style={{ color: unlocked ? '#777' : '#444' }}>{STAT_LABELS[b.stat] ?? b.stat}: </span>
                        {b.multiplier && b.multiplier > 0 ? `+${(b.multiplier * 100).toFixed(0)}%` : ''}
                        {b.flat_bonus && b.flat_bonus > 0 ? `+${b.flat_bonus}` : ''}
                      </span>
                    )}
                  </div>
                ))
              }
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────

export function GfHeroInteractive({ hero, rarityColor = '#a855f7' }: { hero: GfHero; rarityColor?: string }) {
  const [rankIdx, setRankIdx]           = useState(0)
  const [ascensionLevel, setAscension]  = useState(0)
  const [awakeningLevel, setAwakening]  = useState(0)

  const { rank, level } = indexToRankLevel(rankIdx)
  const rankPct = (rankIdx / 64) * 100
  const ascPct  = rank > 0 ? (ascensionLevel / rank) * 100 : 0
  const awkPct  = (awakeningLevel / 5) * 100

  function handleRankChange(newIdx: number) {
    const { rank: newRank } = indexToRankLevel(newIdx)
    setRankIdx(newIdx)
    if (ascensionLevel > newRank) setAscension(newRank)
  }

  // Ascension bonus aggregation (additive multipliers, additive flats)
  const activeAscBonuses = (hero.ascension_bonuses ?? []).filter(b => b.rank <= ascensionLevel)
  const ascMult: Record<string, number> = {}
  const ascFlat: Record<string, number> = {}
  for (const b of activeAscBonuses) {
    if (b.multiplier > 0) ascMult[b.stat] = (ascMult[b.stat] ?? 0) + b.multiplier
    if (b.flat_bonus > 0) ascFlat[b.stat] = (ascFlat[b.stat] ?? 0) + b.flat_bonus
  }
  // Apply ascension on top of an already-computed value.
  // ascKey is the key used in ascension_bonuses (may differ from display key, e.g. 'divinity' vs 'initial_divinity')
  function withAsc(value: number | null, ascKey: string): number | null {
    if (value === null) return null
    let v = value
    if (ascMult[ascKey]) v = Math.round(v * (1 + ascMult[ascKey]))
    if (ascFlat[ascKey]) v = v + ascFlat[ascKey]
    return v
  }

  // Stat grid entries
  const stats = hero.stats
  const statEntries = stats ? [
    { key: 'hp',               label: 'HP',      value: stats.hp  !== null ? withAsc(calcScaled(stats.hp,  rank, level), 'hp')  : null, scaling: true  },
    { key: 'atk',              label: 'ATK',     value: stats.atk !== null ? withAsc(calcScaled(stats.atk, rank, level), 'atk') : null, scaling: true  },
    { key: 'def',              label: 'DEF',     value: stats.def !== null ? withAsc(calcScaled(stats.def, rank, level), 'def') : null, scaling: true  },
    { key: 'spd',              label: 'SPD',     value: withAsc(stats.spd,              'spd'),    scaling: false },
    { key: 'init',             label: 'FTH',     value: withAsc(stats.init,             'init'),   scaling: false },
    { key: 'crate',            label: 'C.Rate',  value: withAsc(10,                     'crate'),  scaling: false },
    { key: 'cdmg',             label: 'C.DMG',   value: withAsc(50,                     'cdmg'),   scaling: false },
    { key: 'acc',              label: 'ACC',     value: withAsc(stats.acc,              'acc'),    scaling: false },
    { key: 'res',              label: 'RES',     value: withAsc(stats.res,              'res'),    scaling: false },
    { key: 'initial_divinity', label: 'Divinity',value: withAsc(stats.initial_divinity, 'divinity'), scaling: false },
  ] : []

  // Skill resolution
  const ultimate      = hero.skills?.find(s => s.type === 'Ultimate')
  const basic         = hero.skills?.find(s => s.type === 'Basic')
  const core          = hero.skills?.find(s => s.type === 'Core')
  const passive       = hero.skills?.find(s => s.type === 'Passive')
  const imprintRaw    = hero.skills?.find(s => s.type === 'Imprint')
  const imprint       = imprintRaw
    ? { ...imprintRaw, icon_url: imprintRaw.icon_url ?? passive?.icon_url ?? null }
    : undefined

  return (
    <>
      {/* ── Stats + Sliders ── */}
      {stats && (
        <div
          className="gf-sliders"
          style={{
            background: '#0d0d0d',
            borderBottom: '1px solid #181818',
            '--rc': rarityColor,
            '--rp': `${rankPct}%`,
            '--ap': `${ascPct}%`,
            '--wp': `${awkPct}%`,
          } as React.CSSProperties}
        >
          <style>{`
            .gf-sliders .gf-s {
              -webkit-appearance: none; appearance: none;
              width: 100%; height: 4px; border-radius: 4px; outline: none; cursor: pointer;
              margin-bottom: 0;
            }
            .gf-sliders .gf-s::-webkit-slider-thumb {
              -webkit-appearance: none;
              width: 16px; height: 16px; border-radius: 50%;
              cursor: pointer; border: 2px solid rgba(255,255,255,0.15); margin-top: -6px;
            }
            .gf-sliders .gf-s::-moz-range-thumb {
              width: 16px; height: 16px; border-radius: 50%;
              cursor: pointer; border: 2px solid rgba(255,255,255,0.15);
            }
            .gf-sliders .gf-rank {
              background: linear-gradient(to right, var(--rc) var(--rp), #2a2a2a var(--rp));
            }
            .gf-sliders .gf-rank::-webkit-slider-thumb { background: var(--rc); }
            .gf-sliders .gf-rank::-moz-range-thumb     { background: var(--rc); }
            .gf-sliders .gf-asc {
              background: linear-gradient(to right, #9333ea var(--ap), #2a2a2a var(--ap));
            }
            .gf-sliders .gf-asc::-webkit-slider-thumb { background: #9333ea; }
            .gf-sliders .gf-asc::-moz-range-thumb     { background: #9333ea; }
            .gf-sliders .gf-awk {
              background: linear-gradient(to right, #6366f1 var(--wp), #2a2a2a var(--wp));
            }
            .gf-sliders .gf-awk::-webkit-slider-thumb { background: #6366f1; }
            .gf-sliders .gf-awk::-moz-range-thumb     { background: #6366f1; }
          `}</style>

          <div className="container" style={{ paddingTop: '1.25rem', paddingBottom: '1.25rem' }}>

            {/* ── Rank / Level ── */}
            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>Rank {rank} · Level {level}</span>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {Array.from({ length: 6 }, (_, i) => (
                    <img key={i} src="/godforge/stars/gold.png" alt="" style={{ width: '1rem', height: '1rem', objectFit: 'contain', opacity: i < rank ? 1 : 0.15 }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '0.45rem' }}>
                {SEGMENT_STEPS.map((w, si) => {
                  const sr = si + 1
                  return <div key={sr} style={{ flex: w, height: '3px', borderRadius: '2px', background: sr < rank ? `${rarityColor}77` : sr === rank ? rarityColor : '#222', transition: 'background 0.1s' }} />
                })}
              </div>
              <input className="gf-s gf-rank" type="range" min={0} max={64} value={rankIdx}
                onChange={e => handleRankChange(Number(e.target.value))} style={{ display: 'block' }} />
            </div>

            <div style={{ height: '1px', background: '#1e1e1e', margin: '0.85rem 0' }} />

            {/* ── Ascension ── */}
            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: '#888', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ascension</span>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                  {Array.from({ length: 6 }, (_, i) => (
                    <img key={i} src="/godforge/stars/purple.png" alt="" style={{
                      width: '1rem', height: '1rem', objectFit: 'contain',
                      opacity: i < ascensionLevel ? 1 : i < rank ? 0.25 : 0.08,
                      transition: 'opacity 0.15s',
                    }} />
                  ))}
                </div>
              </div>
              <input className="gf-s gf-asc" type="range" min={0} max={rank} value={ascensionLevel}
                onChange={e => setAscension(Number(e.target.value))} style={{ display: 'block' }} />
            </div>

            <div style={{ height: '1px', background: '#1e1e1e', margin: '0.85rem 0' }} />

            {/* ── Awakening ── */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: '#888', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Awakening</span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <img key={i}
                      src={i < awakeningLevel ? `/godforge/awakening/${i + 1}.png` : '/godforge/awakening/locked.png'}
                      alt={`Awakening ${i + 1}`}
                      style={{ width: '1.2rem', height: '1.2rem', objectFit: 'contain', opacity: i < awakeningLevel ? 1 : 0.25, transition: 'opacity 0.15s' }}
                    />
                  ))}
                </div>
              </div>
              <input className="gf-s gf-awk" type="range" min={0} max={5} value={awakeningLevel}
                onChange={e => setAwakening(Number(e.target.value))} style={{ display: 'block' }} />
            </div>

            {/* ── Stat grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(5.5rem, 1fr))', gap: '0.5rem' }}>
              {statEntries.map(({ key, label, value, scaling }) => (
                <div key={key} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '0.45rem', padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.55rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.2rem' }}>{label}</div>
                  <div style={{ fontSize: '0.95rem', color: value === null ? '#3a3a3a' : scaling ? '#fff' : '#999', fontWeight: 700 }}>{value === null ? '—' : value.toLocaleString()}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>

        {/* ── Abilities ── */}
        <div style={{ marginBottom: '3rem' }}>
          <SectionHeading accent="#f59e0b">Abilities</SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {ultimate && <UltimateCard skill={ultimate} awakeningLevel={awakeningLevel} />}
            {(basic || core) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {basic && <SkillCard skill={basic} awakeningLevel={awakeningLevel} />}
                {core  && <SkillCard skill={core}  awakeningLevel={awakeningLevel} />}
              </div>
            )}
            {(passive || imprint) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {passive  && <SkillCard skill={passive}  awakeningLevel={awakeningLevel} />}
                {imprint  && <SkillCard skill={imprint}  awakeningLevel={awakeningLevel} />}
              </div>
            )}
          </div>
        </div>

        {/* ── Ascension + Awakening ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {hero.ascension_bonuses?.length > 0 && (
            <div>
              <SectionHeading accent="#9333ea">Ascension Bonuses</SectionHeading>
              <AscensionSection bonuses={hero.ascension_bonuses} ascensionLevel={ascensionLevel} />
            </div>
          )}
          {hero.awakening_bonuses?.length > 0 && (
            <div>
              <SectionHeading accent="#6366f1">Awakening Bonuses</SectionHeading>
              <AwakeningSection bonuses={hero.awakening_bonuses} awakeningLevel={awakeningLevel} />
            </div>
          )}
        </div>

      </div>
    </>
  )
}
