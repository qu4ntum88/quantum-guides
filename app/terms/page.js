import '../legal.css'

export const metadata = {
  title: 'Terms & Conditions — Quantum Game Guides',
}

export default function Terms() {
  return (
    <main>
      <section className="legal-hero">
        <div className="container">
          <h1>Terms &amp; Conditions</h1>
        </div>
      </section>

      <section className="legal-body">
        <div className="container">
          <div className="legal-content">
            <p className="legal-updated">Last updated: May 5, 2026</p>

            <p>
              By accessing or using Quantum Game Guides (quantumgameguides.com), you agree to be bound by these Terms &amp; Conditions. If you do not agree, please do not use this site.
            </p>

            <h2>Use of the Site</h2>
            <p>
              Quantum Game Guides provides game guides, databases, community voting tools, and related content for entertainment and informational purposes. You agree to use this site only for lawful purposes. You may not:
            </p>
            <ul>
              <li>Scrape, copy, or republish our original written content without permission</li>
              <li>Attempt to gain unauthorized access to any part of the site or its systems</li>
              <li>Use automated tools to submit votes or manipulate community data</li>
              <li>Submit false, misleading, or harmful information</li>
              <li>Interfere with the operation of the site</li>
            </ul>

            <h2>User Accounts</h2>
            <p>
              Account creation is optional and provided through Clerk, our authentication provider. You are responsible for keeping your account credentials confidential and for all activity under your account. We reserve the right to suspend or terminate accounts that violate these Terms.
            </p>

            <h2>Community Voting</h2>
            <p>
              Registered users may submit tier ratings for game content through our community voting system. By participating, you agree that:
            </p>
            <ul>
              <li>Your votes represent your genuine opinion</li>
              <li>Vote results are aggregated and displayed publicly</li>
              <li>We reserve the right to reset, adjust, or remove vote data at any time, including to address manipulation</li>
            </ul>

            <h2>Intellectual Property</h2>
            <p>
              Original content on this site — including written guides, tier analysis, site design, and original graphics — is owned by Quantum Game Guides. You may not reproduce or redistribute this original content without written permission.
            </p>
            <p>
              Game names, characters, logos, and artwork featured on this site are the property of their respective owners. See our <a href="/disclaimer">Disclaimer</a> for details on third-party intellectual property.
            </p>

            <h2>Advertising</h2>
            <p>
              This site displays third-party advertisements through Google AdSense. We do not personally endorse any advertised products or services. Ad targeting and delivery is governed by Google&apos;s policies.
            </p>

            <h2>External Links</h2>
            <p>
              This site contains links to external websites including official game sites, Discord servers, and YouTube channels. These links are provided for convenience. We have no control over the content or privacy practices of external sites and accept no responsibility for them.
            </p>

            <h2>Disclaimer of Warranties</h2>
            <p>
              Quantum Game Guides is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied. We do not guarantee that the site will be error-free, uninterrupted, or that any information is accurate or current. Game content changes frequently; guide and tier information may become outdated.
            </p>

            <h2>Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Quantum Game Guides and its operators shall not be liable for any indirect, incidental, or consequential damages arising from your use of or inability to use this site.
            </p>

            <h2>Changes to These Terms</h2>
            <p>
              We may update these Terms at any time. The &ldquo;Last updated&rdquo; date at the top reflects the most recent revision. Continued use of the site after changes are posted constitutes your acceptance.
            </p>

            <h2>Contact</h2>
            <p>
              Questions about these Terms? Reach us through our <a href="https://discord.gg/BSPQuvGdSP" target="_blank" rel="noopener noreferrer">Discord community</a>.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
