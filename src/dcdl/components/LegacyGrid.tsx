'use client'

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import SearchBar from "./SearchBar"
import LegacyPieceBox from "./LegacyPieceBox"
import { RARITIES, RARITY_STYLE } from "./RarityBadge"
import { TIER_COLORS } from "./TierBadge"
import type { LegacyResolved } from "../lib/data"
import FilterBar, { type FilterGroup, type FilterPill } from "./FilterBar"
import TierView from "./tier/TierView"
import TierExportBar from "./tier/TierExportBar"
import ViewToggle, { useViewMode, CONTROL_BUTTON, CONTROL_INPUT } from "./tier/ViewToggle"
import { LEGACY_ROWS, LEGACY_TITLE, TIER_COLUMNS, legacyRow } from "../lib/tier-rows"

const SORT_OPTIONS = [
  { value: "name", label: "Alphabetical", icon: undefined },
  { value: "role", label: "Role",         icon: undefined },
  { value: "rank", label: "Rarity",       icon: undefined },
  { value: "tier", label: "Tier Ranking", icon: "/images/site/Q GOLD FULL ICON.png" },
]

const ROLES = [
  { value: "Guardian | Warrior",            classes: ["Guardian", "Warrior"] },
  { value: "Magical | Assassin | Firepower", classes: ["Magical", "Assassin", "Firepower"] },
  { value: "Supporter | Intimidator",        classes: ["Supporter", "Intimidator"] },
]

const TIERS = ["S+", "S", "A+", "A", "B", "C", "D"]

const tierToRank: Record<string, number> = { "S+": 0, S: 1, "A+": 2, A: 3, B: 4, C: 5, D: 6, "": 7 }
const rankToRank: Record<string, number> = { Iconic: 0, "Mythic +": 1, Mythic: 2, Legendary: 3, Epic: 4, "": 5 }

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

