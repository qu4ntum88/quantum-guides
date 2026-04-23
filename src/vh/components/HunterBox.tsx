'use client'

import Link from 'next/link'

export type Hunter = {
  id: string
  name: string
  portrait: string
  fullArt?: string | null
  rarity: string
  class: string[]
  homeland: string[]
  species: string[]
  other: string[]
  title?: string
  power?: number
  stats?: { attack: number; defense: number; health: number; speed: number }
  bio?: string[]
  skills?: SkillEntry[]
  bonus_breakdown?: BonusBreakdown | null
}

export type SkillEntry = {
  order: number
  name: string
  level: string
  type: string
  cooldown: number | null
  tags: string[]
  description: string
  upgrades: string[]
  image?: string | null
}

export type BonusBreakdown = {
  awaken?: { stars: number; bonuses: string[] }[]
  super_awaken?: { stars: number; bonuses: string[] }[]
  super_awaken_skill_enhance?: { stars: number; skill: string; type: string; effect: string }[]
}

const RARITY_COLOR: Record<string, string> = {
  Legendary: '#f59e0b',
  Epic:      '#a855f7',
  Rare:      '#3b82f6',
}

export default function HunterBox({ hunter }: { hunter: Hunter }) {
  return (
    <Link
      href={`/games/void-hunters/hunters/${hunter.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div style={{
        borderRadius: '0.5rem',
        overflow: 'hidden',
        border: `1px solid ${RARITY_COLOR[hunter.rarity] ?? '#2a2a2a'}`,
        position: 'relative',
        aspectRatio: '3 / 4',
        background: '#111',
        transition: 'transform 0.15s, box-shadow 0.15s',
        cursor: 'pointer',
      }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.transform = 'scale(1.03)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 18px ${RARITY_COLOR[hunter.rarity] ?? '#444'}55`
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.transform = ''
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = ''
        }}
      >
        {hunter.portrait
          ? <img src={hunter.portrait} alt={hunter.name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '2rem' }}>?</div>
        }
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(0,0,0,0.65)',
          padding: '0.4rem 0.5rem',
          textAlign: 'center',
        }}>
          <div style={{
            fontWeight: 700,
            fontSize: '0.85rem',
            color: '#e8e8e8',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            lineHeight: 1.25,
          }}>
            {hunter.name}
          </div>
          {hunter.title && (
            <div style={{ fontSize: '0.65rem', color: RARITY_COLOR[hunter.rarity] ?? '#aaa', marginTop: '0.15rem', fontStyle: 'italic' }}>
              {hunter.title}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
