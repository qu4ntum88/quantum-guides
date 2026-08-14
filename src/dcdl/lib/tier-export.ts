import { TIER_COLORS } from '@/src/dcdl/components/TierBadge'

/**
 * Renders a tier list to a downloadable PNG.
 *
 * Drawn straight onto a canvas rather than screen-scraping the DOM (the same
 * approach the Gotham map export uses) — no extra dependency, and the graphic
 * is laid out for sharing rather than for a browser window: fixed width, tidy
 * rows, the two logos, the DC rights line in fine print, and the site credit.
 *
 * Every image involved is served from this origin, so the canvas is never
 * tainted and toBlob() works.
 */

export type ExportItem = { id: string; name: string; img: string | null; tier: string }

export type ExportOptions = {
  title: string
  /** The list's own description, when it has one. */
  subtitle?: string
  /** Publication / last-updated date, e.g. "Updated August 10, 2026". */
  dateLine?: string
  items: ExportItem[]
  tiers: readonly string[]
  /** Fit portraits to the box (champions) or letterbox them (legacy icons). */
  fit?: 'cover' | 'contain'
  filename?: string
}

const W = 1500
const PAD = 44
const LABEL_COL = 116
const CELL = 104
const GAP = 10
const RADIUS = 10

const BG = '#120834'
const GOLD = '#c9a01e'
const DISCLAIMER =
  'DC: Dark Legion 2025 DC ©. Software code 2025 FunPlus International AG ©. DC LOGO and all related characters and elements © & ™ DC.'
const CREDIT = 'Created on QuantumGameGuides.com'

const Q_LOGO = '/images/site/Q%20GOLD%20FULL%20ICON.png'
const GAME_LOGO = '/dcdl/logos/Game_logo_-_blue_white.png'

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Draw `img` into a rounded box, cropping or letterboxing to taste. */
function drawFitted(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, size: number,
  fit: 'cover' | 'contain'
) {
  ctx.save()
  roundRect(ctx, x, y, size, size, 8)
  ctx.clip()
  const scale = fit === 'cover'
    ? Math.max(size / img.width, size / img.height)
    : Math.min(size / img.width, size / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  // 'cover' anchors to the top so faces are not cropped out of headshots.
  const dx = x + (size - dw) / 2
  const dy = fit === 'cover' ? y : y + (size - dh) / 2
  ctx.drawImage(img, dx, dy, dw, dh)
  ctx.restore()
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1)
  return `${t}…`
}

