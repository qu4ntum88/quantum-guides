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

const gameModeValues = [
  { value: "All", label: "All Game Modes" },
  { value: "Combat Cycles", label: "Combat Cycles" },
  { value: "Training Simulator", label: "Training Simulator" },
  { value: "Meta Brawl", label: "Meta Brawl" },
  { value: "3v3", label: "3v3" },
  { value: "Vehicle Combat", label: "Vehicle Combat" },
  { value: "Story Mode", label: "Story Mode" },
]

const CLASSES = [
  { id: "Assassin",    label: "Assassin" },
  { id: "Firepower",  label: "Firepower" },
  { id: "Guardian",   label: "Guardian" },
  { id: "Intimidator",label: "Intimidator" },
  { id: "Magical",    label: "Magical" },
  { id: "Supporter",  label: "Supporter" },
  { id: "Warrior",    label: "Warrior" },
]

const FACTIONS = [
  { id: "arkhams_most_wanted", label: "Arkham's Most Wanted" },
  { id: "amazons",             label: "Amazons" },
  { id: "atlanteans",          label: "Atlanteans" },
  { id: "bat_family",          label: "Bat Family" },
  { id: "birds_of_prey",       label: "Birds of Prey" },
  { id: "deathmetal",          label: "Death Metal" },
  { id: "energy_wielder",      label: "Energy Wielder" },
  { id: "green_lantern_corps", label: "Green Lantern Corps" },
  { id: "justice_league",      label: "Justice League" },
  { id: "justice_league_dark", label: "Justice League Dark" },
  { id: "league_of_assassins", label: "League of Assassins" },
  { id: "legion_of_doom",      label: "Legion of Doom" },
  { id: "metahuman",           label: "Metahuman" },
  { id: "outsiders",           label: "Outsiders" },
  { id: "suicide_squad",       label: "Suicide Squad" },
  { id: "superman_family",     label: "Superman Family" },
  { id: "the_flash_family",    label: "The Flash Family" },
  { id: "teen_titans",         label: "Teen Titans" },
  { id: "weapon_master",       label: "Weapon Master" },
]

const tierToRank: Record<string, number> = { "S+": 0, S: 1, "A+": 2, A: 3, B: 4, C: 5, D: 6 }

function factionIconSrc(id: string): string {
  const override: Record<string, string> = { deathmetal: "death_metal" }
  return `/dcdl/synergies/tag_images/${override[id] ?? id}.png`
}

function IconFilterButton({ src, label, selected, onClick }: {
  src: string; label: string; selected: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      style={{
        background: selected ? "rgba(124,58,237,0.35)" : "transparent",
        border: selected ? "2px solid var(--gold)" : "2px solid #444",
        borderRadius: "0.5rem",
        padding: "0.3rem",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.2rem",
        transition: "all 0.15s",
        opacity: selected ? 1 : 0.55,
        flexShrink: 0,
      }}
    >
      <img src={src} alt={label} style={{ width: "2.25rem", height: "2.25rem", objectFit: "contain" }} />
    </button>
  )
}

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

export default function HeroGrid({ heros }: { heros: HeroResolved[] }) {
  const [communityTiers, setCommunityTiers] = useState<Record<string, string>>({})
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [selectedFactions, setSelectedFactions] = useState<string[]>([])
  const [tier, setTier] = useState("All")
  const [gameMode, setGameMode] = useState("All")

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

  const resetFilters = () => {
    setSortBy("name")
    setSortOrder("asc")
    setSelectedClasses([])
    setSelectedFactions([])
    setTier("All")
    setGameMode("All")
  }

  function toggleClass(id: string) {
    setSelectedClasses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function toggleFaction(id: string) {
    setSelectedFactions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const filtered = heros
    .filter((hero) => {
      if (query && !hero.name.toLowerCase().includes(query.toLowerCase())) return false
      if (selectedClasses.length > 0 && !selectedClasses.includes(hero.class)) return false
      if (selectedFactions.length > 0 && !hero.tagSynergies.some((s) => selectedFactions.includes(s.id))) return false
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

      {/* Sort + dropdowns row */}
      <div className="flex flex-row flex-wrap gap-2 md:gap-4 items-center">
        <SelectSortBy
          onValueChange={setSortBy}
          values={sortByValues}
          defaultValue="name"
          value={sortBy}
          onOrderClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
          order={sortOrder}
        />
        <SelectFilterBy onValueChange={setTier} defaultValue="All" value={tier} values={tierValues} />
        <SelectFilterBy onValueChange={setGameMode} defaultValue="All" value={gameMode} values={gameModeValues} />
        <Button onClick={resetFilters}>Reset Filters</Button>
      </div>

      {/* Class filter row */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <span style={{ fontSize: "0.72rem", fontFamily: "Unbounded, sans-serif", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gold)", opacity: 0.8 }}>Class</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
          <AllButton selected={selectedClasses.length === 0} onClick={() => setSelectedClasses([])} />
          {CLASSES.map(({ id, label }) => (
            <IconFilterButton
              key={id}
              src={`/dcdl/role_images/${id}.png`}
              label={label}
              selected={selectedClasses.includes(id)}
              onClick={() => toggleClass(id)}
            />
          ))}
        </div>
      </div>

      {/* Faction filter row */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <span style={{ fontSize: "0.72rem", fontFamily: "Unbounded, sans-serif", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gold)", opacity: 0.8 }}>Faction</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
          <AllButton selected={selectedFactions.length === 0} onClick={() => setSelectedFactions([])} />
          {FACTIONS.map(({ id, label }) => (
            <IconFilterButton
              key={id}
              src={factionIconSrc(id)}
              label={label}
              selected={selectedFactions.includes(id)}
              onClick={() => toggleFaction(id)}
            />
          ))}
        </div>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((hero) => (
          <HeroBox key={hero.id} hero={hero} communityTier={communityTiers[hero.id]} />
        ))}
      </div>
    </div>
  )
}
