'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import TierBadge from "./TierBadge"
import { EntryBadgeGroup } from "./EntryBadges"
import type { LegacyResolved } from "../lib/data"

const PLACEHOLDER = "/dcdl/heros/headshot_images/_placeholder.png"

export default function LegacyPieceBox({ piece, communityTier }: { piece: LegacyResolved; communityTier?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={`/games/dc-dark-legion/legacy/community-tier#${piece.id}`}
          className="block group relative aspect-4/5 overflow-hidden border border-white/10 bg-slate-700 bg-linear-to-b from-purple-900/90 to-purple-500/50 shadow-md"
        >
          <img
            src={piece.image ?? PLACEHOLDER}
            alt={piece.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            style={{ maskImage: "linear-gradient(to bottom, black 30%, transparent)" }}
          />
          <div className="absolute inset-0 flex flex-col justify-end">
            <EntryBadgeGroup
              isNew={piece.isNew}
              isP2W={piece.isP2W}
              previousTier={piece.previousTier}
              currentTier={piece.tier}
              size="md"
              tierBottom="2.5rem"
            />
            <p className="w-full bg-black/40 p-1 py-2 text-center text-sm leading-tight font-medium text-white">
              {piece.name}
            </p>
          </div>
        </a>
      </TooltipTrigger>
      <TooltipContent style={{ background: '#1a1a2e', border: '1px solid #333', padding: '0.75rem 0.9rem', maxWidth: '18rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {/* Tier rows */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img src="/images/site/Q GOLD FULL ICON.png" alt="Quantum" style={{ width: '4.5rem', height: '4.5rem', objectFit: 'contain', flexShrink: 0 }} />
            <span style={{ color: '#aaa', fontSize: '0.75rem', flex: 1 }}>Quantum&apos;s Tier</span>
            <TierBadge tier={piece.tier} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img src="/images/site/JLD.png" alt="Community" style={{ width: '4.5rem', height: '4.5rem', objectFit: 'contain', flexShrink: 0 }} />
            <span style={{ color: '#aaa', fontSize: '0.75rem', flex: 1 }}>Community Tier</span>
            <TierBadge tier={communityTier} />
          </div>

          {/* Recommended champions */}
          {piece.champions && piece.champions.length > 0 && (
            <div>
              <div style={{ fontSize: '0.65rem', fontFamily: 'Unbounded, sans-serif', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Recommended For
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {piece.champions.map((hero) => hero && (
                  <div key={hero.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                    <img
                      src={hero.imageHeadshot ?? PLACEHOLDER}
                      alt={hero.name}
                      style={{ width: '2.75rem', height: '2.75rem', objectFit: 'cover', borderRadius: '0.3rem', border: '1px solid #333' }}
                    />
                    <span style={{ fontSize: '0.55rem', color: '#888', textAlign: 'center', maxWidth: '2.75rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {hero.name.split('(')[0].trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
