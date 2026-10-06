'use client'

import { useState, useEffect, useRef } from "react"
import HeroBox from "./HeroBox"
import { Button } from "./ui/button"
import SearchBar from "./SearchBar"
import { RARITIES, RARITY_STYLE } from "./RarityBadge"
import { TIER_COLORS } from "./TierBadge"
import type { HeroResolved } from "../lib/data"
import FilterBar, { type FilterGroup, type FilterPill } from "./FilterBar"
import TierView from "./tier/TierView"
import TierExportBar from "./tier/TierExportBar"
import ViewToggle, { useViewMode, CONTROL_BUTTON, CONTROL_INPUT } from "./tier/ViewToggle"
import { CHAMPION_ROWS, CHAMPION_TITLE, TIER_COLUMNS, championRow } from "../lib/tier-rows"

const SORT_OPTIONS = [
  { value: "name",     label: "Alphabetical",  icon: undefined },
  { value: "class",    label: "Class",          icon: undefined },
  { value: "faction",  label: "Faction",        icon: undefined },
  { value: "rank",     label: "Rarity",         icon: undefined },
  { value: "tier",     label: "Tier Ranking",   icon: "/images/site/Q GOLD FULL ICON.png" },
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

const TIERS = ["S+", "S", "A+", "A", "B", "C", "D"]

const WHALE_SKIP_VALUES = [
  "Top Tier",
  "High Value",
  "Situational / Roster Dependent",
  "Luxury",
  "Skip / Do Not Build",
  "Passively Invest Only",
]

const tierToRank: Record<string, number> = { "S+": 0, S: 1, "A+": 2, A: 3, B: 4, C: 5, D: 6 }
const rankToRank: Record<string, number> = { Iconic: 0, "Mythic +": 1, Mythic: 2, Legendary: 3, Epic: 4, "": 5 }

function factionIconSrc(id: string): string {
  const override: Record<string, string> = { deathmetal: "death_metal" }
  return `/dcdl/synergies/tag_images/${override[id] ?? id}.png`
}

function SortButton({ label, icon, selected, onClick }: { label: string; icon?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
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
        display: "flex",
        alignItems: "center",
      }}
    >
      {icon
        ? <img src={icon} alt={label} style={{ height: "1.1rem", objectFit: "contain", opacity: selected ? 1 : 0.55 }} />
        : label}
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

function IconFilterButton({ src, descSrc, label, selected, onClick }: {
  src: string; descSrc?: string; label: string; selected: boolean; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleEnter = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setCoords({ top: rect.bottom + 8, left: rect.left + rect.width / 2 })
    }
    setHovered(true)
  }

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        ref={btnRef}
        type="button"
        title={label}
        onClick={onClick}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setHovered(false)}
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
        }}
      >
        <img src={src} alt={label} style={{ width: "2.25rem", height: "2.25rem", objectFit: "contain" }} />
      </button>
      {hovered && descSrc && (
        <div style={{
          position: "fixed",
          top: coords.top,
          left: coords.left,
          transform: "translateX(-50%)",
          zIndex: 9999,
          pointerEvents: "none",
          background: "#100824",
          border: "1px solid #3a2a5a",
          borderRadius: "0.75rem",
          padding: "0.5rem",
          boxShadow: "0 16px 48px rgba(0,0,0,0.85)",
        }}>
          <img src={descSrc} alt={label} style={{ width: "480px", maxWidth: "85vw", borderRadius: "0.5rem", display: "block" }} />
        </div>
      )}
    </div>
  )
}

function RarityButton({ rarity, selected, onClick }: { rarity: string; selected: boolean; onClick: () => void }) {
  const s = RARITY_STYLE[rarity] ?? { background: "#555" }
  return (
    <button
      type="button"
      onClick={onClick}
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
      {rarity}
    </button>
  )
}

function toggle(arr: string[], val: string, set: (v: string[]) => void) {
  set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val])
}

