'use client'

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import SearchBar from "./SearchBar"
import SelectSortBy from "./SelectSortBy"
import SelectFilterBy from "./SelectFilterBy"
import LegacyPieceBox from "./LegacyPieceBox"
import { RARITIES, RARITY_STYLE } from "./RarityBadge"
import type { LegacyResolved } from "../lib/data"

const sortByValues = [
  { value: "tier", label: "Tier" },
  { value: "role", label: "Role" },
  { value: "rank", label: "Rarity" },
]

const tierValues = [
  { value: "All", label: "All tiers" },
  { value: "S+", label: "S+" },
  { value: "S", label: "S" },
  { value: "A+", label: "A+" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
]

const ROLES = [
  { value: "Guardian | Warrior",           classes: ["Guardian", "Warrior"] },
  { value: "Magical | Assassin | Firepower", classes: ["Magical", "Assassin", "Firepower"] },
  { value: "Supporter | Intimidator",       classes: ["Supporter", "Intimidator"] },
]

function AllButton({ selected, onClick }: { selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title="All"
      onClick={onClick}
      style={{
        background: selected ? "rgba(124,58,237,0.35)" : "transparent",
        border: selected ? "2px solid var(--gold)" : "2px solid #444",
        borderRadius: "0.5rem",
        padding: "0.3rem 0.65rem",
        cursor: "pointer",
        color: selected ? "var(--gold)" : "#888",
        fontFamily: "Unbounded, sans-serif",
        fontSize: "0.65rem",
        fontWeight: 700,
        letterSpacing: "0.05em",
        transition: "all 0.15s",
        flexShrink: 0,
        height: "2.85rem",
      }}
    >
      ALL
    </button>
  )
}

function RoleButton({ classes, selected, onClick }: { classes: string[]; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={classes.join(" | ")}
      onClick={onClick}
      style={{
        background: selected ? "rgba(124,58,237,0.35)" : "transparent",
        border: selected ? "2px solid var(--gold)" : "2px solid #444",
        borderRadius: "0.5rem",
        padding: "0.3rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "0.2rem",
        transition: "all 0.15s",
        opacity: selected ? 1 : 0.55,
        flexShrink: 0,
      }}
    >
      {classes.map((c) => (
        <img key={c} src={`/dcdl/role_images/${c}.png`} alt={c} style={{ width: "2.25rem", height: "2.25rem", objectFit: "contain" }} />
      ))}
    </button>
  )
}


const tierToRank: Record<string, number> = { "S+": 0, S: 1, "A+": 2, A: 3, B: 4, C: 5, D: 6, "": 7 }
const rankToRank: Record<string, number> = { Iconic: 1, "Mythic +": 2, Mythic: 3, Legendary: 4, Epic: 5, "": 6 }

export default function LegacyGrid({ legacyPieces }: { legacyPieces: LegacyResolved[] }) {
  const [communityTiers, setCommunityTiers] = useState<Record<string, string>>({})
  const [query, setQuery] = useState("")

  useEffect(() => {
    fetch('/api/votes/tally?type=legacy')
      .then((r) => r.json())
      .then((data: Record<string, { winner: string }>) => {
        const map: Record<string, string> = {}
        for (const [id, entry] of Object.entries(data)) {
          if (entry.winner) map[id] = entry.winner
        }
        setCommunityTiers(map)
      })
  }, [])
  const [sortBy, setSortBy] = useState("tier")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [role, setRole] = useState("All")
  const [tier, setTier] = useState("All")
  const [selectedRarities, setSelectedRarities] = useState<string[]>([])

  const resetFilters = () => {
    setSortBy("tier")
    setSortOrder("asc")
    setRole("All")
    setTier("All")
    setSelectedRarities([])
  }

  const filtered = legacyPieces
    .filter((piece) => {
      if (query && !piece.name.toLowerCase().includes(query.toLowerCase())) return false
      if (role !== "All" && piece.role !== role) return false
      if (tier !== "All" && piece.tier !== tier) return false
      if (selectedRarities.length > 0 && !selectedRarities.includes(piece.rank ?? "")) return false
      return true
    })
    .sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1
      if (sortBy === "tier") return dir * ((tierToRank[b.tier ?? ""] ?? 7) - (tierToRank[a.tier ?? ""] ?? 7))
      if (sortBy === "role") return dir * ((a.role ?? "").localeCompare(b.role ?? ""))
      if (sortBy === "rank") return dir * ((rankToRank[b.rank ?? ""] ?? 5) - (rankToRank[a.rank ?? ""] ?? 5))
      return 0
    })

  return (
    <div className="flex flex-col gap-2 md:gap-4">
      <SearchBar placeholder="Search Legacy Pieces" onChange={(e) => setQuery(e.target.value)} />
      <div className="flex flex-row flex-wrap gap-2 md:gap-4 items-center">
        <SelectSortBy
          onValueChange={setSortBy}
          values={sortByValues}
          defaultValue="tier"
          value={sortBy}
          onOrderClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
          order={sortOrder}
        />
        <SelectFilterBy onValueChange={setTier} defaultValue="All" value={tier} values={tierValues} />
        <Button onClick={resetFilters}>Reset Filters</Button>
      </div>

      {/* Rarity filter row */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <span style={{ fontSize: "0.72rem", fontFamily: "Unbounded, sans-serif", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gold)", opacity: 0.8 }}>Rarity</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
          <AllButton selected={selectedRarities.length === 0} onClick={() => setSelectedRarities([])} />
          {RARITIES.map((r) => {
            const selected = selectedRarities.includes(r)
            const s = RARITY_STYLE[r] ?? { background: "#555" }
            return (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRarities((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r])}
                style={{
                  background: s.background,
                  boxShadow: selected ? (s.boxShadow ?? undefined) : undefined,
                  border: selected ? "2px solid var(--gold)" : "2px solid transparent",
                  borderRadius: "0.4rem",
                  padding: "0.3rem 0.85rem",
                  cursor: "pointer",
                  fontFamily: "Unbounded, sans-serif",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "white",
                  textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
                  opacity: selected ? 1 : 0.55,
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
              >
                {r}
              </button>
            )
          })}
        </div>
      </div>

      {/* Role filter row */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <span style={{ fontSize: "0.72rem", fontFamily: "Unbounded, sans-serif", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gold)", opacity: 0.8 }}>Role</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
          <AllButton selected={role === "All"} onClick={() => setRole("All")} />
          {ROLES.map(({ value, classes }) => (
            <RoleButton key={value} classes={classes} selected={role === value} onClick={() => setRole(value)} />
          ))}
        </div>
      </div>
      <div className="grid w-full max-w-4xl grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((piece) => (
          <LegacyPieceBox key={piece.id} piece={piece} communityTier={communityTiers[piece.id]} />
        ))}
      </div>
    </div>
  )
}
