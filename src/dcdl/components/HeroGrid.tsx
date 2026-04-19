'use client'

import { useState, useEffect, type CSSProperties } from "react"
import HeroBox from "./HeroBox"
import { Button } from "./ui/button"
import SearchBar from "./SearchBar"
import { RARITIES, RARITY_STYLE } from "./RarityBadge"
import { TIER_COLORS } from "./TierBadge"
import type { HeroResolved } from "../lib/data"

const SORT_OPTIONS = [
  { value: "name",     label: "Alphabetical" },
  { value: "class",    label: "Class" },
  { value: "faction",  label: "Faction" },
  { value: "rank",     label: "Rarity" },
  { value: "gameMode", label: "Game Modes" },
  { value: "tier",     label: "Tier Ranking" },
]

const CLASSES = [
  { id: "Assassin",     label: "Assassin" },
  { id: "Firepower",   label: "Firepower" },
  { id: "Guardian",    label: "Guardian" },
  { id: "Intimidator", label: "Intimidator" },
  { id: "Magical",     label: "Magical" },
  { id: "Supporter",   label: "Supporter" },
  { id: "Warrior",     label: "Warrior" },
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

const GAME_MODES = [
  "Combat Cycles",
  "Training Simulator",
  "Meta Brawl",
  "3v3",
  "Vehicle Combat",
  "Story Mode",
]

const TIERS = ["S+", "S", "A+", "A", "B", "C", "D"]

const tierToRank: Record<string, number> = { "S+": 0, S: 1, "A+": 2, A: 3, B: 4, C: 5, D: 6 }
const rankToRank: Record<string, number> = { Iconic: 0, "Mythic +": 1, Mythic: 2, Legendary: 3, Epic: 4, "": 5 }

function factionIconSrc(id: string): string {
  const override: Record<string, string> = { deathmetal: "death_metal" }
  return `/dcdl/synergies/tag_images/${override[id] ?? id}.png`
}

const LABEL: CSSProperties = {
  fontSize: "0.9rem",
  fontFamily: "Unbounded, sans-serif",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--gold)",
  opacity: 0.8,
  flexShrink: 0,
  whiteSpace: "nowrap",
  width: "9rem",
}

function SortButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
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
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  )
}

