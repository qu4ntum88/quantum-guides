// Old Godforge hero-page ids (the ravenpyros API's numbers) → slugs; written by scripts/sync-godforge.mjs.
const gfLegacyIds = require('./src/gf/data/legacy-ids.json')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The champion and legacy databases ARE the tier lists (Tier List / Grid toggle), so
  // they live at tier-list URLs. Old addresses forward permanently (308) so links and
  // search rankings carry over; query strings like ?view=grid pass through.
  async redirects() {
    return [
      { source: '/games/dc-dark-legion', destination: '/games/dc-dark-legion/champion-tier-list', permanent: true },
      { source: '/games/dc-dark-legion/tier-list', destination: '/games/dc-dark-legion/champion-tier-list', permanent: true },
      { source: '/games/dc-dark-legion/legacy', destination: '/games/dc-dark-legion/legacy-tier-list', permanent: true },
      { source: '/games/invokers', destination: '/games/invokers/guides', permanent: true },
      // Godforge and Void Hunters databases merged into their tier lists (2026-10-16).
      { source: '/games/godforge/heroes', destination: '/games/godforge/hero-tier-list', permanent: true },
      { source: '/games/godforge/tier-list', destination: '/games/godforge/hero-tier-list', permanent: true },
      // Godforge guides live at /games/godforge/guides/<id>; their list is on the hub.
      { source: '/games/godforge/guides', destination: '/games/godforge', permanent: true },
      // The local admin panel became the site-wide one.
      { source: '/admin/dcdl', destination: '/admin', permanent: false },
      { source: '/admin/content', destination: '/admin', permanent: false },
      { source: '/games/void-hunters', destination: '/games/void-hunters/hunter-tier-list', permanent: true },
      ...Object.entries(gfLegacyIds).map(([id, slug]) => ({
        source: `/games/godforge/heroes/${id}`,
        destination: `/games/godforge/heroes/${slug}`,
        permanent: true,
      })),
    ]
  },

  // Guide share cards render on request (guides can be published after a deploy), so their
  // fonts and logo must ship with the function. Everything else og.tsx reads is build-time only.
  outputFileTracingIncludes: {
    '/games/dc-dark-legion/guides/**': ['src/assets/fonts/**/*', 'src/assets/og/**/*'],
  },

  // Share images (opengraph-image.tsx, /og-default.png) are rendered at build time from
  // files in public/. Because they read public/ with a computed path, the bundler packs
  // the WHOLE folder (~1.3 GB, mostly Godforge art) into each of those functions, and
  // Vercel rejects anything over 250 MB. The files are never read at runtime: the images
  // are prerendered, and public/ is served from the CDN anyway, so leave it out.
  // Keys are globs, so `[id]` would be read as a character class: match with `**` instead.
  outputFileTracingExcludes: {
    '/games/dc-dark-legion/heros/**': ['public/**/*'],
    '/games/dc-dark-legion/legacy/**': ['public/**/*'],
    '/og-default.png': ['public/**/*'],
    '/games/dc-dark-legion/guides/**': ['public/**/*'],
    // The file-writing admin routes save images under public/ with computed paths, so the
    // tracer packs all of it (1.5 GB). They are notProd()-blocked on Vercel anyway, and no
    // live admin route (tiers, content, whoami) reads public/ at runtime.
    '/api/admin/**': ['public/**/*'],
  },
}

module.exports = nextConfig
