/* eslint-disable @next/next/no-img-element */

const LOGOS = {
  dcdl: { src: '/dcdl/logos/Game_logo_-_blue_white.png', alt: 'DC: Dark Legion' },
  godforge: { src: '/images/site/Godforge Wordmark - White (Clean).png', alt: 'Godforge' },
  invokers: { src: '/invokers/logo.svg', alt: 'Invokers: Titan Legacy' },
  voidhunters: { src: '/vh/logo.webp', alt: 'Void Hunters' },
} as const

/** The sign-off at the very bottom of each game hub: Quantum's gold Q beside the game's logo. */
export default function HubLogos({ game }: { game: keyof typeof LOGOS }) {
  const logo = LOGOS[game]
  return (
    <div className="hub-logos">
      <img src="/images/site/Q GOLD ICON.png" alt="Quantum Game Guides" className="hub-logos-q" />
      <span className="hub-logos-sep" aria-hidden="true" />
      <img src={logo.src} alt={logo.alt} className={`hub-logos-game hub-logos-game--${game}`} />
    </div>
  )
}
