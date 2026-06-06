import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// Load .env.local
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
  console.error('GODFORGE_API_KEY not found in .env.local')
  process.exit(1)
}

const BASE = 'https://www.ravenpyros.com/api/public/v1'
const HEADERS = { 'X-API-KEY': API_KEY }

async function get(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json()
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  const dungeonsStaticPath = resolve(ROOT, 'src/gf/data/dungeons.json')
  const dungeons = JSON.parse(readFileSync(dungeonsStaticPath, 'utf8'))

  console.log(`Syncing stage data for ${dungeons.length} dungeons...`)

  const stagesData = {}

  for (let i = 0; i < dungeons.length; i++) {
    const dungeon = dungeons[i]
    process.stdout.write(`  [${i + 1}/${dungeons.length}] ${dungeon.name}...`)

    try {
      const data = await get(`${BASE}/pve/areas/dungeons/sections/${dungeon.slug}`)
      const diff = Array.isArray(data.difficulties) ? data.difficulties[0] : data.difficulties
      stagesData[dungeon.slug] = {
        stages: diff?.stages ?? [],
        reward_icons: data.reward_icons ?? {},
      }
      console.log(` ✓ (${diff?.stages?.length ?? 0} stages)`)
    } catch (e) {
      console.error(` ✗ ${e.message}`)
      stagesData[dungeon.slug] = { stages: [], reward_icons: {} }
    }

    // Respect rate limit: 100 req/min — pause between requests
    if (i < dungeons.length - 1) await sleep(700)
  }

  const outPath = resolve(ROOT, 'src/gf/data/dungeon-stages.json')
  writeFileSync(outPath, JSON.stringify({
    synced_at: new Date().toISOString(),
    dungeons: stagesData,
  }, null, 2))

  console.log(`\nDone. Saved to src/gf/data/dungeon-stages.json`)
}

main().catch(e => { console.error(e); process.exit(1) })
