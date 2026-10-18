# Editorial playbook

How Claude drafts content for Quantum Game Guides. Claude is the junior editor: it drafts, Tyler (Quantum) edits, approves and decides when each piece goes out. The patch-day skill (`.claude/skills/patch-day/SKILL.md`) runs on these rules, and so should any other drafting session.

## 1. Drafts only

- Every guide is saved as a `guides` row with `status = 'pending'`, `author = 'Quantum'`. Every History entry is an `entity_history` row with `status = 'pending'`. Nothing Claude writes is public until Tyler approves it.
- Never set `status = 'approved'`, never edit an approved row, never overwrite an existing id. `node scripts/patch-day.mjs draft <file>` enforces all of this, so use it instead of hand-written SQL inserts.
- Never commit or push without Tyler saying so. `git add` is its own tool call (see the commit hook in CLAUDE.md).
- Tyler trickles drafts out a few at a time. Don't pad a run with filler to look productive. One sharp post beats three thin ones.

## 2. The NDA gate (creator program)

- The site covers **released** content only.
- Nothing from `E:\GameAssets\Exports\dcdl\_nda\` is ever published, named in a draft, quoted in a chat answer meant for the public, or committed. The NDA change report is read for context only: to know what *not* to write.
- Game-file art (event banners, champion art) is used only once the content is live per §3.
- The `draft` command refuses any text that names an item the vault holds back, and never prints the name it matched. If it refuses, remove the mention. Don't try to work around it.

## 3. Fact-check order

Before a draft says anything is out, live, changed or coming, check in this order:

1. **`patch_notes`** (per `game`): what actually shipped. Release wording in a patch note is the strongest source.
2. **`game_posts`**: every official Discord post since 2024-06. Filter by `game` / `kind` / `posted_at`; search `body` with `ilike`. Event start posts ("X has started!", "X is live") confirm an event went live. An official page a post links to for "the full details" (invokers.com news, godforge.gg) counts as part of that post; read it rather than leaving the draft thin.
3. **Site data** (`heros.json`, `legacy.json`, the Invokers/Godforge/VH data files): what's on the site's roster.
4. **The game-data export**: kit numbers and values, for released content only.

Rules that come up every time:

- **A teaser is not a release.** "Coming next week", "get ready", "he's still out there", a roadmap or a feedback-report plan are announcements. Write them as "planned" or "announced", with the date of the post, and never as "out".
- Dev plans are always "subject to change": say so when a draft leans on them.
- **Facts only from the posts.** If a post doesn't name it (e.g. which legacy piece came with an ascension), don't guess; leave it out and flag it for Tyler.
- Direction matters: "slightly adjusted Green Arrow's base Attack" is a `change`, not a buff or nerf, because the post doesn't say which way.
- Some DCDL content rolls out per server ("Hypertime Tracker updates on some servers"). Use the History `servers` note, never claim a global date.
- Void Hunters is pre-launch: everything is a test, a plan or a dev update. Godforge is in beta tests (Duels minigame, Beta 2). Say so.

## 4. Voice

Write the way Tyler writes. The style references are the 2026-10-17 DCDL drafts (`top-5-*`, `base-skins-ranked`, `teen-titans-best-faction`, `shields-riddler-meta-brawl`) and the approved Invokers guide `grimnall-best-epic-partners`. Read one before drafting.

- First person, plain and direct. Open with the point: what changed and who should care.
- Short paragraphs. Concrete numbers ("up to 1,600% of his ATK", "15% Crit Rate per ally"), bolded when they are the headline.
- No hype words ("insane", "game-changing"), no filler intros, no em dashes (use a colon, comma or full stop).
- Name things exactly as the game does, in the game's capitalisation.
- Link to the site's own pages: champion pages (`/games/dc-dark-legion/heros/<id>`), tier lists, Best Teams, Invokers unit pages (`/games/invokers/heroes/<slug>`), and so on.
- End with a short **Final Thoughts** section that points readers to the relevant tier list or page.
- Opinions are Tyler's. Claude never invents a take, a ranking or a "this is the best" call. It lays out the facts and leaves a take slot.

## 5. Take slots

Every reaction post has at least one placeholder paragraph for Tyler's opinion, in exactly this form so the `draft` validator and Tyler can find it:

```json
{ "type": "paragraph", "rich": true,
  "text": "<strong>[QUANTUM'S TAKE]</strong> Replace this paragraph. Prompt: is Ascension worth the investment for Batman, or should players wait for Harley Quinn and The Flash?" }
```

Put it under a `My Take` heading after the facts, with a specific prompt question. History entries leave `take` empty unless Tyler's own existing text says it (e.g. his champion `quantumsTake`); then set `take_source` to where it came from.

## 6. Guide format

- `body` is the blocks envelope `{"format":"qgg-blocks","version":1,"blocks":[…]}`. Block types: `heading` (h2), `subheading` (h3), `paragraph` (`rich: true` for inline HTML, optional `align`), `list` (plain-text items), `image` (`url` + `caption`).
- Rich text allows only `strong`, `em`, `u`, `a`, `span`, `br`, with classes from the `qgg-*` vocabulary in `src/dcdl/lib/guide-blocks.ts` (`qgg-sm`, `qgg-lg`, `qgg-c-gold|red|green|blue|purple|muted`, `qgg-f-serif|display|mono`). No inline styles.
- The meta line under a unit image is a centered muted paragraph: `<span class="qgg-c-muted qgg-sm">Warrior · Physical DMG · A tier</span>`.
- Images: `game_posts.images` URLs (already in Supabase storage), site art paths, or uploads via `node scripts/patch-day.mjs upload <file> guides/<game>/<guide-id>/<name>.webp` (converts to webp, max 1600px; DCDL full art is 3–7 MB, so always upload it rather than linking the PNG). Set `cover_image` on every guide.
- `id` is a lowercase-hyphen slug that reads like the title. `description` is one sentence for the card and the meta description. `tags` are lowercase.
- `guides.game` picks the section: `dcdl`, `godforge`, `invokers`, `voidhunters`.

## 7. Where Tyler reviews

- Guides: Site Admin `/admin` → <game> → Guides (drafts are marked "DRAFT · not public"), or Studio → Review Queue → "Read draft".
- History: Site Admin → DC: Dark Legion → History.
