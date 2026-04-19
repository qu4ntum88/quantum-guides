'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import TierBadge from "./TierBadge"
import type { HeroResolved } from "../lib/data"

const PLACEHOLDER = "/dcdl/heros/headshot_images/_placeholder.png"

export default function HeroBox({ hero, communityTier }: { hero: HeroResolved; communityTier?: string }) {
  const classSrc = "/dcdl/role_images/" + hero.class + ".png"
  const tierSrc = "/dcdl/tier_images/" + hero.tier + ".png"
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={"/games/dc-dark-legion/heros/" + hero.id}
          className="group relative aspect-4/5 overflow-hidden border border-white/10 bg-slate-700 bg-linear-to-b from-purple-900/90 to-purple-500/50 shadow-md"
        >
          <img
            src={hero.imageHeadshot ?? PLACEHOLDER}
            alt={hero.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            style={{ maskImage: "linear-gradient(to bottom, black 30%, transparent)" }}
          />
          <div className="absolute inset-0 flex flex-col justify-end">
            <img className="absolute top-0 left-0 w-8" src={classSrc} alt={hero.class} />
            <img className="absolute top-1 right-1 w-8" src={tierSrc} alt={hero.tier} />
            <p className="w-full bg-black/40 p-1 py-2 text-center text-sm leading-tight font-medium text-white">
              {hero.name}
            </p>
          </div>
        </a>
      </TooltipTrigger>
      <TooltipContent style={{ background: '#1a1a2e', border: '1px solid #333', padding: '0.6rem 0.8rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img src="/images/site/Q GOLD FULL ICON.png" alt="Quantum" style={{ width: '1.5rem', height: '1.5rem', objectFit: 'contain' }} />
            <span style={{ color: '#aaa', fontSize: '0.75rem', flex: 1 }}>Quantum&apos;s Tier</span>
            <TierBadge tier={hero.tier} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img src="/images/site/JLD.png" alt="Community" style={{ width: '1.5rem', height: '1.5rem', objectFit: 'contain' }} />
            <span style={{ color: '#aaa', fontSize: '0.75rem', flex: 1 }}>Community Tier</span>
            <TierBadge tier={communityTier} />
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
