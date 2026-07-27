'use client'

import { openPreferences } from '@/src/lib/consent'

/**
 * Opens the cookie-preferences modal from anywhere (footer, cookie policy).
 * The modal itself lives in <CookieConsent>, mounted once in the root layout;
 * this button just asks it to open.
 */
export default function ManageCookiesButton({
  className,
  style,
  children = 'Cookie Preferences',
}: {
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}) {
  return (
    <button type="button" onClick={() => openPreferences()} className={className} style={style}>
      {children}
    </button>
  )
}
