import { notFound } from 'next/navigation'
import { PUBLIC_SECTIONS } from '@/src/lib/siteConfig'

export default function GodforgeLayout({ children }: { children: React.ReactNode }) {
  // Hidden from the public site while we focus on DCDL for AdSense review.
  // Data stays editable via /admin/dcdl. Flip PUBLIC_SECTIONS.godforge to re-enable.
  if (!PUBLIC_SECTIONS.godforge) notFound()

  return (
    <>
      {children}
      <footer style={{ textAlign: 'center', padding: '1.5rem 1rem', fontSize: '0.75rem', color: '#888', borderTop: '1px solid #222', marginTop: '2rem' }}>
        GODFORGE and any associated logos are trademarks, service marks, and/or registered trademarks of Fateless Ltd. © 2026 Quantum Game Guides. All rights reserved.
      </footer>
    </>
  )
}
