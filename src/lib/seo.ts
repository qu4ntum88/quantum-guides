import type { Metadata } from 'next'

// Shared search-engine helpers: per-page metadata and JSON-LD structured data.
//
// Every public page should set its own title, description and canonical URL via
// `pageMeta()`. Next merges metadata shallowly, so a page that sets no
// `openGraph` inherits the root layout's — which would advertise the homepage
// as the shared URL. `pageMeta()` always writes a complete openGraph block.

export const SITE_URL = 'https://www.quantumgameguides.com'
export const SITE_NAME = 'Quantum Game Guides'
export const SITE_LOGO = '/images/site/Q GOLD FULL ICON.png'
// 1200×630 logo card rendered by app/og-default.png/route.tsx — the share image for any
// page without its own (champion and legacy pages have opengraph-image.tsx files).
export const DEFAULT_OG = { url: '/og-default.png', width: 1200, height: 630, alt: 'Quantum Game Guides' }

const SUFFIX = ` | ${SITE_NAME}`
// Google truncates titles around 60 characters; past that the brand suffix only
// pushes the useful words out of view, so it is dropped.
const MAX_TITLE = 65

export function pageMeta({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
}: {
  title: string
  description: string
  path: string
  /** An image URL; `false` when the route has its own opengraph-image.tsx (config images would override it). */
  image?: string | null | false
  type?: 'website' | 'article'
  noindex?: boolean
}): Metadata {
  const full = title.length + SUFFIX.length <= MAX_TITLE ? title + SUFFIX : title
  return {
    title: full,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      type,
      ...(image === false ? {} : { images: [image ? { url: image, alt: title } : DEFAULT_OG] }),
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  }
}

/** "October 2026" from an ISO date or Date; '' when missing. */
export function monthYear(d: string | Date | null | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d.length === 10 ? `${d}T00:00:00Z` : d) : d
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export const abs = (path: string) => (path.startsWith('http') ? path : `${SITE_URL}${encodeURI(path)}`)

// ── JSON-LD builders ─────────────────────────────────────────────────────────

export type Crumb = [name: string, path: string]

export const DCDL_CRUMB: Crumb = ['DC: Dark Legion', '/games/dc-dark-legion/guides']
export const VH_CRUMB: Crumb = ['Void Hunters', '/games/void-hunters/guides']

export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [['Home', '/'] as Crumb, ...crumbs].map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: abs(path),
    })),
  }
}

export const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: abs(SITE_LOGO),
  sameAs: ['https://www.youtube.com/@Quantumx86', 'https://x.com/Quantumx86'],
}

export const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  publisher: { '@id': `${SITE_URL}/#organization` },
}

export function articleLd({
  title,
  description,
  path,
  image,
  author,
  published,
  modified,
}: {
  title: string
  description?: string
  path: string
  image?: string | null
  author?: string | null
  published?: string | null
  modified?: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title.slice(0, 110),
    ...(description ? { description } : {}),
    mainEntityOfPage: abs(path),
    image: abs(image || SITE_LOGO),
    author: author ? { '@type': 'Person', name: author } : { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    ...(published ? { datePublished: published } : {}),
    ...(modified || published ? { dateModified: modified || published } : {}),
  }
}

/** An ordered list of entity pages (tier lists, databases). */
export function itemListLd(name: string, items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: abs(it.path),
    })),
  }
}