export default function HeroGrid({ heros, synergyDescImages = {}, dateLine }: {
  heros: HeroResolved[]
  synergyDescImages?: Record<string, string>
  /** "Updated ..." line for the tier list export. */
  dateLine?: string
}) {
  const [view, setView] = useViewMode("qgg:dcdl-champions-view")
  const [communityTiers, setCommunityTiers] = useState<Record<string, string>>({})
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [selectedFactions, setSelectedFactions] = useState<string[]>([])
  const [selectedRarities, setSelectedRarities] = useState<string[]>([])
  const [selectedTiers, setSelectedTiers] = useState<string[]>([])
  const [selectedWhaleSkip, setSelectedWhaleSkip] = useState<string[]>([])

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
    setSelectedWhaleSkip([])
  }

  const isTier = view === "tier"

  // One predicate for both views: the grid drops non-matches, the tier list
  // dims them. The tier filter only exists in the grid; on the tier list the
  // rows already are the tiers.
  const matches = (hero: HeroResolved) => {
    if (query && !hero.name.toLowerCase().includes(query.toLowerCase())) return false
    if (selectedClasses.length > 0 && !selectedClasses.includes(hero.class)) return false
    if (selectedFactions.length > 0 && !hero.tagSynergies.some((s) => selectedFactions.includes(s.id))) return false
    if (selectedRarities.length > 0 && !selectedRarities.includes(hero.rarity)) return false
    if (!isTier && selectedTiers.length > 0 && !selectedTiers.includes(hero.tier ?? "")) return false
    if (selectedWhaleSkip.length > 0 && !selectedWhaleSkip.includes(hero.whaleOrSkipValue ?? "")) return false
    return true
  }

  // Names the active filters for the "Export Highlighted" header.
  const highlightParts = [
    query.trim() && `"${query.trim()}"`,
    ...selectedClasses,
    ...selectedFactions.map((id) => FACTIONS.find((f) => f.id === id)?.label ?? id),
    ...selectedRarities,
    ...selectedWhaleSkip,
  ].filter(Boolean) as string[]
  const highlight = highlightParts.length > 0 ? highlightParts.join(", ") : null
  const matchCount = heros.filter(matches).length

  const filtered = heros
    .filter(matches)
    .sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1
      if (sortBy === "name")     return dir * a.name.localeCompare(b.name)
      if (sortBy === "tier")     return dir * ((tierToRank[b.tier ?? ""] ?? 9) - (tierToRank[a.tier ?? ""] ?? 9))
      if (sortBy === "class")    return dir * a.class.localeCompare(b.class)
      if (sortBy === "faction")  return dir * ((a.tagSynergies[0]?.name ?? "").localeCompare(b.tagSynergies[0]?.name ?? ""))
      if (sortBy === "rank")     return dir * ((rankToRank[a.rarity ?? ""] ?? 5) - (rankToRank[b.rarity ?? ""] ?? 5))
      return 0
    })

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? ""

  const groups: FilterGroup[] = [
    ...(!isTier ? [{
      id: "sort",
      label: "Sort",
      value: `${sortLabel} ${sortOrder === "asc" ? "↑" : "↓"}`,
      content: (
        <>
          {SORT_OPTIONS.map(({ value, label, icon }) => (
            <SortButton key={value} label={label} icon={icon} selected={sortBy === value} onClick={() => setSortBy(value)} />
          ))}
          <SortButton label="↑ Asc" selected={sortOrder === "asc"} onClick={() => setSortOrder("asc")} />
          <SortButton label="↓ Desc" selected={sortOrder === "desc"} onClick={() => setSortOrder("desc")} />
        </>
      ),
    }] : []),
    {
      id: "class",
      label: "Class",
      count: selectedClasses.length,
      onClear: () => setSelectedClasses([]),
      content: CLASSES.map(({ id, label }) => (
        <IconFilterButton
          key={id}
          src={`/dcdl/role_images/${id}.png`}
          label={label}
          selected={selectedClasses.includes(id)}
          onClick={() => toggle(selectedClasses, id, setSelectedClasses)}
        />
      )),
    },
    {
      id: "faction",
      label: "Faction",
      count: selectedFactions.length,
      onClear: () => setSelectedFactions([]),
      content: FACTIONS.map(({ id, label }) => (
        <IconFilterButton
          key={id}
          src={factionIconSrc(id)}
          descSrc={synergyDescImages[id]}
          label={label}
          selected={selectedFactions.includes(id)}
          onClick={() => toggle(selectedFactions, id, setSelectedFactions)}
        />
      )),
    },
    {
      id: "rarity",
      label: "Rarity",
      count: selectedRarities.length,
      onClear: () => setSelectedRarities([]),
      content: RARITIES.map((r) => (
        <RarityButton key={r} rarity={r} selected={selectedRarities.includes(r)} onClick={() => toggle(selectedRarities, r, setSelectedRarities)} />
      )),
    },
    {
      id: "whale",
      label: "Whale / Skip",
      count: selectedWhaleSkip.length,
      onClear: () => setSelectedWhaleSkip([]),
      content: WHALE_SKIP_VALUES.map((v) => (
        <SortButton key={v} label={v} selected={selectedWhaleSkip.includes(v)} onClick={() => toggle(selectedWhaleSkip, v, setSelectedWhaleSkip)} />
      )),
    },
    // Tier filter: grid only, since on the tier list the rows already are the tiers.
    ...(!isTier ? [{
      id: "tier",
      label: "Quantum Tier",
      count: selectedTiers.length,
      onClear: () => setSelectedTiers([]),
      content: TIERS.map((t) => (
        <TierFilterButton key={t} tier={t} selected={selectedTiers.includes(t)} onClick={() => toggle(selectedTiers, t, setSelectedTiers)} />
      )),
    }] : []),
  ]

  const remove = (arr: string[], val: string, set: (v: string[]) => void) => () => set(arr.filter((x) => x !== val))
  const pills: FilterPill[] = [
    ...selectedClasses.map((c) => ({ key: `c-${c}`, label: c, icon: `/dcdl/role_images/${c}.png`, onRemove: remove(selectedClasses, c, setSelectedClasses) })),
    ...selectedFactions.map((f) => ({
      key: `f-${f}`, label: FACTIONS.find((x) => x.id === f)?.label ?? f, icon: factionIconSrc(f),
      onRemove: remove(selectedFactions, f, setSelectedFactions),
    })),
    ...selectedRarities.map((r) => ({ key: `r-${r}`, label: r, onRemove: remove(selectedRarities, r, setSelectedRarities) })),
    ...selectedWhaleSkip.map((v) => ({ key: `w-${v}`, label: v, onRemove: remove(selectedWhaleSkip, v, setSelectedWhaleSkip) })),
    ...(!isTier ? selectedTiers.map((t) => ({ key: `t-${t}`, label: `Tier ${t}`, onRemove: remove(selectedTiers, t, setSelectedTiers) })) : []),
  ]

  return (
    <div className="flex flex-col gap-4 w-full">
    <div className="flex flex-col gap-3 w-full max-w-4xl self-center">
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
        <ViewToggle view={view} onChange={setView} />
        <div style={{ flex: "1 1 12rem", minWidth: 0 }}>
          <SearchBar placeholder="Search heroes" onChange={(e) => setQuery(e.target.value)} style={CONTROL_INPUT} />
        </div>
        <Button onClick={resetFilters} style={CONTROL_BUTTON}>Reset</Button>
      </div>

      <FilterBar
        groups={groups}
        pills={pills}
        after={isTier && highlight ? (
          <span style={{ fontSize: "0.75rem", color: "#aaa", marginLeft: "0.25rem" }}>
            Highlighting {matchCount} of {heros.length}
          </span>
        ) : undefined}
      />

      {!isTier && (
        <div className="grid w-full max-w-4xl grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((hero) => (
            <HeroBox key={hero.id} hero={hero} communityTier={communityTiers[hero.id]} />
          ))}
        </div>
      )}
    </div>

      {isTier && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <TierExportBar
              title="Quantum's Champion Tier List"
              filename="quantum-champion-tier-list"
              dateLine={dateLine}
              rows={CHAMPION_ROWS}
              columns={TIER_COLUMNS}
              highlight={highlight}
              watermark={{ src: "/dcdl/combat-cycle/LaughBatman.png", side: "right" }}
              items={heros.map((h) => ({
                id: h.id, name: h.name, img: h.imageHeadshot ?? null, tier: championRow(h),
                group: h.class ?? "", isNew: h.isNew, isP2W: h.isP2W, previousTier: h.previousTier,
                dimmed: !matches(h),
              }))}
            />
          </div>
          <TierView
            title={CHAMPION_TITLE}
            rows={CHAMPION_ROWS}
            columns={TIER_COLUMNS}
            watermark={{ src: "/dcdl/combat-cycle/LaughBatman.png", side: "right" }}
            entries={heros.map((hero) => ({
              id: hero.id,
              row: championRow(hero),
              group: hero.class ?? "",
              dim: !matches(hero),
              node: <HeroBox hero={hero} communityTier={communityTiers[hero.id]} compact />,
            }))}
          />
        </>
      )}
    </div>
  )
}
