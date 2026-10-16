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
    ]
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
  },
}

module.exports = nextConfig
