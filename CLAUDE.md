# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```

There are no tests. Deploy via `git push origin main` — Vercel auto-deploys from GitHub. Do NOT also run `npx vercel --prod`; that creates duplicate deployments and the CLI deploy frequently hangs.

## What this is

Quantum Game Guides — a community hub for DC: Dark Legion (primary) plus Godforge and Void Hunters. Features a champion/legacy database, community tier voting, MDX guides, and an admin panel for managing game data.

## Architecture

**Routing** — Next.js App Router. Key routes:
- `/games/dc-dark-legion/heros/[id]` — statically generated champion detail pages
- `/games/dc-dark-legion/legacy/[id]` — statically generated legacy piece pages
- `/games/godforge/heroes` — Godforge hero grid (206 heroes, filterable by affinity/allegiance/archetype/faction)
- `/games/godforge/status-effects` — Godforge status effects grid (105 effects, filterable by buff/debuff/disable)
- `/games/void-hunters` — Void Hunters hunter grid
- `/games/void-hunters/status-effects` — Void Hunters status effects
- `/members` — authenticated community voting hub
- `/admin/dcdl` — admin panel for DCDL, Void Hunters, and Godforge
- `/api/votes` — GET (user's votes) / POST (cast/update vote), requires Clerk auth
- `/api/votes/tally` — public aggregated vote counts
- `/api/admin/dcdl/champions` and `/api/admin/dcdl/legacy` — write champion/legacy data to disk
- `/api/admin/gf/heroes` — GET (hero list or single hero) / PATCH (update hero attributes)

**Data** — Champion and legacy piece data lives in JSON files at `src/dcdl/data/heros.json` and `src/dcdl/data/legacy.json`. Godforge data lives in `src/gf/data/heroes.json` (206 heroes) and `src/gf/data/status-effects.json` (105 effects). All JSON files are read at build time for static generation and at runtime by admin API routes (which write back to them).

**Godforge hero data shape:**
```ts
{ id, name, fullArt, portrait, rarity, affinity, allegiance, archetype, faction }
// portrait: path to transparent-bg portrait PNG | null (falls back to fullArt when null)
// rarity: 'Legendary' | 'Epic' | 'Rare' | 'Uncommon' | 'Common' | null
// affinity: 'Cunning' | 'Eternal' | 'Strength' | 'Wisdom' | null
// allegiance: 'Chaos' | 'Order' | null
// archetype: 'Brawler' | 'Defender' | 'Disrupter' | 'Invoker' | 'Slayer' | null
// faction: 'AARU' | 'ASGARD' | 'AVALON' | 'EKUR' | 'IZUMO' | 'OLYMPUS' | 'OMEYOCAN' | 'TIAN' | 'VYRAJ' | null
```
All 206 heroes are pre-seeded from image filenames; all non-id/name/fullArt fields start as null and are filled via the admin panel. When `portrait` is set (transparent-bg PNG), the card shows the portrait with a rarity-colored gradient background instead of the full art. Rarity glow colors: Legendary=#f59e0b, Epic=#a855f7, Rare=#3b82f6, Uncommon=#22c55e, Common=#6b7280.

**Godforge status effect data shape:**
```ts
{ id, name, category: 'buff' | 'debuff' | 'disable', image, description }
```
Arcane Aegis and Temporal Aegis each have 3 tiered entries (I/II/III) sharing one icon. Lock Core/Lock Passive/Lock Ultimate have icons but no descriptions yet.

**Images** — DCDL: `public/dcdl/` subdirectories. Godforge: `public/godforge/gf_heroes/` (full_art, affinity, allegiances, archetypes, factions) and `public/godforge/gf_status_effects/` (buffs, debuffs, disables). VH: `public/vh/`.

**Godforge corner icon convention** (on hero cards): faction = top-left, archetype = top-right, affinity = bottom-left, allegiance = bottom-right. Icon paths follow: `/godforge/gf_heroes/factions/{FACTION}.png`, `/godforge/gf_heroes/archetypes/Archetype_{Archetype}.png`, `/godforge/gf_heroes/affinity/{Affinity}.png`, `/godforge/gf_heroes/allegiances/Allegiance_{Allegiance}.png`.

**Gotham map** (`app/games/dc-dark-legion/ship-combat-guides/page.tsx`) — SVG-based interactive map for Battle For Gotham and Ultimate Battle For Gotham. The 256×256 map grid is rotated 45° inside a `<g transform="rotate(45, 128, 128)">` to display as a diamond. The SVG element uses CSS `clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)` to hide the black corner areas. Building images (City Hall, Armories, Player Base) are rendered **outside** the rotation group at pre-computed SVG root coordinates (`toSvg()` helper) so they appear upright. Grid footprint tints remain inside the rotation group. Click-to-place un-rotates screen coordinates back to map space before snapping to the tile grid (`TILE = 2` SVG units). Approximate building sizes: City Hall 10×10 tiles (20 SVG units), Plazas + Armories 6×6 tiles (12 SVG units), Player Base 2×2 tiles (4 SVG units). The player's base image/label is `public/dcdl/resource_icons/Gotham_PlayerBase.png`; City Hall is `Gotham_CityHall.png`; Armory is `Gotham_Armory.png`. Future work: multi-base support (league members), possible 3D tilt (CSS perspective wrapper — coordinate math becomes approximate).

**DCDL copyright footer** — added in `app/games/dc-dark-legion/layout.tsx`; applies to all DCDL sub-pages only.

**Voting** — Supabase `votes` table with columns `user_id`, `entity_type` (`champion` | `legacy`), `entity_id`, `rating` (`S+` | `S` | `A+` | `A` | `B` | `C` | `D`). Unique constraint on `(user_id, entity_type, entity_id)`. The tally route aggregates all votes and picks the plurality winner per entity.

**Auth** — Clerk. `useUser()` / `auth()` for client/server respectively. `supabaseAdmin` uses the service role key and bypasses RLS for all server-side writes.

## External services

- **Clerk** — auth (env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
- **Supabase** — votes storage (env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- **Vercel** — hosting; auto-deploys on push to `main` via GitHub integration (preferred method)

## Key files

| File | Purpose |
|------|---------|
| `src/dcdl/data/heros.json` | All DCDL champion data |
| `src/dcdl/data/legacy.json` | All DCDL legacy piece data |
| `src/dcdl/data/synergies.json` | DCDL faction/tag metadata |
| `src/gf/data/heroes.json` | All Godforge hero data (206 heroes) |
| `src/gf/data/status-effects.json` | All Godforge status effects (105 effects) |
| `src/gf/components/GfHeroBox.tsx` | Godforge hero card with corner attribute icons |
| `src/gf/components/GfHeroGrid.tsx` | Godforge hero grid with sort/filter |
| `src/gf/components/GfStatusEffectBox.tsx` | Godforge status effect card with hover tooltip |
| `src/gf/components/GfStatusEffectGrid.tsx` | Godforge status effects grid with category tabs |
| `src/dcdl/components/VotingWidget.tsx` | Community voting UI used on detail pages |
| `src/dcdl/components/HeroGrid.tsx` | DCDL champion grid with sort/filter |
| `src/dcdl/components/LegacyGrid.tsx` | DCDL legacy grid with sort/filter |
| `src/dcdl/components/TierBadge.tsx` | Tier color badge (S+ through D) |
| `app/api/votes/route.ts` | Vote submit/fetch API |
| `app/api/votes/tally/route.ts` | Vote aggregation API |
| `app/api/admin/gf/heroes/route.ts` | Godforge hero read/update API |
| `app/admin/dcdl/page.tsx` | Admin panel (DCDL + Void Hunters + Godforge tabs) |
| `src/lib/supabase.ts` | Supabase client (public) and admin (service role) |
| `app/games/dc-dark-legion/ship-combat-guides/page.tsx` | Interactive Gotham map (diamond SVG + upright building images) |
| `app/games/dc-dark-legion/layout.tsx` | DCDL layout — includes copyright footer |
| `public/ads.txt` | Google AdSense verification file |