/** Greedy word wrap. Returns the lines drawn. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

export async function exportTierListPng(opts: ExportOptions): Promise<void> {
  const { title, subtitle, dateLine, items, tiers, fit = 'cover' } = opts

  // Wait for webfonts so the canvas does not fall back to a system face.
  try { await document.fonts.ready } catch { /* older browsers: draw anyway */ }

  const perRow = Math.floor((W - PAD * 2 - LABEL_COL - GAP) / (CELL + GAP))

  const rows = tiers.map((tier) => {
    const rowItems = items.filter((i) => i.tier === tier)
    const lines = Math.max(1, Math.ceil(rowItems.length / perRow))
    return { tier, items: rowItems, height: lines * (CELL + GAP) + GAP + 18 }
  }).filter((r) => r.items.length > 0)

  // Title, then the description (if any), then the date line — each adds a row.
  const headerH = 138 + (subtitle ? 38 : 0) + (dateLine ? 30 : 0)
  const bodyH = rows.reduce((sum, r) => sum + r.height + GAP, 0)
  const footerH = 208
  const H = headerH + bodyH + footerH

  const dpr = 2
  const canvas = document.createElement('canvas')
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is unavailable in this browser.')
  ctx.scale(dpr, dpr)

  // ── Background ─────────────────────────────────────────────────────────────
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, H * 0.9)
  glow.addColorStop(0, 'rgba(201,160,30,0.13)')
  glow.addColorStop(1, 'rgba(201,160,30,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = `${GOLD}88`
  ctx.lineWidth = 4
  roundRect(ctx, 2, 2, W - 4, H - 4, 18)
  ctx.stroke()

  // ── Header ─────────────────────────────────────────────────────────────────
  ctx.textAlign = 'center'
  ctx.fillStyle = GOLD
  ctx.font = '900 44px Unbounded, Montserrat, sans-serif'
  ctx.shadowColor = 'rgba(201,160,30,0.45)'
  ctx.shadowBlur = 24
  ctx.fillText(truncate(ctx, title.toUpperCase(), W - PAD * 2), W / 2, 78)
  ctx.shadowBlur = 0

  let headY = 118
  if (subtitle) {
    ctx.fillStyle = 'rgba(255,255,255,0.72)'
    ctx.font = '600 22px Montserrat, sans-serif'
    ctx.fillText(truncate(ctx, subtitle, W - PAD * 2), W / 2, headY)
    headY += 34
  }
  if (dateLine) {
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = '500 17px Montserrat, sans-serif'
    ctx.fillText(truncate(ctx, dateLine, W - PAD * 2), W / 2, headY)
  }

  ctx.strokeStyle = `${GOLD}55`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(PAD, headerH - 26)
  ctx.lineTo(W - PAD, headerH - 26)
  ctx.stroke()

  // ── Tier rows ──────────────────────────────────────────────────────────────
  const images = new Map<string, HTMLImageElement | null>()
  await Promise.all(
    items.map(async (i) => {
      if (i.img && !images.has(i.img)) images.set(i.img, await loadImage(i.img))
    })
  )

  let y = headerH
  for (const row of rows) {
    const color = TIER_COLORS[row.tier] ?? '#888'

    ctx.fillStyle = `${color}14`
    roundRect(ctx, PAD, y, W - PAD * 2, row.height, RADIUS)
    ctx.fill()
    ctx.strokeStyle = `${color}55`
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Tier badge
    const badge = 66
    const bx = PAD + (LABEL_COL - badge) / 2
    const by = y + (row.height - badge) / 2
    ctx.fillStyle = color
    roundRect(ctx, bx, by, badge, badge, 12)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = '#fff'
    ctx.font = `900 ${row.tier.length > 1 ? 26 : 32}px Unbounded, Montserrat, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineWidth = 4
    ctx.strokeStyle = '#000'
    ctx.strokeText(row.tier, bx + badge / 2, by + badge / 2 + 2)
    ctx.fillText(row.tier, bx + badge / 2, by + badge / 2 + 2)
    ctx.textBaseline = 'alphabetic'

    // Portraits
    let cx = PAD + LABEL_COL
    let cy = y + GAP
    row.items.forEach((item, idx) => {
      if (idx > 0 && idx % perRow === 0) {
        cx = PAD + LABEL_COL
        cy += CELL + GAP + 18
      }
      const img = item.img ? images.get(item.img) : null
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      roundRect(ctx, cx, cy, CELL, CELL, 8)
      ctx.fill()
      if (img) drawFitted(ctx, img, cx, cy, CELL, fit)
      ctx.strokeStyle = `${color}cc`
      ctx.lineWidth = 2.5
      roundRect(ctx, cx, cy, CELL, CELL, 8)
      ctx.stroke()

      ctx.fillStyle = 'rgba(255,255,255,0.82)'
      ctx.font = '600 12px Montserrat, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(truncate(ctx, item.name, CELL + 6), cx + CELL / 2, cy + CELL + 14)

      cx += CELL + GAP
    })

    y += row.height + GAP
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footY = H - footerH
  ctx.strokeStyle = `${GOLD}44`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(PAD, footY + 8)
  ctx.lineTo(W - PAD, footY + 8)
  ctx.stroke()

  const [qLogo, gameLogo] = await Promise.all([loadImage(Q_LOGO), loadImage(GAME_LOGO)])
  const logoH = 78
  const logos = [qLogo, gameLogo].filter(Boolean) as HTMLImageElement[]
  if (logos.length > 0) {
    const widths = logos.map((l) => (l.width / l.height) * logoH)
    const totalW = widths.reduce((a, b) => a + b, 0) + (logos.length - 1) * 56
    let lx = (W - totalW) / 2
    logos.forEach((logo, i) => {
      ctx.drawImage(logo, lx, footY + 28, widths[i], logoH)
      lx += widths[i] + 56
    })
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = GOLD
  ctx.font = '700 19px Unbounded, Montserrat, sans-serif'
  ctx.fillText(CREDIT, W / 2, footY + 144)

  ctx.fillStyle = 'rgba(255,255,255,0.42)'
  ctx.font = '400 12px Montserrat, sans-serif'
  const lines = wrap(ctx, DISCLAIMER, W - PAD * 4)
  lines.forEach((line, i) => ctx.fillText(line, W / 2, footY + 170 + i * 16))
  ctx.fillText(`© ${new Date().getFullYear()} Quantum Game Guides. All rights reserved.`, W / 2, footY + 170 + lines.length * 16)

  // ── Download ───────────────────────────────────────────────────────────────
  const name = `${(opts.filename ?? title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'tier-list'}.png`
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not render the image.')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
