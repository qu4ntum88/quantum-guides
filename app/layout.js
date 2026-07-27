import './globals.css'
import Navbar from './components/Navbar'
import { ClerkProvider } from '@clerk/nextjs'
import Script from 'next/script'
import CookieConsent from './components/consent/CookieConsent'
import ManageCookiesButton from './components/consent/ManageCookiesButton'
import { CONSENT_STORAGE_KEY } from '@/src/lib/consent'

export const metadata = {
  title: 'Quantum Game Guides',
  description: 'Deep-dive guides, tier lists, and meta analysis for mobile gacha and strategy games',
  metadataBase: new URL('https://www.quantumgameguides.com'),
  openGraph: {
    title: 'Quantum Game Guides',
    description: 'Deep-dive guides, tier lists, and meta analysis for mobile gacha and strategy games',
    url: 'https://www.quantumgameguides.com',
    siteName: 'Quantum Game Guides',
    images: [
      {
        url: '/images/site/Q GOLD FULL ICON.png',
        width: 512,
        height: 512,
        alt: 'Quantum Game Guides',
      },
    ],
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  // When a GTM container is configured, GTM becomes the single tag manager
  // (it deploys GA4, Clarity, Sentry). Until then, we keep loading GA4 directly
  // so analytics never goes dark during the migration.
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID

  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Google Consent Mode v2 — set BEFORE analytics/AdSense load so nothing
            optional runs until the visitor opts in. Re-applies a saved choice. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});try{var s=JSON.parse(localStorage.getItem('${CONSENT_STORAGE_KEY}')||'null');if(s&&s.categories){var c=s.categories;gtag('consent','update',{analytics_storage:c.analytics?'granted':'denied',ad_storage:c.advertising?'granted':'denied',ad_user_data:c.advertising?'granted':'denied',ad_personalization:c.advertising?'granted':'denied'});window.dataLayer.push({event:'consent_update',consent_analytics:!!c.analytics,consent_advertising:!!c.advertising,consent_error_tracking:!!c.errorTracking});}}catch(e){}`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href="https://fonts.googleapis.com/css2?family=Bangers&family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700&family=Unbounded:wght@400;600;700;900&family=VT323&display=swap" rel="stylesheet" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9177391319752263" crossOrigin="anonymous" />
      </head>
      {gtmId ? (
        // Single GTM container — GA4, Clarity, and Sentry are configured as tags
        // inside GTM (see docs/ANALYTICS-SETUP.md), each gated on consent.
        <Script id="gtm-loader" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}</Script>
      ) : (
        <>
          <Script src="https://www.googletagmanager.com/gtag/js?id=G-1HY1SGTT0Q" strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-1HY1SGTT0Q');
          `}</Script>
        </>
      )}
      <body>
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
              title="Google Tag Manager"
            />
          </noscript>
        )}
        <Navbar />
        {children}
        <footer className="footer">
          <p>&copy; 2026 Quantum Game Guides. All rights reserved.</p>
          <p className="footer-links">
            <a href="/privacy-policy">Privacy Policy</a>
            <span className="sep">·</span>
            <a href="/terms">Terms &amp; Conditions</a>
            <span className="sep">·</span>
            <a href="/disclaimer">Disclaimer</a>
            <span className="sep">·</span>
            <a href="/cookies">Cookie Policy</a>
            <span className="sep">·</span>
            <ManageCookiesButton
              style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', font: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}
            />
          </p>
        </footer>
        <CookieConsent />
      </body>
    </html>
    </ClerkProvider>
  )
}
