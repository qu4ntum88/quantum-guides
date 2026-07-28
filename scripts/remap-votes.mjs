/**
 * Reattach community votes to production Clerk accounts after the dev→prod user
 * migration. Reads scratchpad/clerk-user-map.json (written by
 * migrate-clerk-users.mjs) and rewrites votes.user_id from each old dev ID to
 * the new prod ID.
 *
 * Run AFTER migrate-clerk-users.mjs and AFTER flipping the Vercel keys to prod.
 *
 * Usage:  node scripts/remap-votes.mjs [--dry-run]
 * Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DRY = process.argv.includes('--dry-run')

function loadEnvLocal() {
  const file = path.join(root, '.env.local')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.'); process.exit(1) }

const mapFile = path.join(root, 'scratchpad', 'clerk-user-map.json')
if (!fs.existsSync(mapFile)) { console.error(`Missing ${mapFile}. Run migrate-clerk-users.mjs first.`); process.exit(1) }
const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'))

const pairs = map.filter((m) => m.devId && m.prodId && m.devId !== m.prodId)
console.log(`Mappings with a distinct prod ID: ${pairs.length}`)

const supabase = createClient(url, serviceKey)

let moved = 0, wouldMove = 0
for (const { devId, prodId, email } of pairs) {
  if (DRY) {
    const { count, error } = await supabase
      .from('votes').select('*', { count: 'exact', head: true }).eq('user_id', devId)
    if (error) { console.error(`count failed for ${email}: ${error.message}`); continue }
    if (count) { wouldMove += count; console.log(`  ${email}: ${count} vote(s) would move`) }
  } else {
    const { data, error } = await supabase
      .from('votes').update({ user_id: prodId }).eq('user_id', devId).select('id')
    if (error) { console.error(`update failed for ${email}: ${error.message}`); continue }
    if (data?.length) { moved += data.length; console.log(`  ${email}: moved ${data.length} vote(s)`) }
  }
}

console.log(DRY ? `\n[dry-run] ${wouldMove} vote row(s) would be remapped.` : `\nDone. Remapped ${moved} vote row(s).`)
