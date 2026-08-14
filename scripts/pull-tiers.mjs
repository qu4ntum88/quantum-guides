/**
 * Folds the live official tier rankings back into the JSON files.
 *
 * Once you save the official tier list from the Creator Studio, Supabase's
 * `official_tiers` table becomes the source of truth for the public site and
 * `heros.json` / `legacy.json` become the fallback. Run this before committing
 * so the repo matches what the site is actually showing:
 *
 *   node scripts/pull-tiers.mjs
 *
 * It rewrites each item's `tier` and `previousTier`, and reorders the arrays to
 * match the saved within-tier ranking. Reads NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY from .env.local (or the environment).
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Minimal .env.local loader (no dependency) — only fills vars not already set.
function loadEnvLocal() {
  const file = path.join(root, '.env.local')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
}
loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (checked env + .env.local).')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

const TARGETS = [
  { type: 'champion', file: 'src/dcdl/data/heros.json', label: 'champions' },
  { type: 'legacy', file: 'src/dcdl/data/legacy.json', label: 'legacy pieces' },
]

for (const target of TARGETS) {
  const { data, error } = await supabase
    .from('official_tiers')
    .select('entity_id, tier, previous_tier, position')
    .eq('entity_type', target.type)
    .order('position', { ascending: true })

  if (error) {
    console.error(`${target.label}: ${error.message}`)
    process.exit(1)
  }
  if (!data || data.length === 0) {
    console.log(`${target.label}: nothing saved on the site yet — file left untouched.`)
    continue
  }

  const filePath = path.join(root, target.file)
  const items = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const saved = new Map(data.map((r) => [r.entity_id, r]))

  let changed = 0
  for (const item of items) {
    const row = saved.get(item.id)
    if (!row) continue
    const nextTier = row.tier || ''
    const nextPrev = row.previous_tier || ''
    if ((item.tier ?? '') !== nextTier || (item.previousTier ?? '') !== nextPrev) changed++
    if (nextTier) item.tier = nextTier
    else delete item.tier
    if (nextPrev) item.previousTier = nextPrev
    else delete item.previousTier
  }

  // Array order is the within-tier rank on the public site; unsaved items keep
  // their relative position at the end.
  items.sort(
    (a, b) =>
      (saved.get(a.id)?.position ?? Number.MAX_SAFE_INTEGER) -
      (saved.get(b.id)?.position ?? Number.MAX_SAFE_INTEGER)
  )

  fs.writeFileSync(filePath, `${JSON.stringify(items, null, 2)}\n`)
  console.log(`${target.label}: pulled ${data.length} rankings (${changed} changed) → ${target.file}`)
}

console.log('Done. Review the diff, then commit.')
