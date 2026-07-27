import '../legal.css'
import ManageCookiesButton from '../components/consent/ManageCookiesButton'

export const metadata = {
  title: 'Cookie Policy — Quantum Game Guides',
  description:
    'How Quantum Game Guides uses cookies and similar technologies — the essential cookies that keep the site running, and the optional analytics, advertising, and error-tracking you can switch on or off.',
}

const cookies = [
  { name: '__session, __client_uat', provider: 'Clerk', category: 'Strictly necessary', duration: 'Session / 1 year', purpose: 'Keeps you signed in for community voting and the editor.' },
  { name: 'qgg:cookie-consent-v1', provider: 'Quantum Game Guides (first-party)', category: 'Strictly necessary', duration: 'Persistent (localStorage)', purpose: 'Stores your cookie choice so this banner does not reappear on every visit.' },
  { name: '_ga', provider: 'Google Analytics', category: 'Analytics', duration: '2 years', purpose: 'Distinguishes one anonymous visitor from another.' },
  { name: '_ga_*', provider: 'Google Analytics', category: 'Analytics', duration: '2 years', purpose: 'Persists session state for GA4.' },
  { name: '_clck', provider: 'Microsoft Clarity', category: 'Analytics', duration: '1 year', purpose: 'Persistent Clarity user identifier.' },
  { name: '_clsk', provider: 'Microsoft Clarity', category: 'Analytics', duration: '1 day', purpose: 'Ties several page views into a single Clarity session.' },
  { name: '__gads', provider: 'Google AdSense', category: 'Advertising', duration: '~13 months', purpose: 'Measures ad interactions and limits how often an ad is shown.' },
  { name: '__gpi', provider: 'Google AdSense', category: 'Advertising', duration: '~13 months', purpose: 'Stores an ad-personalization identifier (only set with advertising consent).' },
  { name: 'Sentry session', provider: 'Sentry', category: 'Error tracking', duration: 'Session', purpose: 'Correlates errors across page views to help diagnose bugs. No personal information.' },
]

