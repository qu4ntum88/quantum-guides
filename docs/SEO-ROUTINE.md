# SEO Routine — Quantum Game Guides

A repeatable checklist for keeping the site climbing in Google. Most of it lives in
**Google Search Console** (search.google.com/search-console, property
`quantumgameguides.com`). The code-side rules are in `CLAUDE.md` under **SEO**.

> **Request-indexing limit:** Search Console lets you request indexing for roughly
> **10 URLs per day**. Spend them on pages that are new or that just changed in a
> big way. The sitemap covers everything else on its own.

---

## How to request indexing (refresher)

1. Paste the full URL into the **search bar at the very top** of Search Console and press Enter.
2. Wait for the check to finish (about a minute).
3. Click **Request indexing**.
4. If it says "URL is on Google", the page is already indexed. Only request again when the page has changed meaningfully, for example a tier list update.

---

## Weekly (about 15 minutes, pick a fixed day)

1. **Performance check.** Go to **Performance → Search results**, turn on all four boxes (Clicks, Impressions, CTR, Position), set the date range to **Last 28 days**, and open the **Queries** tab.
   - **Position 5–20 with lots of impressions** = almost on page one. Note these searches. They are the best ones to improve: add a section, a guide, or a clearer title aimed at that exact search.
   - **Position 1–5 with low CTR (under ~3%)** = people see you but don't click. Rewrite that page's title or description to be more specific, for example with the month, a champion name, or a number.
   - **A search you rank for with no page built for it** = an idea for a new guide.
2. **Tier list updates.** If you changed the champion or legacy tiers this week, request indexing for:
   - https://www.quantumgameguides.com/games/dc-dark-legion
   - https://www.quantumgameguides.com/games/dc-dark-legion/legacy
3. **New guide published?** Request indexing for its URL, which is shown in `/admin/content`. Give it a real one-to-two sentence **description**, because that is what Google shows under the link.
4. **Share links to specific pages, not just the homepage**, in Discord, Reddit and your YouTube descriptions/pinned comments. For example, link the champion page in a video about that champion. Links from other sites are still one of Google's strongest ranking signals.

## Every game patch / new champion

1. Run the usual data refresh (kit sync, tiers). Commit and push.
2. Request indexing for each **new champion's page** and each **new legacy piece's page**:
   - Champion: `https://www.quantumgameguides.com/games/dc-dark-legion/heros/<id>`
   - Legacy piece: `https://www.quantumgameguides.com/games/dc-dark-legion/legacy/<id>`
3. Request indexing for the tier list pages (above) and, if they changed:
   - https://www.quantumgameguides.com/games/dc-dark-legion/best-teams
   - https://www.quantumgameguides.com/games/dc-dark-legion/combat-cycle
4. Publish patch notes in `/admin/content`. A fresh, dated page helps the guides hub look current.

## Monthly (about 30 minutes)

1. **Pages → Indexing** (left menu): check how many pages are **Indexed** versus **Not indexed**. Click into each "Why pages aren't indexed" reason:
   - *Crawled – currently not indexed* / *Discovered – currently not indexed*: Google found the page but doesn't think it's worth indexing yet. Add unique text, link to it from more places, and request indexing for the most important ones.
   - *Not found (404)* / *Server error (5xx)*: something is broken. Tell Claude the URL.
   - *Alternate page with proper canonical tag*: **this is fine.** These are `?view=grid`-style variants pointing at the real page.
   - *Excluded by 'noindex' tag*: fine for sign-in, sign-up, members and studio. Anything else is a bug.
2. **Sitemaps** (left menu): status should be **Success**, and the discovered count should roughly match the site (about 210 pages as of October 2026, plus each new champion, legacy piece and guide).
3. **Experience → Core Web Vitals**: if pages show as "Poor" or "Needs improvement", ask Claude to look at speed for those URL groups. Font loading is a known candidate.
4. **Compare months:** in Performance, use **Compare → last 28 days vs previous period**. Write down total clicks and impressions in the log at the bottom of this file so you can see the trend.
5. **Refresh old guides:** guides with dates in the title ("October 2025 Tier Lists") lose rankings once they're stale. Either update them or publish a new dated version and link the old one to the new one.

## When a new game section goes live (Godforge, Invokers, …)

With four games on the site this is where the biggest jumps come from. Each game adds a new set of searches like "<game> tier list", "<hero> build" and "<game> best team".

**Before launch (code — ask Claude to check each item):**
- [ ] Flip the game on in `src/lib/siteConfig.ts` (`PUBLIC_SECTIONS`). That also removes the `robots.txt` block for it.
- [ ] Every page uses `pageMeta()` from `src/lib/seo.ts` with a title aimed at a real search: "<Game> Tier List (Month Year)", "<Hero> <Game> Build & Guide", and so on.
- [ ] Every page is in `app/sitemap.ts`: hub, database, tier list, status effects, and one entry per hero.
- [ ] Breadcrumb JSON-LD on every page: add a `<GAME>_CRUMB` next to `DCDL_CRUMB` in `seo.ts`.
- [ ] Each hero/entity has **its own page** (not only a pop-up) with unique text. Thin pages that are just an image don't rank and count against AdSense.
- [ ] The homepage "Popular" row and the navbar link to the new game's tier list and hub.
- [ ] The page's main heading names the game and the page type, for example "Godforge Tier List", not just "Godforge".

