import fs from 'fs'
import path from 'path'
import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import { TIER_COLORS } from '@/src/dcdl/components/TierBadge'

// Share images ("og:image") — the card shown when a page is linked in Discord, Reddit,
// X, iMessage, etc. Rendered at build time from local files by the `opengraph-image.tsx`
// routes next to each page. Source art is shrunk with sharp first: some champion art is
// 4000px+ and 7 MB, past the renderer's limit, and it can't read .webp at all. Anything
// missing falls back to the Quantum logo card.

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const GOLD = '#CCA453'
const BG = 'linear-gradient(135deg, #120c1f 0%, #1c1330 45%, #2a1c48 100%)'

// Paths stay statically scoped (fonts folder, public/) so the bundler traces only those
// folders rather than the whole project.
const font = (file: string) => fs.readFileSync(path.join(process.cwd(), 'src/assets/fonts', file))

const fonts = () => [
  { name: 'Unbounded', data: font('Unbounded-ExtraBold.ttf'), weight: 800 as const, style: 'normal' as const },
  { name: 'Inter', data: font('Inter-SemiBold.ttf'), weight: 600 as const, style: 'normal' as const },
]

/** A `public/` image path (e.g. "/dcdl/x.png"), shrunk to fit `max` px, as a PNG data URI; null if missing. */
export async function publicImage(src: string | null | undefined, max = 700): Promise<string | null> {
  if (!src || !/\.(png|jpe?g|webp)$/i.test(src)) return null
  try {
    const png = await sharp(fs.readFileSync(path.join(process.cwd(), 'public', decodeURIComponent(src))))
      .resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer()
    return `data:image/png;base64,${png.toString('base64')}`
  } catch {
    return null
  }
}

const LOGO = () => publicImage('/images/site/Q GOLD FULL ICON.png', 300)

function Brand({ logo }: { logo: string | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {logo && <img src={logo} width={52} height={58} style={{ objectFit: 'contain' }} />}
      <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 24, color: 'rgba(255,255,255,0.7)' }}>quantumgameguides.com</div>
    </div>
  )
}

function Tier({ tier }: { tier?: string | null }) {
  if (!tier) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 96, height: 96, borderRadius: 48, background: TIER_COLORS[tier] ?? '#888',
          border: '4px solid rgba(255,255,255,0.85)', color: '#fff',
          fontFamily: 'Unbounded', fontSize: tier.length > 1 ? 34 : 44,
        }}
      >
        {tier}
      </div>
      <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 26, color: 'rgba(255,255,255,0.75)' }}>Quantum&apos;s Tier</div>
    </div>
  )
}

/**
 * The shared card: text column on the left, artwork on the right.
 * `art` is a data URI; `artFit` "cover" for full-body champion art (bleeds off the
 * right edge), "portrait" for the legacy pieces' card art (centred with a glow).
 */
export async function renderCard({
  overline,
  title,
  lines = [],
  tier,
  art,
  artFit = 'cover',
}: {
  overline: string
  title: string
  lines?: string[]
  tier?: string | null
  art?: string | null
  artFit?: 'cover' | 'portrait'
}) {
  const logo = await LOGO()
  // Shrink the title (and detail lines) as text grows so the tier badge never gets crowded.
  const busy = lines.length > 1
  const titleSize = title.length > 24 || (busy && title.length > 14) ? 50 : title.length > 14 ? 60 : 72
  const lineSize = busy ? 24 : 28
  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: BG, position: 'relative', overflow: 'hidden' }}>
        {/* Artwork */}
        {art && artFit === 'cover' && (
          <img src={art} style={{ position: 'absolute', right: -40, top: 0, height: 630, width: 640, objectFit: 'cover', objectPosition: 'top' }} />
        )}
        {art && artFit === 'portrait' && (
          <div style={{ position: 'absolute', right: 40, top: 0, width: 460, height: 630, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, rgba(239,68,68,0.35) 0%, rgba(42,28,72,0) 65%)' }}>
            <img src={art} height={560} style={{ objectFit: 'contain', borderRadius: 16 }} />
          </div>
        )}
        {/* Fade the art into the text side */}
        {art && artFit === 'cover' && (
          <div style={{ position: 'absolute', left: 0, top: 0, width: 760, height: 630, display: 'flex', background: 'linear-gradient(90deg, #120c1f 55%, rgba(18,12,31,0) 100%)' }} />
        )}
        <div style={{ position: 'absolute', left: 0, top: 0, width: 10, height: 630, background: GOLD, display: 'flex' }} />

        {/* Text column */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 64px', width: 720, height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', fontFamily: 'Unbounded', fontSize: 22, letterSpacing: 4, color: GOLD }}>{overline.toUpperCase()}</div>
            <div style={{ display: 'flex', fontFamily: 'Unbounded', fontSize: titleSize, lineHeight: 1.1, color: '#fff' }}>{title}</div>
            {lines.map((l) => (
              <div key={l} style={{ display: 'flex', fontFamily: 'Inter', fontSize: lineSize, color: 'rgba(255,255,255,0.8)' }}>{l}</div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
            <Tier tier={tier} />
            <Brand logo={logo} />
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fonts() },
  )
}

/** The logo-only fallback card. */
export async function renderLogoCard(subtitle?: string) {
  const logo = await LOGO()
  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: BG, alignItems: 'center', justifyContent: 'center', gap: 56 }}>
        {logo && <img src={logo} width={260} height={290} style={{ objectFit: 'contain' }} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', fontFamily: 'Unbounded', fontSize: 60, color: '#fff', lineHeight: 1.1 }}>Quantum</div>
          <div style={{ display: 'flex', fontFamily: 'Unbounded', fontSize: 60, color: GOLD, lineHeight: 1.1 }}>Game Guides</div>
          {subtitle && <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 28, color: 'rgba(255,255,255,0.75)', marginTop: 10 }}>{subtitle}</div>}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fonts() },
  )
}
