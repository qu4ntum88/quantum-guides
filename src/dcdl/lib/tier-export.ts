import { TIER_COLORS } from '@/src/dcdl/components/TierBadge'

/**
 * Renders a tier list to a downloadable PNG.
 *
 * Drawn straight onto a canvas rather than screen-scraping the DOM (the same
 * approach the Gotham map export uses) — no extra dependency, and the graphic
 * is laid out for sharing rather than for a browser window: fixed width, the
 * two logos, the DC rights line in fine print, and the site credit.
 *
 * Two body layouts, so a download always looks like the page it came from:
 *
 *   'rows'    — one coloured badge per tier with portraits flowing to its
 *               right. Matches <TierBoard>, used by community lists and the
 *               studio preview.
 *   'columns' — the official tier table: a tier badge column plus one column
 *               per role group, with the role icons in the header. Matches the
 *               table on /games/dc-dark-legion/tier-list.
 *
 * Every image involved is served from this origin, so the canvas is never
 * tainted and toBlob() works.
 */

export type ExportItem = {
  id: string
  name: string
  img: string | null
  tier: string
  /** Role/class string, used to bucket into columns in the 'columns' layout. */
  group?: string
  /** Corner badges, drawn in the 'columns' layout — see <EntryBadgeGroup>. */
  isNew?: boolean
  isP2W?: boolean
  previousTier?: string
}

/** One role-group column of the official table. */
export type ExportColumn = { label: string; classes: string[] }

/** A "hand of cards" panel drawn under the table — see <LegacyShowcase>. */
export type ExportShowcase = {
  title: string
  rank: string
  accent: string
  bg: string
  total: number
  cards: { name: string; img: string | null }[]
}

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
  /** Body layout. Defaults to 'rows'. */
  layout?: 'rows' | 'columns'
  /** 'columns' only — the role groups, in order. */
  columns?: ExportColumn[]
  /** 'columns' only — the small caption under each tier badge. */
  tierLabels?: Record<string, string>
  /** 'columns' only — the gold banner across the top of the table. */
  boardTitle?: string
  /** 'columns' only — fanned rank panels drawn beneath the table. */
  showcases?: ExportShowcase[]
  /** 'columns' only — the faint art bled into one corner of the table. */
  watermark?: { src: string; side: 'left' | 'right' }
}

const W = 1500
const PAD = 44
const LABEL_COL = 116
const CELL = 104
const GAP = 10
const RADIUS = 10

// 'columns' layout metrics.
const COL_CELL = 84
const COL_PAD = 12
const COL_HEADER_H = 82
const BOARD_TITLE_H = 68
const ROLE_ICON = 30

// Showcase panel metrics.
const PANEL_GAP = 18
const PANEL_H = 302
const CARD_W = 104
const CARD_H = 132
const FAN_RADIUS = 218
const FAN_SPREAD = 21

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

