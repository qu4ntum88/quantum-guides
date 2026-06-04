import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// Load .env.local without requiring dotenv
try {
  const env = readFileSync(resolve(ROOT, '.env.local'), 'utf8')
  for (const line of env.split('\n')) {
    const match = line.match(/^([^#\s=][^=]*)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const val = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  }
} catch {}

const API_KEY = process.env.GODFORGE_API_KEY
if (!API_KEY) {
  console.error('GODFORGE_API_KEY not found. Set it in .env.local or as an environment variable.')
  process.exit(1)
}

const BASE = 'https://www.ravenpyros.com/api/public/v1'
const HEADERS = { 'X-API-KEY': API_KEY }

async function get(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}`)
  return res.json()
}

// Process heroes in batches to stay within 100 req/min
async function batchFetch(items, fn, batchSize = 5, delayMs = 3100) {
  const results = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(fn))
    results.push(...batchResults)
    const remaining = items.length - i - batchSize
    if (remaining > 0) {
      process.stdout.write(`  ${results.length}/${items.length} fetched, waiting...\r`)
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
  return results
}

// Normalize fields we want consistent casing on
function normalizeHero(raw) {
  // Strip community_grade and last_updated — we use quantum_tier instead
  const { community_grade, last_updated, ...hero } = raw

  return {
    ...hero,
    quantum_tier: null,
  }
}

async function main() {
  console.log('Fetching hero list...')
  const listData = await get(`${BASE}/heroes`)
  const list = listData.data
  console.log(`Found ${list.length} heroes. Fetching full details (this takes ~2-3 min)...`)

  const detailed = await batchFetch(list, async (hero) => {
    try {
      const detail = await get(`${BASE}/heroes/${hero.id}`)
      return normalizeHero(detail)
    } catch (e) {
      console.error(`\nFailed hero ${hero.id} (${hero.name}): ${e.message}`)
      return { id: hero.id, name: hero.name, quantum_tier: null, _error: true }
    }
  })

  const failed = detailed.filter(h => h._error)
  if (failed.length > 0) {
    console.warn(`\n${failed.length} heroes failed to fetch: ${failed.map(h => h.name).join(', ')}`)
  }

  const out = {
    synced_at: new Date().toISOString(),
    count: detailed.filter(h => !h._error).length,
    heroes: detailed,
  }

  const outPath = resolve(ROOT, 'src/gf/data/heroes-api.json')
  writeFileSync(outPath, JSON.stringify(out, null, 2))
  console.log(`\nDone. Saved ${out.count} heroes to src/gf/data/heroes-api.json`)
}

main().catch(e => { console.error(e); process.exit(1) })
