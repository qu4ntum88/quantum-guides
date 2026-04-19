'use client'

import { useState, useRef, useEffect } from 'react'
import { SignInButton, UserButton, useUser } from '@clerk/nextjs'

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Godforge', href: '/games/godforge' },
  {
    label: 'DC: Dark Legion',
    children: [
      { label: 'Champions', href: '/games/dc-dark-legion' },
      { label: 'Legacy Pieces', href: '/games/dc-dark-legion/legacy' },
      { label: 'Guides', href: '/games/dc-dark-legion/guides' },
    ],
  },
  { label: 'Void Hunters', href: '#' },
]

function DropdownItem({ item }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <li ref={ref} className="nav-item-dropdown" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="nav-dropdown-trigger" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {item.label}
        <svg width="10" height="6" viewBox="0 0 10 6" style={{ marginLeft: '0.35rem', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>
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
          <a href="/">
            <img src="/images/site/Q GOLD LOGOTYPE.png" alt="Quantum Game Guides" className="brand-logotype" />
          </a>
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
                <button className="mobile-menu-group-btn" onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}>
                  {item.label}
                  <svg width="10" height="6" viewBox="0 0 10 6" style={{ marginLeft: '0.35rem', transition: 'transform 0.2s', transform: mobileExpanded === item.label ? 'rotate(180deg)' : 'none' }}>
                    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                </button>
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
