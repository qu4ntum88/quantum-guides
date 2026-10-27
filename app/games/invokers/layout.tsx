import { notFound } from 'next/navigation'
import { PUBLIC_SECTIONS } from '@/src/lib/siteConfig'
import '@/src/qgg/worlds.css'
import './invokers.css'

export default function InvokersLayout({ children }: { children: React.ReactNode }) {
  if (!PUBLIC_SECTIONS.invokers) notFound()

  return (
    <div className="qw" data-world="invokers">
      {children}
      <footer className="w-footer">
        INVOKERS: TITAN LEGACY and any associated logos are trademarks, service marks, and/or registered trademarks of
        HitZone Games. © 2026 Quantum Game Guides. All rights reserved.
      </footer>
    </div>
  )
}
