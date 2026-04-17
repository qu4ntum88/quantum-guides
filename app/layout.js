import './globals.css'

export const metadata = {
  title: 'Quantum Game Guides',
  description: 'Deep-dive guides, tier lists, and meta analysis for mobile gacha and strategy games',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <nav className="navbar">
          <div className="nav-container">
            <div className="logo">
              <a href="/">Quantum Guides</a>
            </div>
            <ul className="nav-links">
              <li><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/">Games</a></li>
              <li><a href="https://discord.gg" target="_blank" rel="noopener noreferrer">Discord</a></li>
            </ul>
          </div>
        </nav>
        {children}
        <footer className="footer">
          <p>&copy; 2026 Quantum Game Guides. All rights reserved.</p>
        </footer>
      </body>
    </html>
  )
}
