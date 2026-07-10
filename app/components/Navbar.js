'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { SignInButton, UserButton, useUser } from '@clerk/nextjs'
import { PUBLIC_SECTIONS } from '@/src/lib/siteConfig'

// Items tagged with `section` are only shown when that section is public
// (see src/lib/siteConfig.ts). DC: Dark Legion is always shown.
const ALL_NAV_ITEMS = [
  { label: 'Home', href: '/' },
  {
    label: 'DC: Dark Legion',
    href: '/games/dc-dark-legion/guides',
    children: [
      { label: 'Champions', href: '/games/dc-dark-legion' },
      { label: 'Legacy Pieces', href: '/games/dc-dark-legion/legacy' },
      { label: 'Tier List', href: '/games/dc-dark-legion/tier-list' },
      { label: 'Best Teams', href: '/games/dc-dark-legion/best-teams' },
      { label: 'Supreme Commander', href: '/games/dc-dark-legion/supreme-commander' },
      { label: 'Combat Cycle Guide', href: '/games/dc-dark-legion/combat-cycle' },
      { label: 'Ship Combat Guides', href: '/games/dc-dark-legion/ship-combat-guides' },
      { label: 'Infographics', href: '/games/dc-dark-legion/infographics' },
      { label: 'Factions', href: '/games/dc-dark-legion/factions' },
    ],
  },
  {
    section: 'godforge',
    label: 'Godforge',
    href: '/games/godforge',
    children: [
      { label: 'Home', href: '/games/godforge' },
      { label: 'Heroes', href: '/games/godforge/heroes' },
      { label: 'Tier List', href: '/games/godforge/tier-list' },
      { label: 'Status Effects', href: '/games/godforge/status-effects' },
      { label: 'Dungeons', href: '/games/godforge/dungeons' },
    ],
  },
  { section: 'voidHunters', label: 'Void Hunters', href: '/games/void-hunters/guides' },
]

const NAV_ITEMS = ALL_NAV_ITEMS.filter((item) => !item.section || PUBLIC_SECTIONS[item.section])

function DropdownItem({ item }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const closeTimer = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleMouseEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }

  function handleMouseLeave() {
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }

  return (
    <li ref={ref} className="nav-item-dropdown" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="nav-dropdown-trigger">
        <a href={item.href} className="nav-dropdown-label">{item.label}</a>
        <button className="nav-dropdown-chevron" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={`Toggle ${item.label} menu`}>
          <svg width="10" height="6" viewBox="0 0 10 6" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {open && (
        <ul className="nav-dropdown-menu">
          {item.children.map((child) => (
            <li key={child.href}>
              <a href={child.href} className="nav-dropdown-link" onClick={() => setOpen(false)}>
                {child.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState(null)
  const { isSignedIn } = useUser()

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo */}
        <div className="logo">
          <Link href="/">
            <img src="/images/site/Q GOLD LOGOTYPE.png" alt="Quantum Game Guides" className="brand-logotype" />
          </Link>
        </div>

        {/* Desktop nav */}
        <ul className="nav-links desktop-nav">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <DropdownItem key={item.label} item={item} />
            ) : (
              <li key={item.label}>
                <a href={item.href}>{item.label}</a>
              </li>
            )
          )}
          <li className="nav-about" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isSignedIn ? (
              <>
                <a href="/members" style={{ color: 'var(--gold)', fontFamily: 'Unbounded, sans-serif', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none' }}>Members</a>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <SignInButton mode="modal">
                <button className="btn" style={{ padding: '0.4rem 1rem', fontSize: '0.78rem' }}>Sign In</button>
              </SignInButton>
            )}
            <a href="/about">About</a>
          </li>
        </ul>

        {/* Hamburger */}
        <button className="nav-hamburger" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu">
          <span className={`ham-bar ${menuOpen ? 'open-1' : ''}`} />
          <span className={`ham-bar ${menuOpen ? 'open-2' : ''}`} />
          <span className={`ham-bar ${menuOpen ? 'open-3' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <div key={item.label}>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <a
                    href={item.href}
                    className="mobile-menu-link"
                    style={{ flex: 1 }}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                  <button
                    onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                    aria-label={`Toggle ${item.label} menu`}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderLeft: '1px solid rgba(255,255,255,0.1)',
                      color: 'inherit',
                      cursor: 'pointer',
                      padding: '0.75rem 1rem',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="10" height="6" viewBox="0 0 10 6" style={{ transition: 'transform 0.2s', transform: mobileExpanded === item.label ? 'rotate(180deg)' : 'none' }}>
                      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                {mobileExpanded === item.label && (
                  <div className="mobile-submenu">
                    {item.children.map((child) => (
                      <a key={child.href} href={child.href} className="mobile-submenu-link" onClick={() => setMenuOpen(false)}>
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <a key={item.label} href={item.href} className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            )
          )}
          {isSignedIn ? (
            <a href="/members" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Members</a>
          ) : (
            <SignInButton mode="modal">
              <button className="mobile-menu-link" style={{ border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>Sign In</button>
            </SignInButton>
          )}
          <a href="/about" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>About</a>
        </div>
      )}
    </nav>
  )
}
