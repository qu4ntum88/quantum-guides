# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```

There are no tests. Deploy via `git push origin main` — Vercel auto-deploys from GitHub. Do NOT also run `npx vercel --prod`; that creates duplicate deployments and the CLI deploy frequently hangs.

## Future work

- **Godforge Campaign Star Planner** (`/games/godforge/campaign`) — tool is fully built but currently private (returns 404 via `notFound()`). Revisit in a future session to make it public. To re-enable, remove the `notFound()` call at the top of `app/games/godforge/campaign/page.tsx` and add a nav link back in `app/components/Navbar.js`.

- **Content Creator Program** — multi-phase feature, not yet started. Full design context below.

  **Phase 1 — Creator requests + infographic submissions** (ready to build when prioritized):
  - Members page: "Request Content Creator Status" button → Discord name form → submitted to Supabase `creator_requests` table
  - Admin panel: new "Creators" tab to approve/reject requests; on approve, set `user.publicMetadata.isCreator = true` via Clerk backend SDK
  - Approved creators get a new tab on the members page to upload DCDL infographics (title + image) to Supabase `creator_submissions`
  - Admin panel: new "Creator Submissions" tab to approve/reject; approved submissions write through to the main infographics JSON (same flow as the existing admin infographic tool)
  - **DB tables needed** (run in Supabase before building):
    - `creator_requests (id uuid pk, user_id text, discord_name text, status text default 'pending', created_at timestamptz default now())`
    - `creator_submissions (id uuid pk, user_id text, discord_name text, title text, description text, image_url text, status text default 'pending', created_at timestamptz default now())`
  - Auth pattern: gate creator submission routes with `user.publicMetadata.isCreator === true` check; use `supabaseAdmin` for all writes (bypasses RLS)

  **Phase 2 — Per-creator tier rankings** (think through design before building):
  - Community tier votes attributed to individual creators so you can view a specific creator's tier list
  - Likely requires a `creator_id` column on the votes table or a separate `creator_votes` table

  **Phase 3 — Guide creator tier** (think through design before building):
  - Elevated creator permission (`publicMetadata.isGuideCreator`) allowing submission of written guides through the admin guide tool
  - Would need a review/draft flow so guides aren't auto-published

## What this is

Quantum Game Guides — a community hub for DC: Dark Legion (primary) plus Godforge and Void Hunters. Features a champion/legacy database, community tier voting, MDX guides, and an admin panel for managing game data.

## Architecture

