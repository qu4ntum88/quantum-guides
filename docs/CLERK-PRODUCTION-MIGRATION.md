# Clerk: development → production migration

Moves the site off the Clerk **development** instance (capped at 100 users;
you're at ~87) onto a **production** instance, carrying every user's identity,
metadata, and community votes across. No one re-registers from scratch.

## What each user experiences after the switch

| Sign-in method | First login after switch |
| --- | --- |
| Discord | One click "Sign in with Discord" — re-links automatically |
| Google | One click "Sign in with Google" — re-links automatically |
| Email + password | A one-time **"reset your password"** (Clerk never exposes old password hashes, so they can't be copied) |

Votes, `publicMetadata` (including your `role: admin`), and account identity are
preserved for **everyone** — the reset only re-establishes the password secret.

## The order matters (so nobody is locked out)

The site keeps running on the dev instance until the very last step. We populate
production **first**, then flip the keys.

---

### Phase 1 — Create & configure the production instance (you, Clerk dashboard)

1. Clerk Dashboard → environment switcher (top) → **Create production instance**
   (clone settings from development when prompted).
2. **Enable the same sign-in methods:** Email + password, Google, Discord.
3. **Custom OAuth (production requires your own apps — dev used Clerk's shared ones):**
   - **Google:** Clerk → SSO Connections → Google → "Use custom credentials." Create an
     OAuth client in <https://console.cloud.google.com> (APIs & Services → Credentials
     → OAuth client ID → Web). Paste the **Authorized redirect URI** Clerk shows.
     Copy the client ID + secret back into Clerk.
   - **Discord:** Clerk → SSO Connections → Discord → custom credentials. Create an app
     at <https://discord.com/developers/applications> → OAuth2 → add the redirect URI
     Clerk shows → copy client ID + secret into Clerk.
4. **Turn ON account linking:** Clerk → User & Authentication → **enable
   "link accounts with the same email address"** (verified). This is what lets an
   imported email-only user re-link when they sign in with Discord/Google.

### Phase 2 — DNS (you, your DNS provider)

Clerk's **Domains** screen lists ~5 CNAME records for `quantumgameguides.com`
(`clerk`, `accounts`, `clkmail`, two `clk*._domainkey`). Add them wherever your
domain's DNS lives, then click **Verify** until all are green.

### Phase 3 — Get the production keys (you)

Production instance → **API Keys**: copy `pk_live_…` and `sk_live_…`. Keep them
handy; **do not put them in Vercel yet.**

### Phase 4 — Migrate the users (me + you run the script)

With the dev key already in `.env.local` and the new prod key available, run:

```bash
# 1) Dry run — reads dev users, writes nothing, prints a summary
CLERK_DEV_SECRET_KEY=sk_test_xxx CLERK_PROD_SECRET_KEY=sk_live_xxx \
  node scripts/migrate-clerk-users.mjs --dry-run

# 2) Real run — creates the users in production, writes the id map
CLERK_DEV_SECRET_KEY=sk_test_xxx CLERK_PROD_SECRET_KEY=sk_live_xxx \
  node scripts/migrate-clerk-users.mjs
```

This creates every dev user in production (carrying `publicMetadata`), and writes
`scratchpad/clerk-user-map.json` mapping old→new user IDs by email. The site is
still on the dev instance at this point, so users are unaffected.

### Phase 5 — Flip the keys (you, Vercel)

Vercel → Settings → Environment Variables, **Production** environment:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_live_…
CLERK_SECRET_KEY = sk_live_…
```

(Leave the `sk_test_`/`pk_test_` values on Preview/Development if you like.)
**Redeploy.** The site is now on production.

### Phase 6 — Remap the votes (you run the script, immediately after Phase 5)

```bash
# Dry run — reports how many vote rows would move
node scripts/remap-votes.mjs --dry-run
# Real run
node scripts/remap-votes.mjs
```

This rewrites `votes.user_id` from each old dev ID to the new prod ID using the
map from Phase 4, so everyone's votes reattach to their production account.

### Phase 7 — Verify

- Sign in on the live site (test each method you use).
- Confirm `/admin/content` loads for you (your `role: admin` came across in the map).
- Tell me and I'll check the logs for clean 200s.

---

## Notes / edge cases

- **Discord users with no shared email:** if a user only ever used Discord and
  didn't share an email, they can't be matched by email. The script logs these;
  they'll simply create a fresh production account on next login (their old votes
  stay under the dev ID unless we remap by Discord ID — rare, handle if it comes up).
- **Rate limits:** the migration script throttles between calls; ~87 users takes
  under a minute.
- **Safe to re-run:** if a user already exists in production, the script reuses
  that account instead of erroring.