function AllButton({ selected, onClick }: { selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
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

function TierFilterButton({ tier, selected, onClick }: { tier: string; selected: boolean; onClick: () => void }) {
  const color = TIER_COLORS[tier] ?? "#888"
  return (
    <button
      type="button"
      title={tier}
      onClick={onClick}
      style={{
        width: "2.85rem",
        height: "2.85rem",
        borderRadius: "50%",
        background: selected ? color : "transparent",
        border: selected ? `2px solid ${color}` : "2px solid #444",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: selected ? "white" : "#666",
        fontFamily: "Unbounded, sans-serif",
        fontSize: tier.length > 1 ? "0.7rem" : "1rem",
        fontWeight: 700,
        letterSpacing: "-0.01em",
        transition: "all 0.15s",
        opacity: selected ? 1 : 0.55,
        flexShrink: 0,
        textShadow: selected ? "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" : "none",
      }}
    >
      {tier}
    </button>
  )
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

function toggle(arr: string[], val: string, set: (v: string[]) => void) {
  set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val])
}

export default function HeroGrid({ heros }: { heros: HeroResolved[] }) {
  const [communityTiers, setCommunityTiers] = useState<Record<string, string>>({})
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [selectedFactions, setSelectedFactions] = useState<string[]>([])
  const [selectedRarities, setSelectedRarities] = useState<string[]>([])
  const [selectedTiers, setSelectedTiers] = useState<string[]>([])
  const [selectedGameModes, setSelectedGameModes] = useState<string[]>([])

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
    setSelectedRarities([])
    setSelectedTiers([])
    setSelectedGameModes([])
  }

  const filtered = heros
    .filter((hero) => {
      if (query && !hero.name.toLowerCase().includes(query.toLowerCase())) return false
      if (selectedClasses.length > 0 && !selectedClasses.includes(hero.class)) return false
      if (selectedFactions.length > 0 && !hero.tagSynergies.some((s) => selectedFactions.includes(s.id))) return false
      if (selectedRarities.length > 0 && !selectedRarities.includes(hero.rarity)) return false
      if (selectedTiers.length > 0 && !selectedTiers.includes(hero.tier ?? "")) return false
      if (selectedGameModes.length > 0 && !hero.gameModes?.some((m) => selectedGameModes.includes(m))) return false
      return true
    })
    .sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1
      if (sortBy === "name")     return dir * a.name.localeCompare(b.name)
      if (sortBy === "tier")     return dir * ((tierToRank[b.tier ?? ""] ?? 9) - (tierToRank[a.tier ?? ""] ?? 9))
      if (sortBy === "class")    return dir * a.class.localeCompare(b.class)
      if (sortBy === "faction")  return dir * ((a.tagSynergies[0]?.name ?? "").localeCompare(b.tagSynergies[0]?.name ?? ""))
      if (sortBy === "rank")     return dir * ((rankToRank[a.rarity ?? ""] ?? 5) - (rankToRank[b.rarity ?? ""] ?? 5))
      if (sortBy === "gameMode") return dir * ((a.gameModes?.[0] ?? "").localeCompare(b.gameModes?.[0] ?? ""))
      return 0
    })

  return (
    <div className="flex flex-col gap-2 md:gap-4 w-full max-w-4xl">
      <SearchBar placeholder="Search heroes" onChange={(e) => setQuery(e.target.value)} />

      {/* Sort By row */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={LABEL}>Sort By</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
          {SORT_OPTIONS.map(({ value, label }) => (
            <SortButton key={value} label={label} selected={sortBy === value} onClick={() => setSortBy(value)} />
          ))}
          <SortButton label="↑ Asc" selected={sortOrder === "asc"} onClick={() => setSortOrder("asc")} />
          <SortButton label="↓ Desc" selected={sortOrder === "desc"} onClick={() => setSortOrder("desc")} />
          <Button onClick={resetFilters}>Reset Filters</Button>
        </div>
      </div>

      {/* Class filter row */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={LABEL}>Class</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
          <AllButton selected={selectedClasses.length === 0} onClick={() => setSelectedClasses([])} />
          {CLASSES.map(({ id, label }) => (
            <IconFilterButton
              key={id}
              src={`/dcdl/role_images/${id}.png`}
              label={label}
              selected={selectedClasses.includes(id)}
              onClick={() => toggle(selectedClasses, id, setSelectedClasses)}
            />
          ))}
        </div>
      </div>

      {/* Faction filter row */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={LABEL}>Faction</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
          <AllButton selected={selectedFactions.length === 0} onClick={() => setSelectedFactions([])} />
          {FACTIONS.map(({ id, label }) => (
            <IconFilterButton
              key={id}
              src={factionIconSrc(id)}
              label={label}
              selected={selectedFactions.includes(id)}
              onClick={() => toggle(selectedFactions, id, setSelectedFactions)}
            />
          ))}
        </div>
      </div>

      {/* Rarity filter row */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={LABEL}>Rarity</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
          <AllButton selected={selectedRarities.length === 0} onClick={() => setSelectedRarities([])} />
          {RARITIES.map((r) => {
            const selected = selectedRarities.includes(r)
            const s = RARITY_STYLE[r] ?? { background: "#555" }
            return (
              <button
                key={r}
                type="button"
                onClick={() => toggle(selectedRarities, r, setSelectedRarities)}
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

      {/* Game Mode filter row */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={LABEL}>Game Mode</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
          <AllButton selected={selectedGameModes.length === 0} onClick={() => setSelectedGameModes([])} />
          {GAME_MODES.map((m) => (
            <SortButton
              key={m}
              label={m}
              selected={selectedGameModes.includes(m)}
              onClick={() => toggle(selectedGameModes, m, setSelectedGameModes)}
            />
          ))}
        </div>
      </div>

      {/* Tier Ranking filter row */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={LABEL}>Tier Ranking</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
          <AllButton selected={selectedTiers.length === 0} onClick={() => setSelectedTiers([])} />
          {TIERS.map((t) => (
            <TierFilterButton
              key={t}
              tier={t}
              selected={selectedTiers.includes(t)}
              onClick={() => toggle(selectedTiers, t, setSelectedTiers)}
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
