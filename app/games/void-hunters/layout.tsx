import { notFound } from 'next/navigation'
import { PUBLIC_SECTIONS } from '@/src/lib/siteConfig'
import '@/src/qgg/worlds.css'

export default function VoidHuntersLayout({ children }: { children: React.ReactNode }) {
  if (!PUBLIC_SECTIONS.voidHunters) notFound()

  return (
    <div className="qw" data-world="voidhunters">
      {children}
    </div>
  )
}
