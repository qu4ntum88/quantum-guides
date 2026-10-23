---
name: patch-day
description: Turn a game update into draft content for Tyler to review, across DC: Dark Legion, Godforge, Invokers and Void Hunters. Finds official posts not yet handled, drafts DCDL History entries and short reaction guides as pending rows, and reports what needs his take. Use after Tyler presses the update buttons, or when he says "patch day", "new update is out", "draft the update posts" or similar. Pass "dry run" to preview without writing anything.
---

# Patch day

Claude is the junior editor here: it drafts, Tyler approves. Everything this skill writes is a **pending draft**. It never publishes, commits or pushes.

**Before anything else, read `CLAUDE.md` and `docs/EDITORIAL.md`.** The playbook has the voice, the fact-check order, the NDA gate and the take-slot format this skill relies on. Read one style reference too (`select body from guides where id = 'grimnall-best-epic-partners'`, or one of the `top-5-*` drafts).

**Dry run** (the user said "dry run", "preview", or "what would you draft"): do every step, but only the read-only commands. No `--write`, no `mark`, no `upload`, no inserts. Write the proposed drafts file anyway and validate it with `draft` (no `--write`), then report.

The working files for a run go in the scratchpad: `pending.json` (new posts) and `drafts.json` (what to save).

## 1. Find what's new