const primaryBtn = {
  padding: '0.6rem 1.25rem',
  borderRadius: '0.4rem',
  border: '1px solid var(--gold)',
  background: 'var(--gold)',
  color: '#0a0a14',
  fontWeight: 700,
  cursor: 'pointer',
}

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
              This Cookie Policy explains how Quantum Game Guides (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;)
              uses cookies and similar technologies to recognize you when you visit quantumgameguides.com (the
              &ldquo;Website&rdquo;). It explains what these technologies are, why we use them, and the choices you have.
              In a few cases cookies may collect information that becomes personal information when combined with other data.
              For how we handle personal data more broadly, see our <a href="/privacy-policy">Privacy Policy</a>.
            </p>

            <h2>What are cookies?</h2>
            <p>
              Cookies are small data files placed on your device when you visit a website. They are widely used to make
              sites work, to make them work more efficiently, and to provide reporting information. Some technologies we
              describe here — such as browser <strong>localStorage</strong> — are not strictly cookies but serve the same
              purpose, and we treat them the same way.
            </p>
            <p>
              Cookies set by the site owner (here, Quantum Game Guides) are called &ldquo;first-party cookies.&rdquo;
              Cookies set by anyone else are &ldquo;third-party cookies,&rdquo; and they enable third-party features such
              as analytics, advertising, or error reporting. The parties that set third-party cookies can recognize your
              device both on this Website and on certain other websites you visit.
            </p>

            <h2>Why do we use cookies?</h2>
            <p>
              Some cookies are required for technical reasons in order for the Website to operate — we call these
              &ldquo;essential&rdquo; or &ldquo;strictly necessary&rdquo; cookies (for example, the sign-in session that
              lets you cast community tier votes). Others let us understand, anonymously, how the site is used so we can
              improve it, show relevant advertising, and catch errors when a page breaks. The optional categories only run
              after you allow them.
            </p>

            <h2>How can I control cookies?</h2>
            <p>
              You decide whether to accept or reject cookies. When you first arrive, a consent banner lets you
              <strong> Accept all</strong>, <strong>Reject non-essential</strong>, or <strong>Manage</strong> each
              category individually. Essential cookies cannot be rejected because the site cannot function without them.
              You can revisit and change your choice at any time with the button below, or the &ldquo;Cookie
              Preferences&rdquo; link in the footer.
            </p>
            <p>
              We use <strong>Google Consent Mode v2</strong>: analytics, advertising, and error-tracking default to
              <em> denied</em> until you opt in, and the third-party tags respect that signal. If you reject optional
              cookies you can still read everything on the Website; none of the guides or tools are gated behind them.
              You may also set your browser to refuse cookies, though some signed-in features may then stop working.
            </p>
            <p>
              <ManageCookiesButton style={primaryBtn}>Manage cookie preferences</ManageCookiesButton>
            </p>

            <h2>The cookies we use</h2>
            <p>
              The specific first- and third-party cookies served through the Website and their purposes are described
              below. The exact cookies set may vary depending on the pages you visit and the choices you make.
            </p>
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
            <p>
              Analytics is provided by <strong>Google Analytics 4</strong> and <strong>Microsoft Clarity</strong>;
              advertising by <strong>Google AdSense</strong>; and error tracking by <strong>Sentry</strong>. The analytics
              and error-tracking tags are loaded through <strong>Google Tag Manager</strong>, and each only after you grant
              the matching category. Our database provider, <strong>Supabase</strong>, stores site data (such as tier
              votes and guide content) on its servers but does not set cookies in your browser.
            </p>

            <h2>How can I control cookies on my browser?</h2>
            <p>
              The way you refuse or delete cookies through browser controls varies from browser to browser. Your
              browser&rsquo;s help menu has the details; here are the common ones:
            </p>
            <ul>
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
              <li><a href="https://support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
              <li><a href="https://help.opera.com/latest/web-preferences/#cookies" target="_blank" rel="noopener noreferrer">Opera</a></li>
            </ul>
            <p>Most advertising networks also let you opt out of targeted advertising. To learn more, visit:</p>
            <ul>
              <li><a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance</a></li>
              <li><a href="https://youradchoices.ca/" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance of Canada</a></li>
              <li><a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer">European Interactive Digital Advertising Alliance</a></li>
              <li><a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google Ad Settings</a></li>
            </ul>

            <h2>What about other tracking technologies?</h2>
            <p>
              Cookies are not the only way to recognize visitors. Analytics providers may use similar technologies such as
              web beacons (tiny graphics, sometimes called &ldquo;tracking pixels&rdquo;) and browser storage to understand
              how the site is used. These typically rely on cookies to work, so declining cookies limits them too. We do
              not use Flash cookies or Local Shared Objects.
            </p>

            <h2>Do you serve targeted advertising?</h2>
            <p>
              We display advertising through Google AdSense. Ads are served in a non-personalized, cookieless mode unless
              you grant the <strong>Advertising</strong> category, in which case Google may use cookies to personalize and
              measure ads. You can opt out of personalized advertising at any time through the ad-choices links above or by
              changing your cookie preferences here.
            </p>

            <h2>How often will you update this Cookie Policy?</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes to the cookies we use or for
              operational, legal, or regulatory reasons. The date at the top shows when it was last revised, so please
              revisit it to stay informed.
            </p>

            <h2>Where can I get further information?</h2>
            <p>
              If you have questions about our use of cookies or other technologies, reach us through our{' '}
              <a href="https://discord.gg/BSPQuvGdSP" target="_blank" rel="noopener noreferrer">Discord community</a>.
            </p>

            <h2>Change your preferences</h2>
            <p>You can review or change which optional cookies you allow at any time.</p>
            <p>
              <ManageCookiesButton style={primaryBtn}>Manage cookie preferences</ManageCookiesButton>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
