/**
 * Cookie-consent state, storage, and the Google Consent Mode v2 bridge.
 *
 * One versioned record lives in localStorage so the banner doesn't reappear on
 * every visit. Essential cookies are always on; the two optional categories —
 * analytics (Google Analytics) and advertising (Google AdSense) — mirror the
 * manage-preferences screen and gate those tags via Consent Mode v2.
 *
 * Consent Mode defaults are set to "denied" by an inline script in the root
 * layout BEFORE Google's tags load, so nothing optional runs before a choice is
 * made. Saving a choice pushes an update into window.dataLayer.
 */

export const CONSENT_STORAGE_KEY = 'qgg:cookie-consent-v1'
export const CONSENT_VERSION = 1

export const CONSENT_CHANGE_EVENT = 'qgg:consent-change'
export const OPEN_PREFERENCES_EVENT = 'qgg:open-cookie-preferences'

export type OptionalCategory = 'analytics' | 'advertising'

export type ConsentCategories = {
  essential: true
  analytics: boolean
  advertising: boolean
}

export type StoredConsent = {
  version: number
  updatedAt: string
  categories: ConsentCategories
}

export const DENY_OPTIONAL: ConsentCategories = {
  essential: true,
  analytics: false,
  advertising: false,
}

export const ALLOW_ALL: ConsentCategories = {
  essential: true,
  analytics: true,
  advertising: true,
}

export const CATEGORY_META: {
  key: OptionalCategory | 'essential'
  label: string
  locked?: boolean
  blurb: string
}[] = [
  {
    key: 'essential',
    label: 'Essential',
    locked: true,
    blurb:
      'Keeps you signed in for community voting and the editor, and remembers this cookie choice. Required for the site to work.',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    blurb:
      'Google Analytics. Anonymous usage stats so we can see which guides and pages people actually read.',
  },
  {
    key: 'advertising',
    label: 'Advertising',
    blurb:
      'Google AdSense. Lets Google use cookies to serve and measure ads. With this off, ads (once enabled) run in a non-personalized, cookieless mode.',
  },
]

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function readConsent(): StoredConsent | null {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredConsent
    if (parsed?.version !== CONSENT_VERSION) return null
    if (!parsed.categories) return null
    return {
      version: CONSENT_VERSION,
      updatedAt: parsed.updatedAt,
      categories: {
        essential: true,
        analytics: Boolean(parsed.categories.analytics),
        advertising: Boolean(parsed.categories.advertising),
      },
    }
  } catch {
    return null
  }
}

export function hasStoredConsent(): boolean {
  return readConsent() !== null
}

export function currentCategories(): ConsentCategories {
  return readConsent()?.categories ?? DENY_OPTIONAL
}

export function writeConsent(
  categories: Omit<ConsentCategories, 'essential'>,
): StoredConsent {
  const record: StoredConsent = {
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
    categories: { essential: true, ...categories },
  }

  if (isBrowser()) {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record))
    } catch {
      // Storage can be unavailable (private mode, quota); the choice still
      // applies for this page load via the event + dataLayer push below.
    }
    pushConsentToDataLayer(record.categories)
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: record }))
  }

  return record
}

export function openPreferences(): void {
  if (!isBrowser()) return
  window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT))
}

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

export function pushConsentToDataLayer(categories: ConsentCategories): void {
  if (!isBrowser()) return
  window.dataLayer = window.dataLayer || []

  const signal = (allowed: boolean) => (allowed ? 'granted' : 'denied')

  // gtag() must push the raw `arguments` object (not a plain array) for Consent
  // Mode to parse it, so this stays a classic function expression.
  const gtag = function () {
    window.dataLayer!.push(arguments)
  } as (...args: unknown[]) => void

  gtag('consent', 'update', {
    analytics_storage: signal(categories.analytics),
    ad_storage: signal(categories.advertising),
    ad_user_data: signal(categories.advertising),
    ad_personalization: signal(categories.advertising),
  })

  window.dataLayer.push({
    event: 'consent_update',
    consent_analytics: categories.analytics,
    consent_advertising: categories.advertising,
  })
}
