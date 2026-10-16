import { notFound } from 'next/navigation'
import { Marcellus } from 'next/font/google'
import { PUBLIC_SECTIONS } from '@/src/lib/siteConfig'
import '@/src/qgg/worlds.css'

// Inscription-style capitals for the Greek look: headings, columns, tile names (body stays Inter).
const display = Marcellus({ subsets: ['latin'], weight: '400', variable: '--font-world', display: 'swap' })

export default function GodforgeLayout({ children }: { children: React.ReactNode }) {
  // Public since 2026-10-16. Flip PUBLIC_SECTIONS.godforge to hide it.
  if (!PUBLIC_SECTIONS.godforge) notFound()

  return (
    <div className={`qw ${display.variable}`} data-world="godforge">
      {children}
      <footer className="w-footer">
        GODFORGE and any associated logos are trademarks, service marks, and/or registered trademarks of Fateless Ltd. © 2026 Quantum Game Guides. All rights reserved.
      </footer>
    </div>
  )
}
