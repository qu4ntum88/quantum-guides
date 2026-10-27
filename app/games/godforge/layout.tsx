import { notFound } from 'next/navigation'
import { PUBLIC_SECTIONS } from '@/src/lib/siteConfig'
import '@/src/qgg/worlds.css'

export default function GodforgeLayout({ children }: { children: React.ReactNode }) {
  // Public since 2026-10-16. Flip PUBLIC_SECTIONS.godforge to hide it.
  if (!PUBLIC_SECTIONS.godforge) notFound()

  return (
    <div className="qw" data-world="godforge">
      {children}
      <footer className="w-footer">
        GODFORGE and any associated logos are trademarks, service marks, and/or registered trademarks of Fateless Ltd. © 2026 Quantum Game Guides. All rights reserved.
      </footer>
    </div>
  )
}
