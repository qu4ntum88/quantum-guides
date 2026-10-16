import { notFound } from 'next/navigation'
import { IM_Fell_English_SC } from 'next/font/google'
import { PUBLIC_SECTIONS } from '@/src/lib/siteConfig'
import '@/src/qgg/worlds.css'

// Weathered old-print capitals for the dark, gritty look (body stays Inter).
const display = IM_Fell_English_SC({ subsets: ['latin'], weight: '400', variable: '--font-world', display: 'swap' })

export default function VoidHuntersLayout({ children }: { children: React.ReactNode }) {
  if (!PUBLIC_SECTIONS.voidHunters) notFound()

  return (
    <div className={`qw ${display.variable}`} data-world="voidhunters">
      {children}
    </div>
  )
}
