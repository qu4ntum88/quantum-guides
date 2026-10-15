# Working on quantum-guides from a Mac

Everything needed to get a second machine running the site, plus — more
importantly — **what you can and cannot do from each machine**. Read the
capability table first; it decides whether you even need the clone.

---

## What works where

| Task | Live site, any device | Mac (cloned) | PC only |
|---|---|---|---|
| Write/edit **guides**, patch notes, infographics | ✅ `/admin/content` | ✅ | |
| **Community + official tier lists** | ✅ `/studio` | ✅ | |
| Approve creator submissions, manage roles | ✅ `/studio` | ✅ | |
| Edit **champions / legacy / best teams** JSON | ❌ | ✅ `/admin/dcdl` → commit + push | |
| Any **code or styling** change | ❌ | ✅ | |
| Deploy | — | ✅ `git push origin main` | |
| **Extract game data** when a game patches | ❌ | ❌ | ✅ |
| `sync-dcdl-kits.mjs`, Game Data admin tab | ❌ | ❌ | ✅ |

Two things to take from that:

**The on-site admin panel updates the real site.** `/admin/content` and
`/studio` write to Supabase, and the public pages read Supabase with
`revalidate = 60` — so a guide, patch note, infographic or tier change you
publish there is live within a minute, with no deploy and no clone. That works
from the Mac's browser, an iPad, or a phone. The one build-time exception is
`generateStaticParams()`: a *brand-new* guide slug must exist and be
`status='approved'` before a deploy to be baked in as a static page.

**The game-data pipeline is PC-bound, as you suspected.** `GAME_EXPORTS_DIR`
and `DCDL_EXPORT` default to `E:\GameAssets\Exports`, and the extraction needs
the installed game clients plus AssetStudio on Windows. The paths are
overridable by env var, but there is nothing on the Mac to point them at.

So the clone is worth having for exactly two things: **code changes**, and
**the file-based JSON data** (champions, legacy, best teams) that `/admin/dcdl`
writes to disk.

---

## The fast path

Open **Terminal** (⌘-Space → "Terminal") and paste one line:

```bash
curl -fsSL https://raw.githubusercontent.com/qu4ntum88/quantum-guides/main/scripts/mac-setup.sh | bash
```

That installs anything missing — Xcode Command Line Tools, Homebrew, Node 22
LTS, GitHub CLI — signs you in to GitHub, clones to
`~/Developer/quantum-guides`, and runs `npm install`. It skips whatever is
already there, so it is safe to run twice.

To clone somewhere else, pass the path: `… | bash -s ~/code/quantum-guides`

Two prompts need answering: the Xcode installer popup (macOS shows its own
dialog; finish it, then re-run the script), and the Homebrew install, which
asks before running.