export default function LegacyGrid({ legacyPieces, dateLine }: {
  legacyPieces: LegacyResolved[]
  /** "Updated ..." line for the tier list export. */
  dateLine?: string
}) {
  const [view, setView] = useViewMode("qgg:dcdl-legacy-view")
  const [communityTiers, setCommunityTiers] = useState<Record<string, string>>({})
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState("tier")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [role, setRole] = useState("All")
  const [selectedRarities, setSelectedRarities] = useState<string[]>([])
  const [selectedTiers, setSelectedTiers] = useState<string[]>([])

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

  const resetFilters = () => {
    setSortBy("tier")
    setSortOrder("asc")
    setRole("All")
    setSelectedRarities([])
    setSelectedTiers([])
  }

  const isTier = view === "tier"

  // One predicate for both views: the grid drops non-matches, the tier list
  // dims them. The tier list only has search: roles are its columns and rarity
  // says little for legacy pieces, so role/rarity/tier filters are grid-only
  // (and ignored in the tier list even if set before switching views).
  const matches = (piece: LegacyResolved) => {
    if (query && !piece.name.toLowerCase().includes(query.toLowerCase())) return false
    if (!isTier && role !== "All" && piece.role !== role) return false
    if (!isTier && selectedRarities.length > 0 && !selectedRarities.includes(piece.rank ?? "")) return false
    if (!isTier && selectedTiers.length > 0 && !selectedTiers.includes(piece.tier ?? "")) return false
    return true
  }

  // Names the active filters for the "Export Highlighted" header.
  const highlightParts = [
    query.trim() && `"${query.trim()}"`,
  ].filter(Boolean) as string[]
  const highlight = highlightParts.length > 0 ? highlightParts.join(", ") : null
  const matchCount = legacyPieces.filter(matches).length

  const filtered = legacyPieces
    .filter(matches)
    .sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1
      if (sortBy === "name") return dir * a.name.localeCompare(b.name)
      if (sortBy === "tier") return dir * ((tierToRank[b.tier ?? ""] ?? 7) - (tierToRank[a.tier ?? ""] ?? 7))
      if (sortBy === "role") return dir * ((a.role ?? "").localeCompare(b.role ?? ""))
      if (sortBy === "rank") return dir * ((rankToRank[a.rank ?? ""] ?? 5) - (rankToRank[b.rank ?? ""] ?? 5))
      return 0
    })

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? ""
  const roleLabel = (value: string) => value.split(" | ").join(" / ")

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
      id: "role",
      label: "Role",
      count: role === "All" ? 0 : 1,
      onClear: () => setRole("All"),
      content: (
        <>
          <AllButton selected={role === "All"} onClick={() => setRole("All")} />
          {ROLES.map(({ value, classes }) => (
            <RoleButton key={value} classes={classes} selected={role === value} onClick={() => setRole(value)} />
          ))}
        </>
      ),
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
    ...(role !== "All" ? [{ key: "role", label: roleLabel(role), onRemove: () => setRole("All") }] : []),
    ...selectedRarities.map((r) => ({ key: `r-${r}`, label: r, onRemove: remove(selectedRarities, r, setSelectedRarities) })),
    ...(!isTier ? selectedTiers.map((t) => ({ key: `t-${t}`, label: `Tier ${t}`, onRemove: remove(selectedTiers, t, setSelectedTiers) })) : []),
  ]

  return (
    <div className="flex flex-col gap-4 w-full">
    <div className="flex flex-col gap-3 w-full max-w-4xl self-center">
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
        <ViewToggle view={view} onChange={setView} />
        <div style={{ flex: "1 1 12rem", minWidth: 0 }}>
          <SearchBar placeholder="Search Legacy Pieces" onChange={(e) => setQuery(e.target.value)} style={CONTROL_INPUT} />
        </div>
        <Button onClick={resetFilters} style={CONTROL_BUTTON}>Reset</Button>
      </div>

      {isTier ? (
        highlight && (
          <span style={{ fontSize: "0.75rem", color: "#aaa" }}>
            Highlighting {matchCount} of {legacyPieces.length}
          </span>
        )
      ) : (
        <FilterBar groups={groups} pills={pills} />
      )}

      {!isTier && (
        <div className="grid w-full max-w-4xl grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((piece) => (
            <LegacyPieceBox key={piece.id} piece={piece} communityTier={communityTiers[piece.id]} />
          ))}
        </div>
      )}
    </div>

      {isTier && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <p style={{ fontSize: "0.78rem", color: "#888", margin: 0 }}>
              Filters highlight matching pieces. F2P and New Players are bracket recommendations, not rankings.
            </p>
            <TierExportBar
              title={LEGACY_TITLE}
              filename="quantum-tyvokka-legacy-piece-tier-list"
              dateLine={dateLine}
              rows={LEGACY_ROWS}
              columns={TIER_COLUMNS}
              highlight={highlight}
              fit="contain"
              watermark={{ src: "/dcdl/combat-cycle/LaughBatman.png", side: "left" }}
              items={legacyPieces.map((l) => ({
                id: l.id, name: l.name, img: l.image ?? null, tier: legacyRow(l),
                group: l.role ?? "", isNew: l.isNew, isP2W: l.isP2W, previousTier: l.previousTier,
                dimmed: !matches(l),
              }))}
            />
          </div>
          <TierView
            title={LEGACY_TITLE}
            rows={LEGACY_ROWS}
            columns={TIER_COLUMNS}
            watermark={{ src: "/dcdl/combat-cycle/LaughBatman.png", side: "left" }}
            entries={legacyPieces.map((piece) => ({
              id: piece.id,
              row: legacyRow(piece),
              group: piece.role ?? "",
              dim: !matches(piece),
              node: <LegacyPieceBox piece={piece} communityTier={communityTiers[piece.id]} compact />,
            }))}
          />
        </>
      )}
    </div>
  )
}
