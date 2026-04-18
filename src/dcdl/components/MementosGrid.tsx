'use client'

import { useState } from "react"
import { Button } from "./ui/button"
import SearchBar from "./SearchBar"
import SelectSortBy from "./SelectSortBy"
import SelectFilterBy from "./SelectFilterBy"
import MementoBox from "./MementosBox"
import type { Memento } from "../lib/data"

const sortByValues = [
  { value: "rarity", label: "Rarity" },
  { value: "collection", label: "Collection" },
  { value: "availability", label: "Availability" },
]

const rarityValues = [
  { value: "All", label: "All rarities" },
  { value: "5Red", label: "5Red" },
  { value: "5Yellow", label: "5Yellow" },
  { value: "4Yellow", label: "4Yellow" },
  { value: "3Purple", label: "3Purple" },
  { value: "2Blue", label: "2Blue" },
  { value: "1Green", label: "1Green" },
  { value: "Covers", label: "Covers" },
]

const collectionValues = [
  { value: "All", label: "All sets" },
  { value: "Dark Deals", label: "Dark Deals" },
  { value: "Gotham Police Evidence Locker", label: "Gotham Police Evidence Locker" },
  { value: "Supernatural San Francisco", label: "Supernatural San Francisco" },
  { value: "Catwoman Theft Files", label: "Catwoman Theft Files" },
  { value: "Harley's Private Stuff", label: "Harley's Private Stuff" },
  { value: "Magical Artifacts", label: "Magical Artifacts" },
  { value: "Secrets of Atlantis", label: "Secrets of Atlantis" },
  { value: "Secrets of the Dark Knights", label: "Secrets of the Dark Knights" },
  { value: "Arkham Asylum Artifacts", label: "Arkham Asylum Artifacts" },
  { value: "Know your Enemy", label: "Know your Enemy" },
  { value: "Bat-Family Ties", label: "Bat-Family Ties" },
  { value: "Guardians of Gotham", label: "Guardians of Gotham" },
]

const availabilityValues = [
  { value: "All", label: "All availability" },
  { value: "Standard", label: "Standard" },
  { value: "Limited", label: "Limited" },
]

const rarityToRank: Record<string, number> = {
  "5Red": 1, "5Yellow": 2, "4Yellow": 3, "3Purple": 4, "2Blue": 5, "1Green": 6, Covers: 7, "": 8,
}
const availabilityToRank: Record<string, number> = { Limited: 1, Standard: 2, "": 3 }

export default function MementoGrid({ mementos }: { mementos: Memento[] }) {
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState("rarity")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [collection, setCollection] = useState("All")
  const [rarity, setRarity] = useState("All")
  const [availability, setAvailability] = useState("All")

  const resetFilters = () => {
    setSortBy("rarity")
    setSortOrder("asc")
    setCollection("All")
    setRarity("All")
    setAvailability("All")
  }

  const filtered = mementos
    .filter((piece) => {
      if (query && !piece.name.toLowerCase().includes(query.toLowerCase())) return false
      if (collection !== "All" && piece.collection !== collection) return false
      if (rarity !== "All" && piece.rarity !== rarity) return false
      if (availability !== "All" && piece.availability !== availability) return false
      return true
    })
    .sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1
      if (sortBy === "rarity") return dir * ((rarityToRank[b.rarity ?? ""] ?? 8) - (rarityToRank[a.rarity ?? ""] ?? 8))
      if (sortBy === "collection") return dir * ((a.collection ?? "").localeCompare(b.collection ?? ""))
      if (sortBy === "availability") return dir * ((availabilityToRank[b.availability ?? ""] ?? 3) - (availabilityToRank[a.availability ?? ""] ?? 3))
      return 0
    })

  return (
    <div className="flex flex-col gap-2 md:gap-4">
      <SearchBar placeholder="Search Mementos" onChange={(e) => setQuery(e.target.value)} />
      <div className="flex flex-row flex-wrap gap-2 md:gap-4">
        <SelectSortBy
          onValueChange={setSortBy}
          values={sortByValues}
          defaultValue="rarity"
          value={sortBy}
          onOrderClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
          order={sortOrder}
        />
        <SelectFilterBy onValueChange={setRarity} defaultValue="All" value={rarity} values={rarityValues} />
        <SelectFilterBy onValueChange={setCollection} defaultValue="All" value={collection} values={collectionValues} />
        <SelectFilterBy onValueChange={setAvailability} defaultValue="All" value={availability} values={availabilityValues} />
        <Button onClick={resetFilters}>Reset Filters</Button>
      </div>
      <div className="grid w-full max-w-4xl grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((piece) => (
          <MementoBox key={piece.id} piece={piece} />
        ))}
      </div>
    </div>
  )
}
