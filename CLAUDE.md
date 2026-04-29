# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```

There are no tests. Deploy via `npx vercel --prod`.

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
{ id, name, fullArt, affinity, allegiance, archetype, faction }
// affinity: 'Cunning' | 'Eternal' | 'Strength' | 'Wisdom' | null
// allegiance: 'Chaos' | 'Order' | null
// archetype: 'Brawler' | 'Defender' | 'Disrupter' | 'Invoker' | 'Slayer' | null
// faction: 'AARU' | 'ASGARD' | 'AVALON' | 'EKUR' | 'IZUMO' | 'OLYMPUS' | 'OMEYOCAN' | 'TIAN' | 'VYRAJ' | null
```
All 206 heroes are pre-seeded from image filenames; affinity/allegiance/archetype/faction start as null and are filled via the admin panel.

**Godforge status effect data shape:**
```ts
{ id, name, category: 'buff' | 'debuff' | 'disable', image, description }
```
Arcane Aegis and Temporal Aegis each have 3 tiered entries (I/II/III) sharing one icon. Lock Core/Lock Passive/Lock Ultimate have icons but no descriptions yet.

**Images** — DCDL: `public/dcdl/` subdirectories. Godforge: `public/godforge/gf_heroes/` (full_art, affinity, allegiances, archetypes, factions) and `public/godforge/gf_status_effects/` (buffs, debuffs, disables). VH: `public/vh/`.

**Godforge corner icon convention** (on hero cards): faction = top-left, archetype = top-right, affinity = bottom-left, allegiance = bottom-right. Icon paths follow: `/godforge/gf_heroes/factions/{FACTION}.png`, `/godforge/gf_heroes/archetypes/Archetype_{Archetype}.png`, `/godforge/gf_heroes/affinity/{Affinity}.png`, `/godforge/gf_heroes/allegiances/Allegiance_{Allegiance}.png`.

**Voting** — Supabase `votes` table with columns `user_id`, `entity_type` (`champion` | `legacy`), `entity_id`, `rating` (`S+` | `S` | `A+` | `A` | `B` | `C` | `D`). Unique constraint on `(user_id, entity_type, entity_id)`. The tally route aggregates all votes and picks the plurality winner per entity.

**Auth** — Clerk. `useUser()` / `auth()` for client/server respectively. `supabaseAdmin` uses the service role key and bypasses RLS for all server-side writes.

## External services

- **Clerk** — auth (env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
- **Supabase** — votes storage (env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- **Vercel** — hosting; deploys automatically on push to `main`, or manually via `npx vercel --prod`

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
