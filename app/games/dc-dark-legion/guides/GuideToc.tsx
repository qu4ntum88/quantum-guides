'use client'

import { useState, useEffect } from 'react'

type Heading = { id: string; text: string; level: number }

export default function GuideToc({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      { rootMargin: '-72px 0% -68% 0%', threshold: 0 }
    )
    headings.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav aria-label="Table of contents" style={{ position: 'sticky', top: '80px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
      <div style={{
        fontSize: '0.6rem',
        fontFamily: 'Unbounded, sans-serif',
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--gold)',
        marginBottom: '0.85rem',
        opacity: 0.85,
      }}>
        Contents
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {headings.map(({ id, text, level }) => {
          const active = activeId === id
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
                }}
                style={{
                  display: 'block',
                  paddingTop: '0.28rem',
                  paddingBottom: '0.28rem',
                  paddingLeft: level === 3 ? '1.1rem' : '0.65rem',
                  fontSize: '0.8rem',
                  lineHeight: 1.45,
                  color: active ? 'var(--gold)' : 'rgba(255,255,255,0.44)',
                  textDecoration: 'none',
                  borderLeft: `2px solid ${active ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}`,
                  transition: 'color 0.18s, border-color 0.18s',
                }}
              >
                {text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
