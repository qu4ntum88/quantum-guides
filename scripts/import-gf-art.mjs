// Import Godforge hero art from the content creator drive into the site.
//
// Reads three folders of the drive (E:\GameAssets\Exports\godforge\content creator drive\):
//   Hero PNGs/Godforge_<Name>_<NN>_<Pose>_Cutout.png  full-body render, transparent  → fullArt
//   Hero Portrait Cutouts/Portrait_<Name>_HUD.png     1024² bust, transparent        → portrait (tiles)
//   Hero Portrait Cards/Portrait_<Name>_Card.png      704×1024 painted card, opaque  → card (hero page header, share image)
// (the older CO_Character_<Name>_main.png renders in Hero PNGs are ignored).
//
// Files are matched to heroes.json by name (letters only, case-insensitive). Writes WebP:
//   public/godforge/gf_heroes/full_art/<id>.webp     ≤1600 px, q82
//   public/godforge/gf_heroes/portrait/<id>_hud.webp 320 px square, q80, alpha (tiles are ≤ ~110 css px; keeps the tier list as light as before)
//   public/godforge/gf_heroes/card/<id>.webp         704×1024, q82
// then points heroes.json (fullArt / portrait / card) and each hero page file in
// src/gf/data/game/heroes/<id>.json (image_url / portrait_url / card_url) at them, and deletes
// the old art files in full_art/ and portrait/ that nothing references any more.
// New names (not the old ones) so a case-only rename can't break on Vercel's case-sensitive disk.
//
//   node scripts/import-gf-art.mjs          # dry run: what matches, what doesn't
//   node scripts/import-gf-art.mjs --write
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DRIVE = process.env.GF_DRIVE || 'E:\\GameAssets\\Exports\\godforge\\content creator drive'
const WRITE = process.argv.includes('--write')
const PUB = path.join(ROOT, 'public')
const ART = '/godforge/gf_heroes'
const HEROES = path.join(ROOT, 'src/gf/data/heroes.json')
const PAGES = path.join(ROOT, 'src/gf/data/game/heroes')
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '')

const KINDS = {
  fullArt: {
    dir: 'Hero PNGs',
    key: (f) => (/^Godforge_(.+?)_\d{2}_/.exec(f) || /^Godforge_(.+?)_Cutout/i.exec(f) || [])[1],
    out: (id) => `${ART}/full_art/${id}.webp`,
    convert: (img) => img.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, alphaQuality: 90 }),
  },
  portrait: {
    dir: 'Hero Portrait Cutouts',
    key: (f) => (/^Portrait_(.+)_HUD\.png$/i.exec(f) || [])[1],
    out: (id) => `${ART}/portrait/${id}_hud.webp`,
    convert: (img) => img.resize({ width: 320, height: 320, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80, alphaQuality: 90 }),
  },
  card: {
    dir: 'Hero Portrait Cards',
    key: (f) => (/^Portrait_(.+)_Card\.png$/i.exec(f) || [])[1],
    out: (id) => `${ART}/card/${id}.webp`,
    convert: (img) => img.webp({ quality: 82 }),
  },
}

const heroes = JSON.parse(fs.readFileSync(HEROES, 'utf8'))
const byName = new Map(heroes.map((h) => [norm(h.name), h]))

const jobs = [] // { hero, kind, src, dest }
const unmatched = []
const dupes = []
for (const [kind, k] of Object.entries(KINDS)) {
  const seen = new Set()
  for (const f of fs.readdirSync(path.join(DRIVE, k.dir)).sort()) {
    const key = k.key(f)
    if (!key) continue
    const hero = byName.get(norm(key))
    if (!hero) { unmatched.push(`${k.dir}/${f}`); continue }
    if (seen.has(hero.id)) { dupes.push(`${k.dir}/${f}`); continue }
    seen.add(hero.id)
    jobs.push({ hero, kind, src: path.join(DRIVE, k.dir, f), dest: k.out(hero.id) })
  }
}

const has = (id, kind) => jobs.some((j) => j.hero.id === id && j.kind === kind)
console.log(`${jobs.length} images for ${new Set(jobs.map((j) => j.hero.id)).size} of ${heroes.length} heroes`)
for (const kind of Object.keys(KINDS)) {
  const missing = heroes.filter((h) => !has(h.id, kind)).map((h) => h.id)
  console.log(`  ${kind}: ${jobs.filter((j) => j.kind === kind).length}${missing.length ? `; none for ${missing.join(', ')}` : ''}`)
}
if (unmatched.length) console.log(`No site hero for: ${unmatched.join(', ')}`)
if (dupes.length) console.log(`Second file for the same hero (skipped): ${dupes.join(', ')}`)
if (!WRITE) {
  console.log('Dry run. Re-run with --write.')
  process.exit(0)
}

let converted = 0
for (const j of jobs) {
  const dest = path.join(PUB, j.dest)
  if (fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(j.src).mtimeMs) continue
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  await KINDS[j.kind].convert(sharp(j.src)).toFile(dest)
  converted++
}

for (const j of jobs) j.hero[j.kind] = j.dest
fs.writeFileSync(HEROES, JSON.stringify(heroes, null, 2) + '\n')

// Hero page files (written by sync-godforge.mjs, which copies these same fields from heroes.json).
let pages = 0
for (const h of heroes) {
  const p = path.join(PAGES, `${h.id}.json`)
  if (!fs.existsSync(p)) continue
  const page = JSON.parse(fs.readFileSync(p, 'utf8'))
  const next = { portrait_url: h.portrait || h.fullArt, image_url: h.fullArt, card_url: h.card ?? null }
  if (Object.entries(next).every(([k, v]) => page[k] === v)) continue
  // keep card_url next to the other image fields
  const out = {}
  for (const [k, v] of Object.entries(page)) {
    if (k === 'card_url') continue
    out[k] = k in next ? next[k] : v
    if (k === 'image_url') out.card_url = next.card_url
  }
  fs.writeFileSync(p, JSON.stringify(out, null, 1) + '\n')
  pages++
}

// Old art nothing points at any more.
const used = new Set(heroes.flatMap((h) => [h.fullArt, h.portrait, h.card]).filter(Boolean))
const removed = []
for (const sub of ['full_art', 'portrait']) {
  const dir = path.join(PUB, ART, sub)
  for (const f of fs.readdirSync(dir)) {
    if (!used.has(`${ART}/${sub}/${f}`)) { fs.rmSync(path.join(dir, f)); removed.push(`${sub}/${f}`) }
  }
}
console.log(`Converted ${converted} images, updated heroes.json and ${pages} hero page files, removed ${removed.length} unused old files.`)
