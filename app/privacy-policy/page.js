import '../legal.css'

export const metadata = {
  title: 'Privacy Policy — Quantum Game Guides',
}

export default function PrivacyPolicy() {
  return (
    <main>
      <section className="legal-hero">
        <div className="container">
          <h1>Privacy Policy</h1>
        </div>
      </section>

      <section className="legal-body">
        <div className="container">
          <div className="legal-content">
            <p className="legal-updated">Last updated: May 5, 2026</p>

            <p>
              Quantum Game Guides (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) operates quantumgameguides.com. This Privacy Policy explains what information we collect, how we use it, and your rights as a visitor or registered user.
            </p>

            <h2>Information We Collect</h2>

            <h3>Account Information</h3>
            <p>
              Account creation is optional and only required to use community features such as tier voting. If you create an account, we collect your email address and username through <strong>Clerk</strong>, our third-party authentication provider. Clerk&apos;s privacy practices are governed by their own <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
            </p>

            <h3>Community Data</h3>
            <p>
              If you participate in community tier voting, your vote selections are stored in our database (Supabase), linked to your account&apos;s user ID. Votes are displayed publicly only as aggregated tallies — individual vote records are not published.
            </p>

            <h3>Usage Data</h3>
            <p>
              We use <strong>Google Analytics</strong> to collect anonymized data about how visitors use our site, including pages visited, time on site, device type, and general geographic region. This data is aggregated and does not identify individual users.
            </p>

            <h3>Advertising Data</h3>
            <p>
              We display advertisements through <strong>Google AdSense</strong>. Google may use cookies and similar tracking technologies to serve ads based on your browsing behavior across the web. You can learn more and opt out at <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a> and <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Ad Settings</a>.
            </p>

            <h2>Cookies</h2>
            <p>
              We and our third-party partners use cookies and similar technologies to:
            </p>
            <ul>
              <li>Analyze site traffic and improve our content (Google Analytics)</li>
              <li>Deliver and measure advertising effectiveness (Google AdSense)</li>
              <li>Maintain your login session if you create an account (Clerk)</li>
            </ul>
            <p>
              You can manage or disable cookies through your browser settings. Disabling cookies may limit some site functionality, including community voting.
            </p>

            <h2>How We Use Your Information</h2>
            <ul>
              <li>To provide and improve site features</li>
              <li>To display aggregated community tier vote results</li>
              <li>To serve relevant advertising</li>
              <li>To analyze site traffic and understand our audience</li>
            </ul>
            <p>We do not sell, rent, or trade your personal information to third parties.</p>

            <h2>Third-Party Services</h2>
            <p>Our site uses the following third-party services, each governed by their own privacy policies:</p>
            <ul>
              <li><strong>Clerk</strong> (authentication) — <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer">clerk.com/privacy</a></li>
              <li><strong>Supabase</strong> (database) — <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">supabase.com/privacy</a></li>
              <li><strong>Google Analytics</strong> — <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a></li>
              <li><strong>Google AdSense</strong> — <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a></li>
            </ul>

            <h2>Data Retention</h2>
            <p>
              We retain account data and vote history for as long as your account is active. You may request deletion of your account and associated data by contacting us through Discord.
            </p>

            <h2>Children&apos;s Privacy</h2>
            <p>
              This site is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us so we can remove it.
            </p>

            <h2>Your Rights</h2>
            <p>
              Depending on your location, you may have rights to access, correct, or delete your personal data. To exercise these rights, please contact us through our Discord community.
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The &ldquo;Last updated&rdquo; date at the top of this page reflects the most recent revision. Continued use of the site after changes are posted constitutes your acceptance of those changes.
            </p>

            <h2>Contact</h2>
            <p>
              For privacy-related questions, reach us through our <a href="https://discord.gg/BSPQuvGdSP" target="_blank" rel="noopener noreferrer">Discord community</a>.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
