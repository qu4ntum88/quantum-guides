#!/usr/bin/env node
// Convert the site's heavy PNG art to WebP and point the data files at the new files.
//
//   node scripts/compress-art.mjs          preview: what would change and how much it saves
//   node scripts/compress-art.mjs --write  convert, rewrite references, delete the PNGs
//
// Why: art in public/ is served straight from Vercel's CDN, and every byte counts toward
// the Hobby plan's transfer limits (the site was paused on 2026-11-07). Godforge full art
// averaged 4.8 MB a file (up to 12 MB) and the tier-list portraits 170 KB each.
//
// Idempotent: only .png files are touched, so re-run it after adding new art (e.g. a
// champion uploaded through the admin form) and it picks up just the new ones.

import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const WRITE = process.argv.includes('--write')
const ROOT = process.cwd()

// Folder → longest side in px (null keeps the size) and WebP quality.
const SETS = [
  { dir: 'public/godforge/gf_heroes/full_art', max: 1600, quality: 82 },
  { dir: 'public/godforge/gf_heroes/portrait', max: null, quality: 85 },
  { dir: 'public/dcdl/heros/full_images', max: 1800, quality: 82 },
  { dir: 'public/dcdl/heros/headshot_images', max: null, quality: 85 },
]

// Files whose text may name these images. Only exact "<folder>/<file>.png" strings are
// rewritten, so nothing else in them changes.
const REF_ROOTS = ['src', 'app']
const REF_EXT = new Set(['.json', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.md', '.mdx'])

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, out) }
    else if (REF_EXT.has(path.extname(e.name))) out.push(p)
  }
  return out
}

const renames = [] // [fromTail, toTail] e.g. ['full_art/X.png', 'full_art/X.webp']
let before = 0, after = 0

for (const set of SETS) {
  const abs = path.join(ROOT, set.dir)
  if (!fs.existsSync(abs)) continue
  const folder = path.basename(set.dir)
  for (const name of fs.readdirSync(abs)) {
    if (!/\.png$/i.test(name)) continue
    const src = path.join(abs, name)
    const outName = name.replace(/\.png$/i, '.webp')
    const dest = path.join(abs, outName)
    let img = sharp(src)
    if (set.max) img = img.resize({ width: set.max, height: set.max, fit: 'inside', withoutEnlargement: true })
    const buf = await img.webp({ quality: set.quality, alphaQuality: 90, effort: 5 }).toBuffer()
    before += fs.statSync(src).size
    after += buf.length
    if (WRITE) {
      fs.writeFileSync(dest, buf)
      fs.unlinkSync(src)
    }
    renames.push([`${folder}/${name}`, `${folder}/${outName}`])
  }
}

let filesChanged = 0, refs = 0
const pairs = renames.flatMap(([a, b]) => {
  const enc = (s) => s.split('/').map(encodeURIComponent).join('/')
  return enc(a) === a ? [[a, b]] : [[a, b], [enc(a), enc(b)]]
})
for (const root of REF_ROOTS) {
  for (const file of walk(path.join(ROOT, root))) {
    let text = fs.readFileSync(file, 'utf8')
    let n = 0
    for (const [a, b] of pairs) {
      if (!text.includes(a)) continue
      n += text.split(a).length - 1
      text = text.split(a).join(b)
    }
    if (!n) continue
    filesChanged++
    refs += n
    if (WRITE) fs.writeFileSync(file, text)
  }
}

const mb = (b) => (b / 1e6).toFixed(1) + ' MB'
console.log(`${renames.length} PNGs: ${mb(before)} → ${mb(after)} as WebP`)
console.log(`${refs} references in ${filesChanged} files ${WRITE ? 'rewritten' : 'would be rewritten'}`)
if (!WRITE) console.log('Preview only. Run with --write to apply.')
