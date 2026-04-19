'use client'

import { useState, useEffect } from "react"
import HeroBox from "./HeroBox"
import { Button } from "./ui/button"
import SearchBar from "./SearchBar"
import SelectSortBy from "./SelectSortBy"
import SelectFilterBy from "./SelectFilterBy"
import type { HeroResolved } from "../lib/data"

const sortByValues = [
  { value: "name", label: "Name" },
  { value: "class", label: "Class" },
  { value: "faction", label: "Faction" },
  { value: "tier", label: "Tier" },
]

const classValues = [
  { value: "All", label: "All classes" },
  { value: "Assassin", label: "Assassin" },
  { value: "Firepower", label: "Firepower" },
  { value: "Guardian", label: "Guardian" },
  { value: "Intimidator", label: "Intimidator" },
  { value: "Magical", label: "Magical" },
  { value: "Supporter", label: "Supporter" },
  { value: "Warrior", label: "Warrior" },
]

const factionValues = [
  { value: "All", label: "All Factions" },
  { value: "arkhams_most_wanted", label: "Arkham's Most Wanted" },
  { value: "amazons", label: "Amazons" },
  { value: "atlanteans", label: "Atlantean" },
  { value: "bat_family", label: "Bat Family" },
  { value: "birds_of_prey", label: "Birds of Prey" },
  { value: "energy_wielder", label: "Energy Wielder" },
  { value: "green_lantern_corps", label: "Green Lantern Corps" },
  { value: "justice_league", label: "Justice League" },
  { value: "justice_league_dark", label: "Justice League Dark" },
  { value: "league_of_assassins", label: "League of Assassins" },
  { value: "legion_of_doom", label: "Legion of Doom" },
  { value: "metahuman", label: "Metahuman" },
  { value: "outsiders", label: "Outsiders" },
  { value: "suicide_squad", label: "Suicide Squad" },
  { value: "superman_family", label: "Superman Family" },
  { value: "the_flash_family", label: "The Flash Family" },
  { value: "teen_titans", label: "Teen Titans" },
  { value: "weapon_master", label: "Weapon Master" },
]

const tierValues = [
  { value: "All", label: "All tiers" },
  { value: "S", label: "S" },
  { value: "A+", label: "A+" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
]

const gameModeValues = [
  { value: "All", label: "All Game Modes" },
  { value: "Combat Cycles", label: "Combat Cycles" },
  { value: "Training Simulator", label: "Training Simulator" },
  { value: "Meta Brawl", label: "Meta Brawl" },
  { value: "3v3", label: "3v3" },
  { value: "Vehicle Combat", label: "Vehicle Combat" },
  { value: "Story Mode", label: "Story Mode" },
]

const tierToRank: Record<string, number> = {
  S: 1,
  "A+": 2,
  A: 3,
  B: 4,
  C: 5,
  D: 6,
}

export default function HeroGrid({ heros }: { heros: HeroResolved[] }) {
  const [communityTiers, setCommunityTiers] = useState<Record<string, string>>({})
  const [query, setQuery] = useState("")

  useEffect(() => {
    fetch('/api/votes/tally?type=champion')
      .then((r) => r.json())
      .then((data: Record<string, { winner: string }>) => {
        const map: Record<string, string> = {}
        for (const [id, entry] of Object.entries(data)) {
          if (entry.winner) map[id] = entry.winner
        }
        setCommunityTiers(map)
      })
  }, [])
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [cls, setCls] = useState("All")
  const [faction, setFaction] = useState("All")
  const [tier, setTier] = useState("All")
  const [gameMode, setGameMode] = useState("All")

  const resetFilters = () => {
    setSortBy("name")
    setSortOrder("asc")
    setCls("All")
    setFaction("All")
    setTier("All")
    setGameMode("All")
  }

  const filtered = heros
    .filter((hero) => {
      if (query && !hero.name.toLowerCase().includes(query.toLowerCase())) return false
      if (cls !== "All" && hero.class !== cls) return false
      if (faction !== "All" && !hero.tagSynergies.map((s) => s.id).includes(faction)) return false
      if (tier !== "All" && hero.tier !== tier) return false
      if (gameMode !== "All" && !(hero.gameModes?.includes(gameMode) ?? false)) return false
      return true
    })
    .sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1
      if (sortBy === "name") return dir * a.name.localeCompare(b.name)
      if (sortBy === "tier") return dir * ((tierToRank[b.tier] ?? 9) - (tierToRank[a.tier] ?? 9))
      if (sortBy === "class") return dir * a.class.localeCompare(b.class)
      if (sortBy === "faction") return dir * ((a.tagSynergies[0]?.name ?? "").localeCompare(b.tagSynergies[0]?.name ?? ""))
      return 0
    })

  return (
    <div className="flex flex-col gap-2 md:gap-4">
      <SearchBar placeholder="Search heroes" onChange={(e) => setQuery(e.target.value)} />
      <SelectSortBy
        onValueChange={setSortBy}
        values={sortByValues}
        defaultValue="name"
        value={sortBy}
        onOrderClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
        order={sortOrder}
      />
      <div className="flex flex-row flex-wrap gap-2 md:gap-4">
        <SelectFilterBy onValueChange={setCls} defaultValue="All" value={cls} values={classValues} />
        <SelectFilterBy onValueChange={setFaction} defaultValue="All" value={faction} values={factionValues} />
        <SelectFilterBy onValueChange={setTier} defaultValue="All" value={tier} values={tierValues} />
        <SelectFilterBy onValueChange={setGameMode} defaultValue="All" value={gameMode} values={gameModeValues} />
        <Button onClick={resetFilters}>Reset Filters</Button>
      </div>
      <div className="grid w-full max-w-4xl grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((hero) => (
          <HeroBox key={hero.id} hero={hero} communityTier={communityTiers[hero.id]} />
        ))}
      </div>
    </div>
  )
}