1. Sync the Discord archive. Preview first, it's read-only:
   ```bash
   node scripts/sync-discord-patch-notes.mjs
   ```
   If it reports new or changed posts, apply it (not in a dry run): `node scripts/sync-discord-patch-notes.mjs --write`.
   - Copy every `! POSSIBLY MISSING TEXT:` line into the report verbatim. Following a channel only forwards what the devs *publish*; a bare heading means the text under it is missing. Tyler pastes it into `E:\GameAssets\Exports\<game>\_manual\patch-notes\fill-in\YYYY-MM-DD.txt` and re-runs the sync. Don't draft from a post with a gap until it's filled; skip it this run (don't `mark` it) so it comes back.
   - **Void Hunters comes only from the drop folder** (`E:\GameAssets\Exports\void-hunters\_manual\patch-notes\`, one `YYYY-MM-DD <title>.txt` per post). If the newest VH post is more than a week old, remind Tyler to paste the latest Hunt Report / Dev Update there.
2. List what hasn't been handled:
   ```bash
   node scripts/patch-day.mjs --json <scratchpad>/pending.json
   ```
   It prints each game's newest post, whether the DCDL client was patched after the last extraction, and every post not yet in `patch_day_log`, with a suggested action (`draft`, `maybe`, `skip`, `codes`). `CHANGED` means a post grew since it was logged (a patch note finished arriving, a fill-in was appended): draft only the new part. The suggestions are hints. Read every post (`node scripts/patch-day.mjs show <id>`, or `pending.json`) and decide yourself.
3. "Nothing new since the last patch-day run" → report that and stop.

## 2. DCDL extras

- If the list says the DCDL client was patched after the last extraction, or a new DCDL patch note is in the list, remind Tyler to run Site Admin → Site → Game Data (`/admin#site/game-data`, `next dev` only): **Extract from game files**, **Scan unreleased content [NDA]**, **Refresh site kits — preview** then **apply**, **Check Supreme Commander — preview**. Kit numbers in drafts should come from the refreshed data.
- **Update folder summary.** After the extract, open the newest folder in `E:\GameAssets\Exports\dcdl\patches\` and read its `REPORT.md` (plus `data-changes\` where a row needs context). Replace the `_Run patch day with Claude…_` placeholder under `## Summary` with a short plain-English summary for Tyler: what's new; every kit and balance change in words (who, which skill, what the old → new values mean in play, e.g. "Lantern Shield cooldown 10s → 8s"), flagging the ones marked **not in official posts** as possible silent changes; anything notable in new art, text or scripts. Read the game's Chinese internal notes yourself; when the `≈` hint was missing or wrong, add the terms to `E:\GameAssets\Exports\_pipeline\dcdl\glossary.mjs`. A "Not traced to a champion" row: trace it by hand (skill ids are `<hero skill id>×100 + level`; auras are `KheroHaloLogicalSe`, summons `SeSubObject`) and say who it belongs to. Silent kit changes can become History entries (`kind: change`), but only once an official post or Tyler confirms them: the client data alone is not a source for a published entry.
- Read the newest NDA change report (`E:\GameAssets\Exports\dcdl\_nda\_changes [NDA]\`) **for context only**: it tells you what not to write about. Never quote it, name what's in it, copy from it, or mention it in a draft or in a chat answer meant for the public. `draft` blocks drafts that name a held item.
- New gift codes (`codes` rows): tell Tyler the code and its expiry so he can update Site Admin → <game> → Game Info (`/admin#dcdl/info`). There is no codes page; don't draft one.

## 3. History entries (DCDL)

For every new DCDL patch note (and release posts like "X Enters DC: Dark Legion"), list each champion or legacy piece it releases, reworks, buffs, nerfs, reruns or changes. Find the site id in `src/dcdl/data/heros.json` / `legacy.json` (ascended versions are separate ids, linked by `ascendedFrom` / `ascendsTo`). Then add a `history` entry to `drafts.json`:

```json
{ "entity_type": "champion", "entity_id": "batman_mythic_plus", "event_date": "2026-09-16", "kind": "release",
  "title": "Batman can now be ascended to limited Mythic",
  "body": "Plain facts from the post. **Bold** and [Bracketed Skill Names] work (TakeBody syntax).",
  "source_post_ids": ["1549616157508763782"] }
```

- `event_date` = when it happened in the game (the patch or event-start date), never today.
- `kind`: `release` / `rework` / `buff` / `nerf` / `rerun` / `change`. Use `change` when the post doesn't say which way ("slightly adjusted").
- Facts only from `game_posts` / `patch_notes`. If the post doesn't name it (which legacy piece, exact numbers), leave it out and flag it.
- `servers` for staggered rollouts ("Hypertime Tracker on some servers").
- `take` stays empty, unless it's Tyler's own existing text (e.g. his `quantumsTake` on the champion); then add `"take_source": "heros.json quantumsTake"`.
- Match the tone of the existing entries: `select entity_id, kind, title, body from entity_history order by event_date desc limit 5`.
- Cosmetic-only changes (skill visuals) and bug fixes don't get entries.

## 4. Reaction posts (all four games)

Draft a short guide for each update worth a post. Good triggers:

| Game | Draft | Usually skip |
|---|---|---|
| DC: Dark Legion | patch notes with new champions, reworks, systems or modes; event start posts ("has started"); dev feedback reports (as "what's planned") | maintenance, trivia, teasers ("coming soon", "he's still out there"), codes, events already over |
| Void Hunters | Hunt Reports, Dev Updates and announcements with real news (dates, systems, roadmap) | community-only items (Discord channel changes, contests) unless that's all there is |
| Godforge | update / event / test posts (Duels, Beta dates, system changes) | YouTube links from `latest-videos`, channel housekeeping |
| Invokers | update news (version notes), Chase / event launches, new units | small tournament tweaks, shop notices |

Combine posts that belong together (several Hunt Reports into one roundup; a feedback report plus the patch that followed). Skip a post that an existing guide already covers (`select id, title from guides where game = '<game>' order by created_at desc limit 20`).

Each guide in `drafts.json`:

```json
{ "id": "mythic-ascension-batman-aquaman-green-lantern", "game": "dcdl",
  "title": "…", "description": "One sentence for the card.", "tags": ["mythic ascension", "batman"],
  "cover_image": "https://…/content-images/guides/dcdl/<id>/cover.webp",
  "posts": ["1549616157508763782"],
  "blocks": [ { "type": "paragraph", "rich": true, "text": "…" }, … ] }
```

- Blocks, voice, images and the `[QUANTUM'S TAKE]` slot: follow `docs/EDITORIAL.md` §4–6. Every post needs at least one take slot with a specific prompt question.
- Images: `game_posts.images` URLs first; then site art; DCDL event art from `E:\GameAssets\Exports\dcdl\library\Events\` (or the update folder's `new-art\`) only once the event is confirmed live. Upload anything that isn't already a content-images URL or a small site asset (not in a dry run):
  ```bash
  node scripts/patch-day.mjs upload <file> guides/<game>/<guide-id>/<name>.webp
  ```
- Fact-check release status (EDITORIAL §3) for every "is out / is live / is coming" sentence.

## 5. Validate, save, log

1. Validate (read-only; does the NDA check, block-format check, id and source checks):
   ```bash
   node scripts/patch-day.mjs draft <scratchpad>/drafts.json
   ```
   Fix every `!` line. Read the `~` warnings.
2. Save as pending (not in a dry run): `node scripts/patch-day.mjs draft <scratchpad>/drafts.json --write`. It prints a `mark` command per source post; run them.
3. Log the posts you decided not to draft, so they don't come back next time:
   ```bash
   node scripts/patch-day.mjs mark <id> <id> … --outcome skipped --note "teaser / maintenance / video"
   ```
   Leave posts unlogged only when they're blocked (missing text, waiting on Tyler).
4. Check: `node scripts/patch-day.mjs` should now say "Nothing new since the last patch-day run" (or list only the blocked posts).

## 6. Report to Tyler

Keep it short:

- **Drafted**: each guide (title, game) and the History entries (count, which champions/pieces). Review links: `/admin#<game>/guides` (dcdl, godforge, invokers, voidhunters), `/admin#dcdl/history`, or Studio → Review Queue.
- **Needs your take**: each take slot's prompt question.
- **Needs you**: Game Data buttons to run, missing text to paste (fill-in path), Void Hunters posts to drop in, codes for Game Info, anything flagged as unconfirmed (e.g. a champion on the site roster whose release post isn't in the archive).
- **Skipped**: one line with counts by reason.

Don't commit. The drafts live in Supabase; the repo is untouched by a normal run.

## Reference

- `scripts/patch-day.mjs`: list / show / draft / upload / mark / baseline (header comment has the usage).
- `patch_day_log` (Supabase, private, RLS on with no policies): one row per handled post: `outcome` drafted / skipped / baseline, `guide_ids`, `history_ids`, `body_len` (to spot posts that grew), `run_id`. Posts before 2026-09-01 were logged as `baseline` when this workflow started.
- `game_posts` (private archive) ⊇ `patch_notes` (public). Columns: `game`, `kind` (patch_notes / maintenance / codes / community / video / announcement), `source`, `title`, `body`, `images`, `posted_at`.