Then do [step 3 below](#3-secrets) and you're done.

---

## The manual path

Same thing, one command at a time.

### 1. Tools

```bash
xcode-select --install                    # git + compilers, via Apple's dialog
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node@22 gh
```

Next.js 16 requires **Node 20.9+** — check with `node -v`. Note that `node@22`
is keg-only, so Homebrew will not symlink it automatically; add it to your PATH:

```bash
echo "export PATH=\"$(brew --prefix node@22)/bin:\$PATH\"" >> ~/.zprofile
source ~/.zprofile
```

### 2. Sign in and clone

```bash
gh auth login          # browser flow → GitHub.com → HTTPS
gh repo clone qu4ntum88/quantum-guides ~/Developer/quantum-guides
cd ~/Developer/quantum-guides
npm install
```

`gh auth login` also wires up git credentials, so `git push` works with no
personal access token to create, store, or rotate.

### 3. Secrets

Cloning does **not** bring the secrets across — `.env.local` is gitignored, by
design. A fresh clone has zero keys, and the site will not fully boot without
them.

Easiest route, straight from Vercel:

```bash
npx vercel login
npx vercel link                  # select the quantum-guides project
npx vercel env pull .env.local
```

`env pull` only downloads environment variables. It does not deploy anything.
(Deploys happen on push to `main` — and per `CLAUDE.md`, never run
`npx vercel --prod`: it creates duplicate deployments and frequently hangs.)

Alternatively, copy `.env.local` off the PC by hand. Move it **privately** —
AirDrop or a password manager. Never email, Discord, or paste it into a chat
window; the service role key alone grants full read/write on the database,
bypassing RLS.

`.env.example` in the repo root lists every variable the code reads. The ones
that matter on a Mac:

| Variable | Needed for |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | auth, `/members`, `/studio`, admin |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | votes, tiers, CMS reads |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side writes **and the pre-commit hook** |
| `ADMIN_USER_IDS` | admin gate fallback |
| `NEXT_PUBLIC_GTM_ID` | analytics — safe to leave blank locally |

`GAME_EXPORTS_DIR` / `DCDL_EXPORT` stay blank on the Mac (PC-only pipeline).

### 4. Run it

```bash
npm run dev            # http://localhost:3000
npm run build          # production build
npm run lint           # ESLint
```

There are no tests.

---

## Living with two machines

**Pull before you start. Every time, on both machines.**

```bash
git pull origin main
```

This matters more here than on a normal project. `src/dcdl/data/heros.json`,
`best-teams.json` and `src/gf/data/heroes.json` are large JSON blobs that git
cannot merge sensibly — two machines editing them without pulling first means
untangling conflicts by hand. Pulling first avoids it entirely.

**The pre-commit hook needs Supabase.** `.claude/settings.json` registers a
`PreToolUse`/`Bash` hook running `scripts/hooks/pre-commit-pull-tiers.mjs`,
which before any `git commit` pulls live official tiers into
`heros.json`/`legacy.json` and stamps dates into `data-updated.json`. Without
`SUPABASE_SERVICE_ROLE_KEY` in `.env.local` it cannot reach the database — so
fill the env file in *before* committing data changes on the Mac, or the JSON
goes up stale. It never blocks a commit, so a silent no-op is the failure mode
to watch for.

**Stage and commit as two separate steps.** The hook is `PreToolUse`, so it
reads the *already-staged* file list. `git add X && git commit -m …` as one
command means nothing is staged when the hook looks, and the "Updated:" date
never gets stamped. If it's already been missed:
`node scripts/stamp-data-dates.mjs <filename>`.

**Deploying is unchanged.** Push to `main` from either machine and Vercel
auto-deploys via the GitHub integration.

**Claude Code on the Mac.** The desktop app and `claude.ai/code` both run in a
cloud container, not on your Mac — fine for repo work, but it cannot touch
local files or run `npm run dev` against your machine. Note also that the
container is **ephemeral**: anything not committed and pushed before the
session goes idle is lost. For local work, install the CLI:

```bash
npm install -g @anthropic-ai/claude-code
cd ~/Developer/quantum-guides && claude
```

`.claude/` is committed, so project settings, the commit hook and skills come
across with the clone automatically.

---

## Troubleshooting

**`command not found: brew`** after installing Homebrew — the installer prints
two `eval` lines to add to your profile. Run them, or open a new Terminal tab.

**`command not found: node`** after `brew install node@22` — keg-only formula;
see the PATH line in step 1.

**`npm install` fails on a native module** — Xcode Command Line Tools are
missing or half-installed. `xcode-select --install`, let it finish, retry.

**Dev server starts but every page 500s** — almost always an empty or missing
`.env.local`. Check `NEXT_PUBLIC_SUPABASE_URL` and the Clerk keys.

**Signed-in pages redirect in a loop** — Clerk keys from mismatched
environments (a `pk_live_` publishable key with an `sk_test_` secret, or vice
versa). Both must come from the same Clerk instance.

**A guide 500s in production where it should 404** — unrelated to the Mac, but
the known trap: something the guide page imports is failing at module load.
Don't chase it locally — `next start` has all of `node_modules` on disk and
will not reproduce it. Use the Vercel MCP `get_runtime_errors`. See the
guides-500 note in `CLAUDE.md`, and do not reintroduce jsdom.
