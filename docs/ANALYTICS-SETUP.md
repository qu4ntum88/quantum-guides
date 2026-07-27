# Analytics, advertising & consent — setup guide

The **consent side is built**: banner, preferences modal, `/cookies` policy, the
footer "Cookie Preferences" trigger, versioned storage, and Google Consent Mode
v2 defaults (analytics / advertising / error-tracking all default to *denied*).

The **tracking side is wired but dormant.** The site loads **one** container —
Google Tag Manager — and only once you set a single environment variable. GA4,
Microsoft Clarity, and Sentry are configured *inside GTM*, so you add or remove
them without a code change. Until `NEXT_PUBLIC_GTM_ID` is set, the site keeps
loading GA4 directly (so analytics never goes dark), and Clarity/Sentry are off.

```
Visitor's browser
   ├─ Consent banner / modal  (components/consent/*, src/lib/consent.ts)
   │     saves choice → localStorage  qgg:cookie-consent-v1
   │     pushes Consent Mode v2 signals → window.dataLayer
   │
   ├─ Google Tag Manager  (layout.js, gated on NEXT_PUBLIC_GTM_ID)
   │     reads Consent Mode + the consent_update event, then fires:
   │        • GA4              (needs analytics_storage = granted)
   │        • Microsoft Clarity (needs analytics_storage = granted)
   │        • Sentry           (needs consent_error_tracking = true)
   │
   └─ Google AdSense  — stays a direct script, runs non-personalized until the
        Advertising category is granted (ad_storage).
```

Consent Mode v2 mapping (already implemented in `src/lib/consent.ts`):

| Our category   | Consent Mode signal(s) |
| -------------- | ---------------------- |
| Analytics      | `analytics_storage` |
| Advertising    | `ad_storage`, `ad_user_data`, `ad_personalization` |
| Error tracking | *(not a Google signal)* → custom `consent_error_tracking` |
| Essential      | always on; never gated |

## Fewest logins

GTM, GA4, Search Console, and AdSense all live under **one Google account**.
Microsoft Clarity and Sentry both support **"Sign in with Google"** — so use that
Google account for all six and you have effectively one login.

## The one environment variable

| Variable | Example | Where |
| -------- | ------- | ----- |
| `NEXT_PUBLIC_GTM_ID` | `GTM-XXXXXXX` | `.env.local` + Vercel → Environment Variables |

Add it in both places and redeploy. With it set, the site loads GTM and stops
loading GA4 directly (GA4 now fires from inside GTM). With it unset, the site
falls back to the current direct GA4 tag.

## 1. Google Tag Manager

1. Go to <https://tagmanager.google.com> → **Create Account**. Container name:
   `quantumgameguides.com`, platform **Web**.
2. Copy the **`GTM-XXXXXXX`** ID.
3. Put it in `.env.local` (`NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX`) and in Vercel →
   Settings → Environment Variables (all environments), then redeploy.
4. In GTM → **Admin → Container Settings → Additional Settings**, enable
   **consent overview** so you can mark each tag's required consent.

## 2. Google Analytics 4

1. Create a GA4 property at <https://analytics.google.com>; copy the
   **Measurement ID** (`G-XXXXXXXXXX`). (You can reuse the existing
   `G-1HY1SGTT0Q` property.)
2. GTM → **Tags → New → Google Analytics: GA4 Configuration**, paste the ID,
   trigger **All Pages**.
3. On the tag: **Advanced Settings → Consent Settings → Require additional
   consent** → `analytics_storage`.

## 3. Microsoft Clarity (session replay → GA4)

1. Create a project at <https://clarity.microsoft.com> (sign in with your Google
   account); copy the **Project ID**.
2. GTM → add Clarity from the **Community Template Gallery** ("Microsoft
   Clarity") or a Custom HTML tag with Clarity's snippet.
3. Trigger on a **Custom Event** `consent_update` where `consent_analytics = true`
   (create that dataLayer variable), or set the tag's consent requirement to
   `analytics_storage`.
4. **The GA4 link:** in Clarity → **Settings → Setup → Google Analytics
   integration** → connect your GA4 property. Clarity writes session-replay links
   into GA4 automatically.

## 4. Sentry (crash/bug watching) — GTM loader

Chosen approach for now (browser errors, matches the one-container goal):

1. Create a project at <https://sentry.io> (sign in with Google). Project →
   **Settings → Client Keys (DSN) → Loader Script** — copy the loader `<script>`.
2. GTM → **Tags → New → Custom HTML**, paste the loader script.
3. Trigger on **Custom Event** `consent_update` where
   `consent_error_tracking = true`.

*Later, optional:* upgrade to the `@sentry/nextjs` SDK for server-side error
capture too (`npx @sentry/wizard@latest -i nextjs`). Keep the tunnel option OFF
to avoid extra Vercel function invocations.

## 5. Google Search Console (SEO keywords)

Not a tag — a verified property Google fills from its crawler.

1. Add the property at <https://search.google.com/search-console> and verify
   (DNS `TXT` at your registrar is the most durable; or verify via the GA/GTM tag).
2. Submit your `sitemap.xml`.
3. Link GSC ↔ GA4 (GA4 → Admin → Search Console links) so search queries appear
   alongside analytics.

## Notes for this site

- **AdSense stays a direct script** in `layout.js` (client `ca-pub-9177391319752263`);
  it's gated by Consent Mode `ad_storage`, so it runs non-personalized until the
  Advertising category is granted. No need to move it into GTM.
- **Vercel Analytics was removed** — it was redundant with GA4 and its
  `/_vercel/insights` beacon counted against your Vercel Edge Requests.
- **Edge Requests:** these are Vercel infrastructure counts (middleware + function
  invocations), not something GA4 measures — watch them in the Vercel dashboard.
  Removing Vercel Analytics and moving Clerk to a production instance (ending the
  dev-instance handshake redirects) are the two biggest levers to bring them down.

## Cost

GTM, GA4, Clarity, Sentry, and GSC all run in the browser or on their own
servers — none of this traffic passes through Vercel, so it does not push you off
the free tier. Only the (optional) Sentry SDK "tunnel" option would add Vercel
function invocations; leave it off.