**Launch day (Search Console):**
1. Push the deploy, then open **Sitemaps** and confirm it re-read successfully. Submit `https://www.quantumgameguides.com/sitemap.xml` again if you like; it doesn't hurt.
2. Request indexing (this uses your ~10/day):
   - the game's hub page
   - the game's tier list
   - the hero database
   - the 5–7 most popular heroes' pages
3. Announce it with **direct links** in that game's Discord and subreddit and in a YouTube video description.

**First month after launch:** run the weekly Performance check filtered to that game. Click **+ New → Page → URLs containing** `/games/<game-slug>` to see only that section.

---

## Game hub SEO plans

Every game hub gets the same skeleton as DC: Dark Legion, because that page set is what people search for in a gacha game. Use the **target searches** to name pages and write titles. Then check them against real numbers in **Performance → Queries** a few weeks after launch, and adjust titles toward what people actually type.

**The standard page set for every game:**

| Page | URL pattern | Target searches | Title pattern |
|---|---|---|---|
| Hub | `/games/<game>/guides` | "<game> guide", "<game> beginner guide" | `<Game> Guides & Tools` |
| Tier list | `/games/<game>/tier-list` (or the database with a tier view) | "<game> tier list", "<game> best heroes" | `<Game> Tier List (Month Year): All Heroes Ranked` |
| Hero database | `/games/<game>/heroes` | "<game> heroes list", "<game> characters" | `<Game> Hero Database` |
| One page per hero | `/games/<game>/heroes/<id>` | "<hero> <game>", "<hero> build", "<hero> guide" | `<Hero>: <Game> Build, Skills & Tier` |
| Best teams | `/games/<game>/best-teams` | "<game> best team", "<game> team comp" | `Best Teams in <Game>: Top Team Comps` |
| Status effects / glossary | `/games/<game>/status-effects` | "<game> buffs and debuffs", "<effect> <game>" | `<Game> Status Effects: Every Buff & Debuff` |
| Mode/boss guides | `/games/<game>/<mode>` | "<game> <boss/mode> guide", "how to beat <boss>" | `<Boss> Guide: <Game> Best Counters` |

Every page also gets: `pageMeta()`, breadcrumb JSON-LD, a sitemap entry, a share image (`opengraph-image.tsx` next to entity pages, the logo card everywhere else), and **unique text**, not just a grid of images.

### DC: Dark Legion — live (October 2026)
Has the full set: champion and legacy tier lists, a page per champion and per legacy piece, best teams, Combat Cycle, the Gotham planner, Supreme Commander, guides and patch notes.
- **Grow it with:** guides aimed at what Performance shows people searching for, and Quantum's Takes on every champion.
- **Next ideas to check against Search Console:** a guide page per Combat Cycle boss (only Devastator and Merciless have one), and "how to get <champion>" sections on champion pages.

### Void Hunters — live
Has the hub, hunter database, a page per hunter and status effects.
- **Missing from the standard set:** a tier list and a best-teams page. Those are the two most-searched page types for any gacha game, so they're the first things to add.
- The hunter pages should be brought onto `pageMeta()`, breadcrumbs and share images, the same as the DC: Dark Legion champion pages.

### Godforge — hidden until the rebuild
Data comes from the pipeline export, with **godforge.gg as the source of truth**. Planned page set:
- hub, a hero database with a tier view, and a page per hero (stats, kit, rarity/affinity/archetype/faction)
- the tier list, status effects, and the dungeons (a page per dungeon/boss: "<dungeon> Godforge guide")
- the Campaign Star Planner, once it's made public. Tools like this pull links and repeat visits.

