# On-site content editor — setup

This turns guides, patch notes, and infographics into database-backed content
you can edit from **any device** at `https://www.quantumgameguides.com/admin/content`
(and locally at `http://localhost:3000/admin/content`). Until you complete the
steps below, the site keeps showing the existing file-based content unchanged —
the code falls back to the on-disk files whenever the tables are missing or empty.

Do the steps **in order**. It takes ~15 minutes, all in a browser plus one command.

---

## 1. Create the tables (Supabase → SQL Editor)

Open your project at <https://supabase.com/dashboard> → **SQL Editor** → paste and run:

```sql
-- Guides ---------------------------------------------------------------------
create table if not exists public.guides (
  id            text primary key,          -- slug used in the URL
  title         text not null,
  description   text default '',
  body          text default '',           -- Markdown
  author        text,
  pub_date      date,
  cover_image   text,
  tags          text[] default '{}',
  event_type    text,
  event_dates   text,
  recommended_for text,
  key_rewards   text[] default '{}',
  sort          int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Patch notes / game info (single row) ---------------------------------------
create table if not exists public.game_info (
  id            int primary key default 1,
  latest_server text default '',
  patch_notes   text default '',
  game_codes    text[] default '{}',
  updated_at    timestamptz default now(),
  constraint game_info_singleton check (id = 1)
);
insert into public.game_info (id) values (1) on conflict (id) do nothing;

-- Infographics ---------------------------------------------------------------
create table if not exists public.infographics (
  id          text primary key,
  title       text not null,
  description text default '',
  image       text,
  builtin     text,            -- non-null only for built-in interactive ones
  credit      text default '',
  sort        int default 0,
  created_at  timestamptz default now()
);

-- Row-level security: anyone may READ; nobody may write with the public key.
-- All writes go through the app's server routes using the service-role key,
-- which bypasses RLS after the Clerk admin check.
alter table public.guides       enable row level security;
alter table public.game_info    enable row level security;
alter table public.infographics enable row level security;

create policy "public read guides"       on public.guides       for select using (true);
create policy "public read game_info"     on public.game_info    for select using (true);
create policy "public read infographics"  on public.infographics for select using (true);
```

## 2. Create the image storage bucket

In the same SQL Editor, run:

```sql
insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', true)
on conflict (id) do nothing;
```

(Public bucket = uploaded images are readable by anyone via their URL, which is
what you want for cover images and infographics. Uploads happen only through the
admin route using the service-role key.)

## 3. Seed the tables from your current content

From the project folder, run once:

```bash
node scripts/migrate-content.mjs
```

This copies your 8 existing guides, the current patch notes, and every
infographic into the tables. It reads `NEXT_PUBLIC_SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` from `.env.local`. Safe to re-run (upserts).

## 4. Make yourself an admin (Clerk)

1. Go to <https://dashboard.clerk.com> → your app → **Users** → your user.
2. Edit **Public metadata** and set:
   ```json
   { "role": "admin" }
   ```
3. Save. (Alternatively, set `ADMIN_USER_IDS=user_xxx` in your env with your
   Clerk user id — either one grants access.)

## 5. Environment variables

No new variables are required — the editor reuses your existing Supabase keys:

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | reads + writes (already set) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public reads (already set) |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side writes (already set) |
| `ADMIN_USER_IDS` *(optional)* | comma-separated Clerk user ids granted admin, as an alternative to the `role` metadata |

## 6. Deploy

Push to `main` (Vercel auto-deploys). Then visit `/admin/content` on the live
site, sign in, and you should see the editor. Non-admins who reach the page get
a "Not authorized" notice; signed-out visitors are redirected to sign in.

---

### How it behaves

- Public pages (guides list, each guide, infographics, and the patch-notes card)
  read from Supabase and **revalidate every 60s** — edits appear within a minute,
  no redeploy.
- If a table is empty or the database is unreachable, pages fall back to the
  on-disk files, so the site can never go blank because of a database hiccup.
- The old local-only admin panel (`/admin/dcdl`) is untouched; it still manages
  champions, legacy pieces, best teams, etc. from the local dev server.

### Cleanup (optional, later)

Once you're confident everything reads from the database, the seed files
(`src/dcdl/guides/*`, `src/dcdl/data/game-info.json`,
`src/dcdl/data/infographics.json`) can be trimmed — but they're harmless to keep
as a safety net and cost nothing.