/** Preloads every distinct source, keyed by url. Failures resolve to null. */
async function loadAll(srcs: (string | null | undefined)[]): Promise<Map<string, HTMLImageElement | null>> {
  const images = new Map<string, HTMLImageElement | null>()
  const unique = [...new Set(srcs.filter((s): s is string => !!s))]
  await Promise.all(unique.map(async (src) => { images.set(src, await loadImage(src)) }))
  return images
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
  x: number, y: number, w: number, h: number,
  fit: 'cover' | 'contain'
) {
  ctx.save()
  roundRect(ctx, x, y, w, h, 8)
  ctx.clip()
  const scale = fit === 'cover'
    ? Math.max(w / img.width, h / img.height)
    : Math.min(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  // 'cover' anchors to the top so faces are not cropped out of headshots.
  const dx = x + (w - dw) / 2
  const dy = fit === 'cover' ? y : y + (h - dh) / 2
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

const LABEL_FONT = '700 11px Unbounded, Montserrat, sans-serif'
const LABEL_LINE_H = 13

/**
 * The badge drawn in the tier column, shared by both layouts.
 *
 * `cy` is the centre of the badge *and its caption together*, so a caption that
 * wraps to two lines ("Late Game Mythics") stays inside the row instead of
 * being ellipsised or spilling over the row below.
 */
function drawTierBadge(
  ctx: CanvasRenderingContext2D,
  tier: string,
  color: string,
  cx: number, cy: number, size: number,
  label?: string
) {
  const maxLabelW = LABEL_COL - 8
  ctx.font = LABEL_FONT
  const labelLines = label ? wrap(ctx, label.toUpperCase(), maxLabelW) : []

  const blockH = size + (labelLines.length ? 6 + labelLines.length * LABEL_LINE_H : 0)
  const top = cy - blockH / 2
  const badgeCy = top + size / 2

  ctx.fillStyle = color
  roundRect(ctx, cx - size / 2, top, size, size, size * 0.18)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.fillStyle = '#fff'
  ctx.font = `900 ${tier.length > 1 ? size * 0.4 : size * 0.48}px Unbounded, Montserrat, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 4
  ctx.strokeStyle = '#000'
  ctx.strokeText(tier, cx, badgeCy + 2)
  ctx.fillText(tier, cx, badgeCy + 2)
  ctx.textBaseline = 'alphabetic'

  if (labelLines.length) {
    ctx.fillStyle = `${color}dd`
    ctx.font = LABEL_FONT
    ctx.textAlign = 'center'
    labelLines.forEach((line, i) => {
      ctx.fillText(truncate(ctx, line, maxLabelW), cx, top + size + 16 + i * LABEL_LINE_H)
    })
  }
}

const TIER_RANK: Record<string, number> = { 'S+': 0, S: 1, 'A+': 2, A: 3, B: 4, C: 5, D: 6 }

/**
 * The corner badges the page draws over each portrait — NEW, the green "$"
 * pay-to-win marker, and the ▲/▼ tier movement arrow. Mirrors <EntryBadgeGroup>
 * at size="sm", which is what an 84px portrait gets on the site.
 */
function drawEntryBadges(ctx: CanvasRenderingContext2D, item: ExportItem, x: number, y: number, size: number) {
  const prev = item.previousTier
  const showMove =
    !!prev && prev !== item.tier &&
    TIER_RANK[prev] !== undefined && TIER_RANK[item.tier] !== undefined

  if (!item.isNew && !item.isP2W && !showMove) return

  ctx.save()
  ctx.textAlign = 'right'

  let by = y + 16
  if (item.isNew) {
    ctx.font = '400 15px Bangers, Montserrat, cursive'
    ctx.lineWidth = 3
    ctx.strokeStyle = '#fff'
    ctx.strokeText('NEW', x + size - 4, by)
    ctx.fillStyle = '#ef4444'
    ctx.fillText('NEW', x + size - 4, by)
    by += 4
  }

  if (item.isP2W) {
    const r = 11
    const ccx = x + size - 4 - r
    const ccy = by + r
    ctx.beginPath()
    ctx.arc(ccx, ccy, r, 0, Math.PI * 2)
    ctx.fillStyle = '#16a34a'
    ctx.fill()
    ctx.lineWidth = 1.5
    ctx.strokeStyle = '#fff'
    ctx.stroke()
    ctx.fillStyle = '#fff'
    ctx.font = '900 15px Montserrat, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('$', ccx, ccy + 1)
    ctx.textBaseline = 'alphabetic'
  }

  if (showMove) {
    const up = (TIER_RANK[prev] ?? 99) > (TIER_RANK[item.tier] ?? 99)
    ctx.font = '400 26px Montserrat, sans-serif'
    ctx.textAlign = 'center'
    ctx.lineWidth = 4
    ctx.strokeStyle = '#000'
    ctx.fillStyle = '#fff'
    // Sits over the lower-right of the portrait, as `tierBottom="0"` does.
    const ax = x + size - 9
    const ay = y + size - 4
    ctx.strokeText(up ? '▲' : '▼', ax, ay)
    ctx.fillText(up ? '▲' : '▼', ax, ay)
  }

  ctx.restore()
}

// ── 'rows' layout ────────────────────────────────────────────────────────────

type RowPlan = { tier: string; items: ExportItem[]; height: number }

function planRows(opts: ExportOptions) {
  const perRow = Math.floor((W - PAD * 2 - LABEL_COL - GAP) / (CELL + GAP))
  const rows: RowPlan[] = opts.tiers
    .map((tier) => {
      const items = opts.items.filter((i) => i.tier === tier)
      const lines = Math.max(1, Math.ceil(items.length / perRow))
      return { tier, items, height: lines * (CELL + GAP) + GAP + 18 }
    })
    .filter((r) => r.items.length > 0)
  return { rows, perRow, height: rows.reduce((sum, r) => sum + r.height + GAP, 0) }
}

function drawRows(
  ctx: CanvasRenderingContext2D,
  plan: ReturnType<typeof planRows>,
  images: Map<string, HTMLImageElement | null>,
  fit: 'cover' | 'contain',
  top: number
) {
  let y = top
  for (const row of plan.rows) {
    const color = TIER_COLORS[row.tier] ?? '#888'

    ctx.fillStyle = `${color}14`
    roundRect(ctx, PAD, y, W - PAD * 2, row.height, RADIUS)
    ctx.fill()
    ctx.strokeStyle = `${color}55`
    ctx.lineWidth = 1.5
    ctx.stroke()

    drawTierBadge(ctx, row.tier, color, PAD + LABEL_COL / 2, y + row.height / 2, 66)

    let cx = PAD + LABEL_COL
    let cy = y + GAP
    row.items.forEach((item, idx) => {
      if (idx > 0 && idx % plan.perRow === 0) {
        cx = PAD + LABEL_COL
        cy += CELL + GAP + 18
      }
      const img = item.img ? images.get(item.img) : null
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      roundRect(ctx, cx, cy, CELL, CELL, 8)
      ctx.fill()
      if (img) drawFitted(ctx, img, cx, cy, CELL, CELL, fit)
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
}

// ── 'columns' layout ─────────────────────────────────────────────────────────

type ColRow = { tier: string; cells: ExportItem[][]; height: number }

function planColumns(opts: ExportOptions) {
  const columns = opts.columns ?? []
  const colW = (W - PAD * 2 - LABEL_COL) / Math.max(1, columns.length)
  const perCol = Math.max(1, Math.floor((colW - COL_PAD * 2 + GAP) / (COL_CELL + GAP)))

  const rows: ColRow[] = opts.tiers.map((tier) => {
    const cells = columns.map((col) =>
      opts.items.filter((i) => i.tier === tier && col.classes.some((c) => (i.group ?? '').includes(c)))
    )
    const lines = Math.max(1, ...cells.map((c) => Math.ceil(c.length / perCol)))
    return { tier, cells, height: Math.max(104, lines * (COL_CELL + GAP) + GAP) }
  })

  const tableH = BOARD_TITLE_H + COL_HEADER_H + rows.reduce((sum, r) => sum + r.height, 0)
  const showcaseH = (opts.showcases?.length ?? 0) > 0 ? PANEL_H + 34 : 0
  return { columns, colW, perCol, rows, tableH, height: tableH + showcaseH }
}

function drawColumns(
  ctx: CanvasRenderingContext2D,
  opts: ExportOptions,
  plan: ReturnType<typeof planColumns>,
  images: Map<string, HTMLImageElement | null>,
  fit: 'cover' | 'contain',
  top: number
) {
  const left = PAD
  const right = W - PAD
  const bgFill = fit === 'contain' ? '#1a0a3a' : '#111'

  // Card shell around the whole table, matching the gold-bordered panel on the
  // page. Clipped so the cell fills never bleed past the rounded corners.
  ctx.save()
  roundRect(ctx, left, top, right - left, plan.tableH, 14)
  ctx.clip()

  // Board title banner.
  ctx.fillStyle = GOLD
  ctx.font = '900 27px Unbounded, Montserrat, sans-serif'
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(201,160,30,0.4)'
  ctx.shadowBlur = 18
  ctx.fillText(
    truncate(ctx, (opts.boardTitle ?? opts.title).toUpperCase(), right - left - 40),
    (left + right) / 2,
    top + 44
  )
  ctx.shadowBlur = 0

  // Column headers: role icons over the group label.
  const headerTop = top + BOARD_TITLE_H
  ctx.strokeStyle = `${GOLD}40`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(left, headerTop)
  ctx.lineTo(right, headerTop)
  ctx.stroke()

  plan.columns.forEach((col, ci) => {
    const cx = left + LABEL_COL + plan.colW * ci
    ctx.strokeStyle = `${GOLD}55`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx, headerTop)
    ctx.lineTo(cx, headerTop + COL_HEADER_H)
    ctx.stroke()

    const iconsW = col.classes.length * ROLE_ICON + (col.classes.length - 1) * 8
    let ix = cx + (plan.colW - iconsW) / 2
    for (const cls of col.classes) {
      const icon = images.get(`/dcdl/role_images/${cls}.png`)
      if (icon) ctx.drawImage(icon, ix, headerTop + 14, ROLE_ICON, ROLE_ICON)
      ix += ROLE_ICON + 8
    }

    ctx.fillStyle = GOLD
    ctx.font = '700 12px Unbounded, Montserrat, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(
      truncate(ctx, col.label.toUpperCase(), plan.colW - 16),
      cx + plan.colW / 2,
      headerTop + COL_HEADER_H - 18
    )
  })

  // Tier rows.
  let y = headerTop + COL_HEADER_H
  for (const row of plan.rows) {
    const color = TIER_COLORS[row.tier] ?? '#888'

    ctx.strokeStyle = `${GOLD}40`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(left, y)
    ctx.lineTo(right, y)
    ctx.stroke()

    drawTierBadge(
      ctx, row.tier, color,
      left + LABEL_COL / 2, y + row.height / 2, 56,
      opts.tierLabels?.[row.tier]
    )

    row.cells.forEach((cell, ci) => {
      const cx = left + LABEL_COL + plan.colW * ci

      ctx.fillStyle = `${color}12`
      ctx.fillRect(cx, y, plan.colW, row.height)
      ctx.strokeStyle = `${GOLD}55`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cx, y)
      ctx.lineTo(cx, y + row.height)
      ctx.stroke()

      if (cell.length === 0) {
        ctx.fillStyle = '#3a3a4a'
        ctx.font = 'italic 600 16px Montserrat, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('—', cx + plan.colW / 2, y + row.height / 2 + 6)
        return
      }

      // Each line is centred in the cell, the way flex-wrap + justify-center does.
      const lines = Math.ceil(cell.length / plan.perCol)
      const blockH = lines * (COL_CELL + GAP) - GAP
      let iy = y + (row.height - blockH) / 2
      for (let ln = 0; ln < lines; ln++) {
        const slice = cell.slice(ln * plan.perCol, (ln + 1) * plan.perCol)
        const lineW = slice.length * COL_CELL + (slice.length - 1) * GAP
        let ix = cx + (plan.colW - lineW) / 2
        for (const item of slice) {
          ctx.fillStyle = bgFill
          roundRect(ctx, ix, iy, COL_CELL, COL_CELL, 7)
          ctx.fill()
          const img = item.img ? images.get(item.img) : null
          if (img) drawFitted(ctx, img, ix, iy, COL_CELL, COL_CELL, fit)
          ctx.strokeStyle = `${color}aa`
          ctx.lineWidth = 2.5
          roundRect(ctx, ix, iy, COL_CELL, COL_CELL, 7)
          ctx.stroke()
          drawEntryBadges(ctx, item, ix, iy, COL_CELL)
          ix += COL_CELL + GAP
        }
        iy += COL_CELL + GAP
      }
    })

    y += row.height
  }

  // Watermark art bled into one corner, clipped by the card and laid over the
  // table at the same 10% the page uses.
  const wm = opts.watermark ? images.get(opts.watermark.src) : null
  if (wm && opts.watermark) {
    const wmH = plan.tableH
    const wmW = (wm.width / wm.height) * wmH
    ctx.save()
    ctx.globalAlpha = 0.1
    ctx.drawImage(wm, opts.watermark.side === 'left' ? left : right - wmW, top, wmW, wmH)
    ctx.restore()
  }

  // Table border last so it sits over the cell fills.
  ctx.restore()
  ctx.strokeStyle = `${GOLD}88`
  ctx.lineWidth = 3
  roundRect(ctx, left, top, right - left, plan.tableH, 14)
  ctx.stroke()

  const showcases = opts.showcases ?? []
  if (showcases.length > 0) drawShowcases(ctx, showcases, images, top + plan.tableH + 34)
}

/** The fanned "hand of cards" panels — the canvas twin of <LegacyShowcase>. */
function drawShowcases(
  ctx: CanvasRenderingContext2D,
  showcases: ExportShowcase[],
  images: Map<string, HTMLImageElement | null>,
  top: number
) {
  const panelW = (W - PAD * 2 - PANEL_GAP * (showcases.length - 1)) / showcases.length

  showcases.forEach((panel, pi) => {
    const px = PAD + (panelW + PANEL_GAP) * pi
    const cx = px + panelW / 2

    ctx.fillStyle = panel.bg
    roundRect(ctx, px, top, panelW, PANEL_H, 12)
    ctx.fill()
    const tint = ctx.createRadialGradient(cx, top, 0, cx, top, panelW * 0.8)
    tint.addColorStop(0, `${panel.accent}30`)
    tint.addColorStop(1, `${panel.accent}00`)
    ctx.fillStyle = tint
    ctx.fill()
    ctx.strokeStyle = `${panel.accent}77`
    ctx.lineWidth = 2
    ctx.stroke()

    // Title.
    ctx.fillStyle = panel.accent
    ctx.font = '900 19px Unbounded, Montserrat, sans-serif'
    ctx.textAlign = 'center'
    const titleLines = wrap(ctx, panel.title.toUpperCase(), panelW - 36)
    titleLines.forEach((line, i) => ctx.fillText(line, cx, top + 34 + i * 24))

    // Rank pill.
    const pillY = top + 34 + titleLines.length * 24 - 4
    ctx.font = '700 11px Montserrat, sans-serif'
    const pillW = ctx.measureText(panel.rank.toUpperCase()).width + 26
    ctx.fillStyle = `${panel.accent}26`
    roundRect(ctx, cx - pillW / 2, pillY, pillW, 22, 11)
    ctx.fill()
    ctx.strokeStyle = `${panel.accent}88`
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.fillStyle = `${panel.accent}ee`
    ctx.fillText(panel.rank.toUpperCase(), cx, pillY + 15)

    // The fan: each card rotated about a pivot well below the panel, the way
    // `transform-origin: 50% 215%` splays the cards in the CSS version.
    const count = panel.cards.length
    const cardTop = pillY + 44
    const pivotY = cardTop + CARD_H / 2 + FAN_RADIUS

    panel.cards.forEach((card, i) => {
      const deg = count < 2 ? 0 : -FAN_SPREAD + (i * FAN_SPREAD * 2) / (count - 1)
      ctx.save()
      ctx.translate(cx, pivotY)
      ctx.rotate((deg * Math.PI) / 180)
      ctx.translate(0, -FAN_RADIUS)

      const x = -CARD_W / 2
      const yy = -CARD_H / 2

      ctx.shadowColor = 'rgba(0,0,0,0.55)'
      ctx.shadowBlur = 12
      ctx.shadowOffsetY = 4
      ctx.fillStyle = panel.bg
      roundRect(ctx, x, yy, CARD_W, CARD_H, 9)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      const sheen = ctx.createLinearGradient(x, yy, x + CARD_W, yy + CARD_H)
      sheen.addColorStop(0, `${panel.accent}4d`)
      sheen.addColorStop(0.55, `${panel.accent}00`)
      ctx.fillStyle = sheen
      ctx.fill()
      ctx.strokeStyle = `${panel.accent}b3`
      ctx.lineWidth = 2.5
      ctx.stroke()

      const img = card.img ? images.get(card.img) : null
      if (img) {
        const box = 80
        const scale = Math.min(box / img.width, box / img.height)
        ctx.drawImage(
          img,
          (-img.width * scale) / 2,
          yy + 8 + (box - img.height * scale) / 2,
          img.width * scale,
          img.height * scale
        )
      }

      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.font = '700 9px Montserrat, sans-serif'
      ctx.textAlign = 'center'
      const nameLines = wrap(ctx, card.name, CARD_W - 12).slice(0, 2)
      nameLines.forEach((line, li) =>
        ctx.fillText(truncate(ctx, line, CARD_W - 12), 0, yy + 102 + li * 11)
      )

      ctx.restore()
    })

    if (panel.total > count) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)'
      ctx.font = '700 12px Montserrat, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`+${panel.total - count} MORE`, cx, top + PANEL_H - 14)
    }
  })
}

// ── Entry point ──────────────────────────────────────────────────────────────

export async function exportTierListPng(opts: ExportOptions): Promise<void> {
  const { title, subtitle, dateLine, items, fit = 'cover' } = opts

  // Wait for webfonts so the canvas does not fall back to a system face.
  try { await document.fonts.ready } catch { /* older browsers: draw anyway */ }

  const useColumns = opts.layout === 'columns' && (opts.columns?.length ?? 0) > 0
  const rowPlan = useColumns ? null : planRows(opts)
  const colPlan = useColumns ? planColumns(opts) : null

  // Title, then the description (if any), then the date line — each adds a row.
  const headerH = 138 + (subtitle ? 38 : 0) + (dateLine ? 30 : 0)
  const bodyH = (rowPlan?.height ?? colPlan?.height ?? 0) + (useColumns ? 24 : 0)
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

  // ── Body ───────────────────────────────────────────────────────────────────
  const images = await loadAll([
    ...items.map((i) => i.img),
    ...(opts.columns ?? []).flatMap((c) => c.classes.map((cls) => `/dcdl/role_images/${cls}.png`)),
    ...(opts.showcases ?? []).flatMap((s) => s.cards.map((c) => c.img)),
    opts.watermark?.src,
  ])

  if (colPlan) drawColumns(ctx, opts, colPlan, images, fit, headerH)
  else if (rowPlan) drawRows(ctx, rowPlan, images, fit, headerH)

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
