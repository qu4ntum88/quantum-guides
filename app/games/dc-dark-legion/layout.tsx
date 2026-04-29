import './tailwind.css'

export default function DCDLLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <footer style={{ textAlign: 'center', padding: '1.5rem 1rem', fontSize: '0.75rem', color: '#888', borderTop: '1px solid #222', marginTop: '2rem' }}>
        DC: Dark Legion 2025 DC ©. Software code 2025 FunPlus International AG ©. DC LOGO and all related characters and elements © &amp; ™ DC. © 2026 Quantum Game Guides. All rights reserved.
      </footer>
    </>
  )
}
