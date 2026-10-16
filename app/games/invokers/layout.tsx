import { notFound } from 'next/navigation'
import { Cinzel } from 'next/font/google'
import { PUBLIC_SECTIONS } from '@/src/lib/siteConfig'
import '@/src/qgg/worlds.css'
import './invokers.css'

// High-fantasy display face for headings, columns and tile names (body stays Inter).
const display = Cinzel({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-world', display: 'swap' })

export default function InvokersLayout({ children }: { children: React.ReactNode }) {
  if (!PUBLIC_SECTIONS.invokers) notFound()

  return (
    <div className={`qw ${display.variable}`} data-world="invokers">
      {children}
      <footer className="w-footer">
        INVOKERS: TITAN LEGACY and any associated logos are trademarks, service marks, and/or registered trademarks of
        HitZone Games. © 2026 Quantum Game Guides. All rights reserved.
      </footer>
    </div>
  )
}
