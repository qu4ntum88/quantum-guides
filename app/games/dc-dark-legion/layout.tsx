import './tailwind.css'
import './dcdl-theme.css'

export default function DCDLLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dcdl-root">
      {/* Comic-book base layer — fixed, sits behind all page content */}
      <div className="dcdl-bg" aria-hidden="true">
        <span className="dcdl-slash dcdl-slash-a" />
        <span className="dcdl-slash dcdl-slash-b" />
        <span className="dcdl-slash dcdl-slash-gold-tr" />
        <span className="dcdl-slash dcdl-slash-gold-bl" />
        <span className="dcdl-halftone dcdl-halftone-tl" />
        <span className="dcdl-halftone dcdl-halftone-br" />
        <span className="dcdl-vignette" />
      </div>
      {children}
      <footer style={{ textAlign: 'center', padding: '1.5rem 1rem', fontSize: '0.75rem', color: '#888', borderTop: '1px solid #222', marginTop: '2rem' }}>
        DC: Dark Legion 2025 DC ©. Software code 2025 FunPlus International AG ©. DC LOGO and all related characters and elements © &amp; ™ DC. © 2026 Quantum Game Guides. All rights reserved.
      </footer>
    </div>
  )
}
