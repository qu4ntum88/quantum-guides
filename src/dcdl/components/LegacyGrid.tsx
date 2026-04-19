'use client'

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import SearchBar from "./SearchBar"
import SelectSortBy from "./SelectSortBy"
import SelectFilterBy from "./SelectFilterBy"
import LegacyPieceBox from "./LegacyPieceBox"
import type { LegacyResolved } from "../lib/data"

const sortByValues = [
  { value: "tier", label: "Tier" },
  { value: "role", label: "Role" },
  { value: "rank", label: "Rank" },
]

const tierValues = [
  { value: "All", label: "All tiers" },
  { value: "S", label: "S" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
]

const roleValues = [
  { value: "All", label: "All roles" },
  { value: "Tank", label: "Guardian/Warrior" },
  { value: "DPS", label: "Firepower/Assassin/Magical" },
  { value: "Buffer/Debuffer", label: "Supporter/Intimidator" },
]

const rankValues = [
  { value: "All", label: "All ranks" },
  { value: "Mythic +", label: "Mythic +" },
  { value: "Mythic", label: "Mythic" },
  { value: "Legendary", label: "Legendary" },
  { value: "Epic", label: "Epic" },
]

const tierToRank: Record<string, number> = { S: 1, "A+": 2, A: 3, B: 4, C: 5, D: 6, "": 7 }
const rankToRank: Record<string, number> = { "Mythic +": 1, Mythic: 2, Legendary: 3, Epic: 4, "": 5 }

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
  const [rank, setRank] = useState("All")

  const resetFilters = () => {
    setSortBy("tier")
    setSortOrder("asc")
    setRole("All")
    setTier("All")
    setRank("All")
  }

  const filtered = legacyPieces
    .filter((piece) => {
      if (query && !piece.name.toLowerCase().includes(query.toLowerCase())) return false
      if (role !== "All" && piece.role !== role) return false
      if (tier !== "All" && piece.tier !== tier) return false
      if (rank !== "All" && piece.rank !== rank) return false
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
      <div className="flex flex-row flex-wrap gap-2 md:gap-4">
        <SelectSortBy
          onValueChange={setSortBy}
          values={sortByValues}
          defaultValue="tier"
          value={sortBy}
          onOrderClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
          order={sortOrder}
        />
        <SelectFilterBy onValueChange={setTier} defaultValue="All" value={tier} values={tierValues} />
        <SelectFilterBy onValueChange={setRole} defaultValue="All" value={role} values={roleValues} />
        <SelectFilterBy onValueChange={setRank} defaultValue="All" value={rank} values={rankValues} />
        <Button onClick={resetFilters}>Reset Filters</Button>
      </div>
      <div className="grid w-full max-w-4xl grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((piece) => (
          <LegacyPieceBox key={piece.id} piece={piece} communityTier={communityTiers[piece.id]} />
        ))}
      </div>
    </div>
  )
}
