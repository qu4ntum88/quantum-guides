/**
 * One-time content migration: seeds the Supabase `guides`, `game_info`, and
 * `infographics` tables from the existing on-disk files so nothing is lost when
 * the site switches to reading from the database.
 *
 * Run ONCE, locally, AFTER creating the tables (see docs/CONTENT-CMS-SETUP.md):
 *
 *   node scripts/migrate-content.mjs
 *
 * It reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from your
 * .env.local (or the environment). Safe to re-run — every write is an upsert.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import matter from 'gray-matter'

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

const normDate = (v) => {
  if (!v) return null
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v).slice(0, 10)
}
const asArray = (v) => (Array.isArray(v) ? v.map(String) : [])

async function migrateGuides() {
  const dir = path.join(root, 'src/dcdl/guides')
  if (!fs.existsSync(dir)) return console.log('guides: no source dir, skipping')
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
  const rows = files.map((filename) => {
    const { data, content } = matter(fs.readFileSync(path.join(dir, filename), 'utf8'))
    return {
      id: filename.replace(/\.(mdx|md)$/, ''),
      title: data.title ? String(data.title) : filename,
      description: data.description ? String(data.description) : '',
      body: content,
      author: data.author ? String(data.author) : null,
      pub_date: normDate(data.pubDate),
      cover_image: data.coverImage ? String(data.coverImage) : null,
      tags: asArray(data.tags),
      event_type: data.event_type ? String(data.event_type) : null,
      event_dates: data.event_dates ? String(data.event_dates) : null,
      recommended_for: data.recommended_for ? String(data.recommended_for) : null,
      key_rewards: asArray(data.key_rewards),
      updated_at: new Date().toISOString(),
    }
  })
  if (rows.length === 0) return console.log('guides: none found')
  const { error } = await supabase.from('guides').upsert(rows, { onConflict: 'id' })
  if (error) throw new Error(`guides: ${error.message}`)
  console.log(`guides: upserted ${rows.length}`)
}

async function migrateGameInfo() {
  const file = path.join(root, 'src/dcdl/data/game-info.json')
  if (!fs.existsSync(file)) return console.log('game_info: no source file, skipping')
  const j = JSON.parse(fs.readFileSync(file, 'utf8'))
  const row = {
    id: 1,
    latest_server: j.latestServer ?? '',
    patch_notes: j.patchNotes ?? '',
    game_codes: asArray(j.gameCodes),
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('game_info').upsert(row, { onConflict: 'id' })
  if (error) throw new Error(`game_info: ${error.message}`)
  console.log('game_info: upserted 1 row')
}

async function migrateInfographics() {
  const file = path.join(root, 'src/dcdl/data/infographics.json')
  if (!fs.existsSync(file)) return console.log('infographics: no source file, skipping')
  const arr = JSON.parse(fs.readFileSync(file, 'utf8'))
  const rows = arr.map((r, i) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? '',
    image: r.image ?? null,
    builtin: r.builtin ?? null,
    credit: r.credit ?? '',
    sort: i * 10,
  }))
  if (rows.length === 0) return console.log('infographics: none found')
  const { error } = await supabase.from('infographics').upsert(rows, { onConflict: 'id' })
  if (error) throw new Error(`infographics: ${error.message}`)
  console.log(`infographics: upserted ${rows.length}`)
}

try {
  await migrateGuides()
  await migrateGameInfo()
  await migrateInfographics()
  console.log('\nDone. The live site reads from these tables within ~1 minute.')
} catch (e) {
  console.error('\nMigration failed:', e.message)
  process.exit(1)
}