**Routing** — Next.js App Router. Key routes:
- `/games/dc-dark-legion/heros/[id]` — statically generated champion detail pages
- `/games/dc-dark-legion/legacy/[id]` — statically generated legacy piece pages
- `/games/godforge/heroes` — Godforge hero grid (202 heroes, filterable by rarity/affinity/allegiance/archetype/faction)
- `/games/godforge/status-effects` — Godforge status effects grid (105 effects, filterable by buff/debuff/disable)
- `/games/void-hunters` — Void Hunters hunter grid
- `/games/void-hunters/status-effects` — Void Hunters status effects
- `/members` — authenticated community voting hub
- `/admin/dcdl` — admin panel for DCDL, Void Hunters, and Godforge
- `/api/votes` — GET (user's votes) / POST (cast/update vote), requires Clerk auth
- `/api/votes/tally` — public aggregated vote counts
- `/api/admin/dcdl/champions` and `/api/admin/dcdl/legacy` — write champion/legacy data to disk
- `/api/admin/gf/heroes` — GET (hero list or single hero) / PATCH (update hero attributes)

**Data** — Champion and legacy piece data lives in JSON files at `src/dcdl/data/heros.json` and `src/dcdl/data/legacy.json`. Godforge data lives in `src/gf/data/heroes.json` (202 heroes) and `src/gf/data/status-effects.json` (105 effects). All JSON files are read at build time for static generation and at runtime by admin API routes (which write back to them).

**Godforge hero data shape:**
```ts
{ id, name, fullArt, portrait, rarity, affinity, allegiance, archetype, faction }
// portrait: path to transparent-bg portrait PNG | null (falls back to fullArt when null)
// rarity: 'Legendary' | 'Epic' | 'Rare' | 'Uncommon' | 'Common' | null
// affinity: 'Cunning' | 'Eternal' | 'Strength' | 'Wisdom' | null
// allegiance: 'Chaos' | 'Order' | null
// archetype: 'Brawler' | 'Defender' | 'Disruptor' | 'Invoker' | 'Slayer' | null
// faction: 'AARU' | 'ASGARD' | 'AVALON' | 'EKUR' | 'IZUMO' | 'OLYMPUS' | 'OMEYOCAN' | 'TIAN' | 'VYRAJ' | null
```
202 heroes after removing 4 alt-art duplicates (Bauk, Cleopatra, Fenrir, Geri alts). All non-id/name/fullArt fields filled via the admin panel. When `portrait` is set (transparent-bg PNG), the card shows the portrait with a rarity-colored gradient background instead of the full art. Rarity glow colors: Legendary=#f59e0b, Epic=#a855f7, Rare=#3b82f6, Uncommon=#22c55e, Common=#6b7280. Portraits live in `public/godforge/gf_heroes/portrait/` as PNGs with backgrounds removed via edge flood-fill (colour-tolerance 50 from detected bg). A few portraits still have imperfect cutouts and need reprocessing — to redo one: extract original JPG from git commit `2b2a154`, adjust tolerance, re-run the flood-fill script.

**Godforge status effect data shape:**
```ts
{ id, name, category: 'buff' | 'debuff' | 'disable', image, description }
```
Arcane Aegis and Temporal Aegis each have 3 tiered entries (I/II/III) sharing one icon. Lock Core/Lock Passive/Lock Ultimate have icons but no descriptions yet.

**Images** — DCDL: `public/dcdl/` subdirectories. Godforge: `public/godforge/gf_heroes/` (full_art, affinity, allegiances, archetypes, factions) and `public/godforge/gf_status_effects/` (buffs, debuffs, disables). VH: `public/vh/`.

**Godforge corner icon convention** (on hero cards): faction = top-left, archetype = top-right, affinity = bottom-left, allegiance = bottom-right. Icon paths follow: `/godforge/gf_heroes/factions/{FACTION}.png`, `/godforge/gf_heroes/archetypes/Archetype_{Archetype}.png`, `/godforge/gf_heroes/affinity/{Affinity}.png`, `/godforge/gf_heroes/allegiances/Allegiance_{Allegiance}.png`.

**Gotham map** (`app/games/dc-dark-legion/ship-combat-guides/page.tsx`) — SVG-based interactive map for Battle For Gotham and Ultimate Battle For Gotham. The 256×256 map grid is rotated 45° inside a `<g transform="rotate(45, 128, 128)">` to display as a diamond. The SVG element uses CSS `clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)` to hide the black corner areas. Building images (City Hall, Armories, Player Base) are rendered **outside** the rotation group at pre-computed SVG root coordinates (`toSvg()` helper) so they appear upright. Grid footprint tints remain inside the rotation group. Click-to-place un-rotates screen coordinates back to map space before snapping to the tile grid (`TILE = 2` SVG units). Approximate building sizes: City Hall 10×10 tiles (20 SVG units), Plazas + Armories 6×6 tiles (12 SVG units), Player Base 2×2 tiles (4 SVG units). The player's base image/label is `public/dcdl/resource_icons/Gotham_PlayerBase.png`; City Hall is `Gotham_CityHall.png`; Armory is `Gotham_Armory.png`. Future work: multi-base support (league members), possible 3D tilt (CSS perspective wrapper — coordinate math becomes approximate).

**Godforge nav dropdown** — Godforge entry in `app/components/Navbar.js` is now a dropdown (Home, Heroes, Status Effects), consistent with DCDL and Void Hunters.

**Navbar hover-gap fix** — Desktop dropdowns now use a 150ms close delay (`closeTimer` ref in `DropdownItem`) so the cursor can travel from trigger to menu without the menu snapping shut.

**DCDL copyright footer** — added in `app/games/dc-dark-legion/layout.tsx`; applies to all DCDL sub-pages only.

**Best Teams** (`app/games/dc-dark-legion/best-teams/page.tsx` + `best-teams.css`, admin tab in `app/admin/dcdl/page.tsx` `BestTeamsForm`, API `app/api/admin/dcdl/best-teams/route.ts`, data `src/dcdl/data/best-teams.json`) — ranked DCDL team comps with a cinematic dark DC look (purple/gold, angular cut-corner cards, metallic rank plates, watermark numerals). Each team has: `name`, `explanation`, positional `required` (always length-5 array, indices 0-1 = **Frontline**, 2-4 = **Backline**, `""` = a **FLEX** slot rendered as a placeholder on the site), `optional` ("**Flex Picks**" in the UI — note the JSON key is still `optional`), and `replacements` (array of `{required, replacements[]}` shown as a Viable Replacements strip). Public page renders required as a 2-over-3 centered formation; Flex Picks render below it; both Frontline/Backline and Flex slots scale down on mobile. Admin tab is drag-and-drop: persistent champion palette (search + portraits), per-slot formation drop targets, a Flex Picks drop zone, replacement rows, per-team name input, add/remove teams, and rank reordering via the ⠿ handle or ▲▼. **Slot rule (the lock):** Flex Picks are only allowed/saved while at least one of the 5 core slots is open; once all 5 are filled the team is "locked" and Flex Picks are stripped on save. CRITICAL: any "is the core full?" check must use `required.filter(Boolean).length >= 5`, NOT `required.length` (the array is always length 5). The API accepts 1–50 teams. Champion portraits use the headshot + rarity returned by the champions admin GET. Champion names render in uppercase Montserrat (added to the Google Fonts link in `app/layout.js`).

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
| `src/gf/data/heroes.json` | All Godforge hero data (202 heroes) |
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
