import './globals.css'
import Navbar from './components/Navbar'
import { ClerkProvider } from '@clerk/nextjs'
import Script from 'next/script'

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
  return (
    <ClerkProvider>
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Unbounded:wght@400;600;700;900&family=VT323&display=swap" rel="stylesheet" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9177391319752263" crossOrigin="anonymous" />
      </head>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-1HY1SGTT0Q" strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-1HY1SGTT0Q');
      `}</Script>
      <body>
        <Navbar />
        {children}
        <footer className="footer">
          <p>&copy; 2026 Quantum Game Guides. All rights reserved.</p>
        </footer>
      </body>
    </html>
    </ClerkProvider>
  )
}