Hero pages need **unique text** before launch (Quantum's Take or a short role summary). 200+ near-identical pages that are only stats can be flagged as low-value by Google and AdSense.

### Invokers — not on the site yet
The data covers kits at all levels, stats and 32 official tier lists. **Creator-program NDA: only already-released content goes on the site.**
- Planned page set: the standard set above, built on the official data.
- The 32 official tier lists are a strong angle: "Invokers tier list by mode/<role>" pages with Quantum's commentary beside the official rankings.

---

## Priority indexing list (current — DC: Dark Legion)

Request these once after a major deploy, about 10 a day, top to bottom. Day 1 is the most important.

**Day 1 — hubs and tier lists**
1. https://www.quantumgameguides.com/
2. https://www.quantumgameguides.com/games/dc-dark-legion
3. https://www.quantumgameguides.com/games/dc-dark-legion/legacy
4. https://www.quantumgameguides.com/games/dc-dark-legion/best-teams
5. https://www.quantumgameguides.com/games/dc-dark-legion/combat-cycle
6. https://www.quantumgameguides.com/games/dc-dark-legion/guides
7. https://www.quantumgameguides.com/games/dc-dark-legion/ship-combat-guides
8. https://www.quantumgameguides.com/games/dc-dark-legion/supreme-commander
9. https://www.quantumgameguides.com/games/dc-dark-legion/infographics
10. https://www.quantumgameguides.com/games/dc-dark-legion/patch-notes

**Day 2 — S+ champions** (the ones people search most)
1. https://www.quantumgameguides.com/games/dc-dark-legion/heros/supergirl_woman_of_tomorrow_kara_zor_el
2. https://www.quantumgameguides.com/games/dc-dark-legion/heros/death_metal_batman
3. https://www.quantumgameguides.com/games/dc-dark-legion/heros/nightwing
4. https://www.quantumgameguides.com/games/dc-dark-legion/heros/the_riddler
5. https://www.quantumgameguides.com/games/dc-dark-legion/heros/swamp_thing
6. https://www.quantumgameguides.com/games/dc-dark-legion/heros/zatanna
7. https://www.quantumgameguides.com/games/dc-dark-legion/heros/beast_boy
8. https://www.quantumgameguides.com/games/dc-dark-legion/heros/hippolyta
9. https://www.quantumgameguides.com/games/dc-dark-legion/heros/sinestro
10. https://www.quantumgameguides.com/games/dc-dark-legion/legacy/community-tier

**Day 3 — top legacy pieces (new pages as of October 2026)**
1. https://www.quantumgameguides.com/games/dc-dark-legion/legacy/super_six_string
2. https://www.quantumgameguides.com/games/dc-dark-legion/legacy/starfires_starbolts
3. https://www.quantumgameguides.com/games/dc-dark-legion/legacy/themysciran_sceptre
4. https://www.quantumgameguides.com/games/dc-dark-legion/legacy/absorption_collar
5. https://www.quantumgameguides.com/games/dc-dark-legion/legacy/blackest_bats
6. https://www.quantumgameguides.com/games/dc-dark-legion/legacy/sinestro_corps_ring
7. https://www.quantumgameguides.com/games/dc-dark-legion/legacy/conundrum_cane
8. https://www.quantumgameguides.com/games/dc-dark-legion/legacy/cloak_of_destiny
9. https://www.quantumgameguides.com/games/dc-dark-legion/legacy/teen_titans_utility_belt
10. https://www.quantumgameguides.com/games/dc-dark-legion/legacy/green_lantern_power_belt

**Day 4 — S-tier champions**
1. https://www.quantumgameguides.com/games/dc-dark-legion/heros/starfire
2. https://www.quantumgameguides.com/games/dc-dark-legion/heros/DMWW
3. https://www.quantumgameguides.com/games/dc-dark-legion/heros/hawkgirl
4. https://www.quantumgameguides.com/games/dc-dark-legion/heros/the_joker
5. https://www.quantumgameguides.com/games/dc-dark-legion/heros/superboy
6. https://www.quantumgameguides.com/games/dc-dark-legion/heros/lobo
7. https://www.quantumgameguides.com/games/dc-dark-legion/heros/doctor_fate_mythic
8. https://www.quantumgameguides.com/games/dc-dark-legion/heros/mr_freeze
9. https://www.quantumgameguides.com/games/dc-dark-legion/heros/the_flash_mythic_plus
10. https://www.quantumgameguides.com/games/dc-dark-legion/heros/green_lantern_mythic_plus

**Day 5 — Void Hunters**
1. https://www.quantumgameguides.com/games/void-hunters/guides
2. https://www.quantumgameguides.com/games/void-hunters
3. https://www.quantumgameguides.com/games/void-hunters/status-effects

Everything else (the remaining champions, legacy pieces, guides and hunters) is in the sitemap. Google will get to those without requests.

---

## Things that help AdSense approval too

AdSense rejects sites for "low value content" when pages are thin, duplicated or hard to navigate. The same things that help search rankings help here:

- Every page should have **unique text**, not just images or a grid. The legacy piece pages and champion pages now do. Keep adding Quantum's Takes.
- Guides need a real **description** and real body text, not just embedded images.
- Keep **About**, **Privacy Policy**, **Terms** and **Disclaimer** linked in the footer (they are).
- Don't publish empty or "coming soon" pages. Keep hidden sections hidden (`PUBLIC_SECTIONS`) until they have content.

---

## Progress log

Record the 28-day totals once a month from **Performance** (Clicks / Impressions / Average position).

| Month | Clicks | Impressions | Avg position | Indexed pages | Notes |
|---|---|---|---|---|---|
| Oct 2026 | | | | | SEO overhaul deployed: page titles, 68 legacy pages, sitemap 139 → 210 |
| | | | | | |
