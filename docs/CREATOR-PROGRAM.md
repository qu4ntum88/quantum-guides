# Creator Program — roles, applications, and on-site tier lists

This adds three things to the site:

1. **A role ladder** — admin (you) → editor → creator → site member.
2. **An application flow** — members apply from `/members`, you approve at `/studio`.
3. **On-site tier list editing** — the drag-and-drop board that used to require
   booting your PC now runs on the live site, for your official lists and for
   every approved creator's own lists.

Everything is already wired up in code and the database tables are created. The
only manual step is granting yourself the admin role if you haven't already
(step 3 below).

---

## What each role can do

| | Site Member | Creator | Editor | Admin |
| --- | :-: | :-: | :-: | :-: |
| Community tier voting | ✅ | ✅ | ✅ | ✅ |
| Apply for a role | ✅ | — | — | — |
| Build & publish their own tier lists | — | ✅ | ✅ | ✅ |
| Write guides | — | — | ✅ (reviewed) | ✅ (instant) |
| Upload infographics | — | — | ✅ (reviewed) | ✅ (instant) |
| Edit the **official** tier lists | — | — | — | ✅ |
| Approve applications & submissions | — | — | — | ✅ |

Editor guides and infographics are saved as `pending` and stay invisible to the
public site until you approve them in **Studio → Review Queue**. Creator tier
lists publish immediately (you can unpublish or delete any of them).

---

## How it works day to day

**For a member:** `/members` → *Join the Creator Program* → pick Creator or
Editor, give a creator name, Discord, links, and a short pitch → submit.

**For you:** `/studio` → **Applications**. Each pending application shows the
applicant's email, username, Discord, links, and pitch. Approve as the role they
asked for, approve an editor applicant as a creator instead, or reject. Approving
writes the role into their Clerk `publicMetadata`, which is what every
server-side gate reads — it takes effect on their next page load.

The same tab lists everyone who currently holds a role, so you can promote,
demote, or revoke at any time. Revoking a role leaves their published work up.

**For a creator/editor:** `/members` shows an *Open Studio* button once approved.

---

## Tier lists on the live site

`/studio` → **Official Tier Lists** is the same board the local admin panel has,
but it saves to Supabase instead of writing `heros.json`. Champions and legacy
pieces each have their own board, and tier-movement arrows work exactly as
before.

> **Important:** once you save the official list from the site, Supabase becomes
> the source of truth and `heros.json` / `legacy.json` become the fallback. Edits
> made in the local admin panel will no longer change the live site.
>
> **This is handled automatically.** `.claude/settings.json` registers a
> `PreToolUse` hook (`scripts/hooks/pre-commit-pull-tiers.mjs`) that runs before
> any `git commit` Claude Code makes: if the live official tier list differs from
> the JSON files, it pulls the rankings down, stages the files into that same
> commit, and says so. If nothing has been edited on the site it stays silent,
> and if it can't reach Supabase it warns but **never blocks the commit**.
>
> To run it by hand at any time:
>
> ```bash
> node scripts/pull-tiers.mjs
> ```
>
> That folds the live rankings (tier, previous tier, and within-tier order) back
> into the JSON files so the repo stays in step.

Creators and editors use `/studio` → **My Tier Lists**. Each list has a title, an
optional description, and a publish toggle, and appears on the public tier list
page under **Community Tier Lists** as
"*&lt;creator&gt;*'s *&lt;title&gt;*", linking to its own page at
`/games/dc-dark-legion/tier-list/<slug>`.

The board supports mouse dragging **and touch** — on a phone or tablet, tap a
portrait to select it, then tap the tier row you want it in.

## Exporting

Every tier list on the site — the two official tables, each community list, and
the live preview inside the studio — has an **⤓ Export PNG** button. It renders a
self-contained graphic with the title, the creator byline, both logos, the DC
rights line in fine print, and "Created on QuantumGameGuides.com".

---

## One-time setup

### 1. Database

Already done — the migration `creator_program_roles_and_tier_lists` created
`role_applications`, `official_tiers`, `tier_lists`, and `tier_list_entries`,
and added `status` / `author_user_id` columns to `guides` and `infographics`
(every existing row was set to `approved`, so nothing already published changed).

Public-read RLS is on for tier lists and official tiers. `role_applications` has
**no** read policy at all — it holds applicant emails and is only ever read
through the admin-gated API using the service-role key.

### 2. Storage

No change — editor image uploads reuse the existing public `content-images`
bucket.

### 3. Make sure you're an admin

The studio's admin tabs need your Clerk account to carry the admin role:

1. <https://dashboard.clerk.com> → your app → **Users** → your user
2. **Public metadata** → `{ "role": "admin" }` → save

(Or set `ADMIN_USER_IDS=user_xxx` in the environment — either grants admin.)

### 4. Deploy

```bash
git push origin main
```

Vercel auto-deploys. Do **not** also run `npx vercel --prod`.

---

## Files

| File | Purpose |
| --- | --- |
| `src/lib/roles.ts` | Role ladder + `CAN` capability map (isomorphic) |
| `src/lib/roles-server.ts` | `getViewer()` / `requireRole()` — the server-side gate |
| `src/lib/useViewerRole.ts` | Client hook for choosing which UI to show |
| `app/members/ApplyPanel.tsx` | Application form on the members page |
| `app/api/roles/apply/route.ts` | Member-facing apply endpoint |
| `app/api/admin/roles/route.ts` | Review queue + role management |
| `app/studio/page.tsx` | Creator Studio shell |
| `src/dcdl/components/studio/*` | Studio tabs (tier lists, official tiers, applications, review queue) |
| `src/dcdl/components/tier/TierListEditor.tsx` | Drag-and-drop board (mouse + touch) |
| `src/dcdl/components/tier/TierBoard.tsx` | Public tier-row rendering |
| `src/dcdl/components/tier/CommunityTierLists.tsx` | Card strip on the tier list page |
| `src/dcdl/lib/tier-db.ts` | Tier read layer (Supabase → JSON fallback) |
| `src/dcdl/lib/tier-export.ts` | Canvas PNG renderer |
| `app/api/tier-lists/route.ts` | Creator list CRUD |
| `app/api/admin/tiers/route.ts` | Official tier list save |
| `app/api/admin/content/moderation/route.ts` | Approve/reject editor submissions |
| `scripts/pull-tiers.mjs` | Fold live official tiers back into the JSON files |
