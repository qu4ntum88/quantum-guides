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
- `/members` — authenticated community voting hub
- `/admin/dcdl` — admin form for adding/editing champions and legacy pieces
- `/api/votes` — GET (user's votes) / POST (cast/update vote), requires Clerk auth
- `/api/votes/tally` — public aggregated vote counts
- `/api/admin/dcdl/champions` and `/api/admin/dcdl/legacy` — write champion/legacy data to disk

**Data** — Champion and legacy piece data lives in JSON files at `src/dcdl/data/heros.json` and `src/dcdl/data/legacy.json`. These are read at build time for static generation and at runtime by admin API routes (which write back to them). Faction/synergy metadata is in `src/dcdl/data/synergies.json`.

**Images** — Stored in `public/dcdl/` subdirectories (`full_images/`, `skill_images/`, `globalskill_images/`, `upgrade_images/`, `legacy/`, etc.). Paths in the JSON are relative strings like `./full_images/Hero_full.png`.

**Voting** — Supabase `votes` table with columns `user_id`, `entity_type` (`champion` | `legacy`), `entity_id`, `rating` (`S+` | `S` | `A+` | `A` | `B` | `C` | `D`). Unique constraint on `(user_id, entity_type, entity_id)`. The tally route aggregates all votes and picks the plurality winner per entity.

**Auth** — Clerk. `useUser()` / `auth()` for client/server respectively. `supabaseAdmin` uses the service role key and bypasses RLS for all server-side writes.

## External services

- **Clerk** — auth (env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
- **Supabase** — votes storage (env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- **Vercel** — hosting; deploys automatically on push to `main`, or manually via `npx vercel --prod`

## Key files

| File | Purpose |
|------|---------|
| `src/dcdl/data/heros.json` | All champion data |
| `src/dcdl/data/legacy.json` | All legacy piece data |
| `src/dcdl/data/synergies.json` | Faction/tag metadata |
| `src/dcdl/components/VotingWidget.tsx` | Community voting UI used on detail pages |
| `src/dcdl/components/HeroGrid.tsx` | Champion grid with sort/filter |
| `src/dcdl/components/LegacyGrid.tsx` | Legacy grid with sort/filter |
| `src/dcdl/components/TierBadge.tsx` | Tier color badge (S+ through D) |
| `app/api/votes/route.ts` | Vote submit/fetch API |
| `app/api/votes/tally/route.ts` | Vote aggregation API |
| `app/admin/dcdl/page.tsx` | Admin panel |
| `src/lib/supabase.ts` | Supabase client (public) and admin (service role) |
