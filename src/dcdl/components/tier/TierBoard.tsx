'use client'

import { TIER_COLORS } from '@/src/dcdl/components/TierBadge'
import ExportTierListButton from './ExportTierListButton'

/**
 * Classic tier-row rendering of a list — one coloured badge per tier, portraits
 * flowing to its right. Used for creator/editor lists and for the studio
 * preview, and matched by the PNG export so the download looks like the page.
 */

export type BoardItem = { id: string; name: string; img: string | null; tier: string; href?: string }

export default function TierBoard({
  title,
  subtitle,
  items,
  tiers,
  fit = 'cover',
  showExport = true,
  filename,
}: {
  title: string
  subtitle?: string
  items: BoardItem[]
  tiers: readonly string[]
  fit?: 'cover' | 'contain'
  showExport?: boolean
  filename?: string
}) {
  const populated = tiers.filter((t) => items.some((i) => i.tier === t))

  return (
    <div style={{
      background: '#120834',
      border: '2px solid rgba(201,160,30,0.55)',
      borderRadius: '0.875rem',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '1.15rem 1.35rem 1rem',
        borderBottom: '2px solid rgba(201,160,30,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '1rem', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{
            fontFamily: 'Unbounded, sans-serif', fontSize: 'clamp(0.95rem, 2.6vw, 1.35rem)',
            fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase',
            letterSpacing: '0.05em', lineHeight: 1.2, textShadow: '0 0 24px rgba(201,160,30,0.35)',
          }}>{title}</div>
          {subtitle && (
            <div style={{ color: '#9a9a9a', fontSize: '0.82rem', marginTop: '0.3rem' }}>{subtitle}</div>
          )}
        </div>
        {showExport && (
          <ExportTierListButton
            title={title} subtitle={subtitle} tiers={tiers} fit={fit} filename={filename}
            items={items.map((i) => ({ id: i.id, name: i.name, img: i.img, tier: i.tier }))}
          />
        )}
      </div>

      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {populated.length === 0 && (
          <p style={{ color: '#666', fontSize: '0.85rem', padding: '1.5rem', textAlign: 'center', margin: 0 }}>
            Nothing ranked yet.
          </p>
        )}
        {populated.map((tier) => {
          const color = TIER_COLORS[tier] ?? '#888'
          const rowItems = items.filter((i) => i.tier === tier)
          return (
            <div key={tier} style={{
              display: 'flex', alignItems: 'stretch', gap: '0.7rem',
              background: `${color}12`, border: `1px solid ${color}44`,
              borderRadius: '0.5rem', padding: '0.6rem',
            }}>
              <div style={{
                width: '3.4rem', minWidth: '3.4rem', borderRadius: '0.45rem', background: color,
                border: '2px solid rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#fff', fontFamily: 'Unbounded, sans-serif',
                fontSize: tier.length > 1 ? '1rem' : '1.25rem', fontWeight: 900,
                textShadow: '-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000',
              }}>{tier}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', flex: 1, alignContent: 'center' }}>
                {rowItems.map((item) => {
                  const portrait = (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.img ?? ''}
                      alt={item.name}
                      title={item.name}
                      style={{
                        width: '4.5rem', height: '4.5rem', objectFit: fit,
                        borderRadius: '0.4rem', border: `2px solid ${color}aa`,
                        display: 'block', background: fit === 'contain' ? '#1a0a3a' : '#111',
                      }}
                    />
                  )
                  return item.href
                    ? <a key={item.id} href={item.href} style={{ display: 'block' }}>{portrait}</a>
                    : <span key={item.id} style={{ display: 'block' }}>{portrait}</span>
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
