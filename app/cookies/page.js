import '../legal.css'
import ManageCookiesButton from '../components/consent/ManageCookiesButton'

export const metadata = {
  title: 'Cookie Policy — Quantum Game Guides',
  description:
    'How Quantum Game Guides uses cookies — the essential cookies that keep the site running, and the optional analytics and advertising cookies you can switch on or off.',
}

const cookies = [
  { name: '__clerk / __session', provider: 'Clerk', category: 'Essential', duration: 'Session', purpose: 'Keeps you signed in for community voting and the editor.' },
  { name: 'qgg:cookie-consent-v1', provider: 'Quantum Game Guides', category: 'Essential', duration: 'Persistent (localStorage)', purpose: 'Remembers your cookie choice so this banner does not reappear.' },
  { name: '_ga / _ga_*', provider: 'Google Analytics', category: 'Analytics', duration: 'Up to 2 years', purpose: 'Distinguishes anonymous visitors and persists session state.' },
  { name: 'IDE / ANID / other', provider: 'Google AdSense', category: 'Advertising', duration: 'Up to 2 years', purpose: 'Used by Google to serve and measure ads. Only set with your advertising consent.' },
]

export default function CookiePolicy() {
  return (
    <main>
      <section className="legal-hero">
        <div className="container">
          <h1>Cookie Policy</h1>
        </div>
      </section>

      <section className="legal-body">
        <div className="container">
          <div className="legal-content">
            <p className="legal-updated">Last updated: July 27, 2026</p>

            <p>
              This policy explains how quantumgameguides.com uses cookies and similar technologies,
              and how you can control them. For how we handle personal data more broadly, see our{' '}
              <a href="/privacy-policy">Privacy Policy</a>.
            </p>

            <h2>What cookies are</h2>
            <p>
              Cookies are small text files a site stores in your browser. Some are strictly necessary
              for the site to function; others are optional and only used with your consent.
            </p>

            <h2>Your choices</h2>
            <p>
              When you first visit, a banner lets you <strong>Accept all</strong>,{' '}
              <strong>Reject non-essential</strong>, or <strong>Manage</strong> individual categories.
              You can change your decision at any time:
            </p>
            <p>
              <ManageCookiesButton
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '0.4rem',
                  border: '1px solid var(--gold)',
                  background: 'var(--gold)',
                  color: '#0a0a14',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Manage cookie preferences
              </ManageCookiesButton>
            </p>
            <p>
              We use Google Consent Mode v2: analytics and advertising cookies default to{' '}
              <em>denied</em> until you opt in, and Google&rsquo;s tags respect that signal.
            </p>

            <h2>Categories we use</h2>
            <ul>
              <li><strong>Essential</strong> — always on. Sign-in session (Clerk) and your saved cookie choice.</li>
              <li><strong>Analytics</strong> — optional. Google Analytics, anonymous usage stats.</li>
              <li><strong>Advertising</strong> — optional. Google AdSense; with it off, ads run in a non-personalized, cookieless mode.</li>
            </ul>

            <h2>Cookies in detail</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', margin: '1rem 0' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                    <th style={{ padding: '0.5rem' }}>Cookie</th>
                    <th style={{ padding: '0.5rem' }}>Provider</th>
                    <th style={{ padding: '0.5rem' }}>Category</th>
                    <th style={{ padding: '0.5rem' }}>Duration</th>
                    <th style={{ padding: '0.5rem' }}>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {cookies.map((c) => (
                    <tr key={c.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <td style={{ padding: '0.5rem' }}><code>{c.name}</code></td>
                      <td style={{ padding: '0.5rem' }}>{c.provider}</td>
                      <td style={{ padding: '0.5rem' }}>{c.category}</td>
                      <td style={{ padding: '0.5rem' }}>{c.duration}</td>
                      <td style={{ padding: '0.5rem' }}>{c.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2>Managing cookies in your browser</h2>
            <p>
              You can also block or delete cookies through your browser settings. Doing so may limit
              some functionality, including staying signed in for community voting.
            </p>

            <h2>Changes to this policy</h2>
            <p>
              We may update this policy from time to time; the &ldquo;Last updated&rdquo; date reflects
              the latest revision.
            </p>

            <h2>Contact</h2>
            <p>
              Questions? Reach us through our{' '}
              <a href="https://discord.gg/BSPQuvGdSP" target="_blank" rel="noopener noreferrer">Discord community</a>.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
