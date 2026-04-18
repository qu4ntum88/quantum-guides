'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import type { LegacyResolved } from "../lib/data"

const PLACEHOLDER = "/dcdl/heros/headshot_images/_placeholder.png"

export default function LegacyPieceBox({ piece }: { piece: LegacyResolved }) {
  const tierSrc = piece.tier ? "/dcdl/tier_images/" + piece.tier + ".png" : null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={"/games/dc-dark-legion/legacy/" + piece.id}
          className="group relative aspect-[4/5] overflow-hidden border border-white/10 bg-slate-700 bg-gradient-to-b from-purple-900/90 to-purple-500/50 shadow-md"
        >
          <img
            src={piece.image ?? PLACEHOLDER}
            alt={piece.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            style={{ maskImage: "linear-gradient(to bottom, black 30%, transparent)" }}
          />
          <div className="absolute inset-0 flex flex-col justify-end">
            {tierSrc && (
              <img className="absolute top-1 right-1 w-8" src={tierSrc} alt={piece.tier} />
            )}
            <p className="w-full bg-black/40 p-1 py-2 text-center text-sm leading-tight font-medium text-white">
              {piece.name}
            </p>
          </div>
        </a>
      </TooltipTrigger>
      <TooltipContent className="text-md">
        <p className="font-bold text-red-400">Role: <span className="font-normal text-white">{piece.role}</span></p>
        {piece.champions && piece.champions.length > 0 && (
          <p className="font-bold text-red-400">
            Recommended Champions: <span className="font-normal text-white">{piece.champions.map((c) => c.name).join(", ")}</span>
          </p>
        )}
        <p className="font-bold text-red-400">Tier: <span className="font-normal text-white">{piece.tier}</span></p>
      </TooltipContent>
    </Tooltip>
  )
}
