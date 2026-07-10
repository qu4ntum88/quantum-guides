import { notFound } from 'next/navigation'
import { PUBLIC_SECTIONS } from '@/src/lib/siteConfig'

export default function VoidHuntersLayout({ children }: { children: React.ReactNode }) {
  // Hidden from the public site while we focus on DCDL for AdSense review.
  // Data stays editable via /admin/dcdl. Flip PUBLIC_SECTIONS.voidHunters to re-enable.
  if (!PUBLIC_SECTIONS.voidHunters) notFound()

  return <>{children}</>
}
