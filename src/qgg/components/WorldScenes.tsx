'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Moving banner scenes for Godforge and Void Hunters (WorldHero renders them).
 * Both follow the pointer a little (parallax) through two CSS
 * variables, --px and --py (-1…1), so the motion itself lives in worlds.css and
 * switches off under prefers-reduced-motion. Each scene sits in a box as wide as
 * the page content, so it stays beside the text on a wide screen instead of
 * drifting off to the window's edge.
 */

function usePointerVars() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current?.closest('.wh') as HTMLElement | null
    if (!el || !window.matchMedia('(hover: hover)').matches) return
    let frame = 0
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width) * 2 - 1
      const y = ((e.clientY - r.top) / r.height) * 2 - 1
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--px', x.toFixed(3))
        el.style.setProperty('--py', y.toFixed(3))
      })
    }
    const leave = () => {
      el.style.setProperty('--px', '0')
      el.style.setProperty('--py', '0')
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [])
  return ref
}

/** Seeded so server and client render the same scatter (no hydration mismatch). */
function scatter(n: number, seed: number) {
  let s = seed
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
  return Array.from({ length: n }, () => ({
    '--x': `${(rand() * 100).toFixed(1)}%`,
    '--s': `${(1.5 + rand() * 3.5).toFixed(1)}px`,
    '--d': `${(5 + rand() * 9).toFixed(2)}s`,
    '--delay': `${(-rand() * 14).toFixed(2)}s`,
    '--dx': `${((rand() - 0.5) * 120).toFixed(0)}px`,
    '--sway': `${((rand() - 0.5) * 50).toFixed(0)}px`,
    '--h': `${(9 + rand() * 14).toFixed(1)}rem`,
    '--o': (0.35 + rand() * 0.6).toFixed(2),
  })) as React.CSSProperties[]
}

const MOTES = scatter(30, 7)
const SOULS = scatter(12, 21)

/* ─── Godforge: the pantheon ──────────────────────────────────────────────── */

const GODS = ['heimdall', 'shamash', 'cizin'] as const
const ROTATE_MS = 8000

export function GodforgePantheon() {
  const ref = usePointerVars()
  const [on, setOn] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => setOn((i) => (i + 1) % GODS.length), ROTATE_MS)
    return () => clearTimeout(t)
  }, [on])

  return (
    <div ref={ref} className="gfb" data-god={GODS[on]} aria-hidden="true">
      <div className="gfb-stars" />
      {/* Full-body art: phones only, faint behind the text (the bust takes over on wider screens). */}
      {GODS.map((id, i) => (
        <img key={id} className={`gfb-full gfb-full--${id}${i === on ? ' is-on' : ''}`} src={`/godforge/banner/full/${id}.webp`} alt="" />
      ))}
      <div className="wh-scene">
        <div className="gfb-stage">
          {GODS.map((id, i) => (
            <div key={id} className={`gfb-god gfb-god--${id}${i === on ? ' is-on' : ''}`}>
              <span className="gfb-aura" />
              {id === 'cizin' && (
                <span className="gfb-souls">
                  {SOULS.map((st, k) => (
                    <i key={k} style={st} />
                  ))}
                </span>
              )}
              <img className="gfb-fig" src={`/godforge/banner/${id}.webp`} alt="" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Void Hunters: key art and void motes ─────────────────────────────── */

export function VoidHuntersScene() {
  const ref = usePointerVars()
  return (
    <div ref={ref} className="vhb" aria-hidden="true">
      <img className="vhb-key" src="/vh/banner/keyart.webp" alt="" />
      <div className="vhb-veil" />
      <div className="vhb-motes">
        {MOTES.map((st, k) => (
          <i key={k} style={st} />
        ))}
      </div>
    </div>
  )
}
