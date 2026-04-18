'use client'

import { useState } from "react"
import type { Memento } from "../lib/data"

const PLACEHOLDER = "/dcdl/heros/headshot_images/_placeholder.png"

export default function MementoBox({ piece }: { piece: Memento }) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div
      onClick={() => setIsFlipped((f) => !f)}
      className="group aspect-[4/5] cursor-pointer rounded-xl shadow-lg duration-300"
      style={{ perspective: "1000px" }}
    >
      <div
        className="h-full transition-transform duration-700"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          className="h-full overflow-hidden border border-white/10 bg-slate-700 bg-gradient-to-b from-purple-900/90 to-purple-500/50"
          style={{ backfaceVisibility: "hidden" }}
        >
          <img
            src={piece.image ?? PLACEHOLDER}
            alt={piece.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            style={{ maskImage: "linear-gradient(to bottom, black 30%, transparent)" }}
          />
          <div className="absolute inset-0 flex flex-col justify-end">
            <p className="w-full bg-black/40 p-1 py-2 text-center text-sm leading-tight font-medium text-white">
              {piece.name}
            </p>
          </div>
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-auto bg-slate-700 bg-gradient-to-b from-purple-900/90 to-purple-500/50 p-4"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-center text-sm font-normal text-gray-300">{piece.description}</p>
        </div>
      </div>
    </div>
  )
}
