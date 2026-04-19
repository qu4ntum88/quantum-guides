'use client'

import { usePathname } from 'next/navigation'

const links = [
  { label: 'Champions', href: '/games/dc-dark-legion' },
  { label: 'Legacy Pieces', href: '/games/dc-dark-legion/legacy' },
  { label: 'Mementos', href: '/games/dc-dark-legion/mementos' },
  { label: 'Guides', href: '/games/dc-dark-legion/guides' },
]

export default function DCDLSidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: '13rem',
      flexShrink: 0,
      position: 'sticky',
      top: '5rem',
      alignSelf: 'flex-start',
      padding: '1rem 0.75rem',
      background: 'var(--light-bg)',
      borderRadius: '0.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
    }}>
      <div style={{
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--gold)',
        padding: '0 0.5rem 0.5rem',
        borderBottom: '1px solid rgba(204,164,83,0.3)',
        marginBottom: '0.25rem',
        fontFamily: 'Unbounded, sans-serif',
      }}>
        DC: Dark Legion
      </div>
      {links.map(({ label, href }) => {
        const isActive = href === '/games/dc-dark-legion'
          ? pathname === href
          : pathname.startsWith(href)
        return (
          <a
            key={href}
            href={href}
            style={{
              display: 'block',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.9rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--dark-bg)' : 'var(--text-primary)',
              background: isActive ? 'var(--gold)' : 'transparent',
              textDecoration: 'none',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              if (!isActive) {
                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(204,164,83,0.15)'
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
              }
            }}
          >
            {label}
          </a>
        )
      })}
    </aside>
  )
}
