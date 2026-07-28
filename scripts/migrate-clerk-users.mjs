/**
 * Clerk development → production user migration.
 *
 * Reads every user from the DEV Clerk instance and re-creates them in the
 * PRODUCTION instance, carrying their primary email and publicMetadata (so your
 * `role: admin` comes across). Writes scratchpad/clerk-user-map.json mapping each
 * user's old dev ID to their new prod ID, keyed by email — remap-votes.mjs uses
 * that map to reattach community votes.
 *
 * Passwords are NOT migrated (Clerk never exposes hashes): email/password users
 * do a one-time reset, social users re-link on next login. See
 * docs/CLERK-PRODUCTION-MIGRATION.md.
 *
 * Usage:
 *   CLERK_DEV_SECRET_KEY=sk_test_… CLERK_PROD_SECRET_KEY=sk_live_… \
 *     node scripts/migrate-clerk-users.mjs [--dry-run]
 *
 * The dev key also falls back to CLERK_SECRET_KEY from .env.local.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DRY = process.argv.includes('--dry-run')
const API = 'https://api.clerk.com/v1'

function loadEnvLocal() {
  const file = path.join(root, '.env.local')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnvLocal()

const DEV_KEY = process.env.CLERK_DEV_SECRET_KEY || process.env.CLERK_SECRET_KEY
const PROD_KEY = process.env.CLERK_PROD_SECRET_KEY
if (!DEV_KEY) { console.error('Missing CLERK_DEV_SECRET_KEY (or CLERK_SECRET_KEY).'); process.exit(1) }
if (!DRY && !PROD_KEY) { console.error('Missing CLERK_PROD_SECRET_KEY (required unless --dry-run).'); process.exit(1) }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function clerk(key, method, endpoint, body) {
  const res = await fetch(`${API}${endpoint}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const json = text ? JSON.parse(text) : null
  return { ok: res.ok, status: res.status, json }
}

async function listAllDevUsers() {
  const users = []
  let offset = 0
  const limit = 100
  for (;;) {
    const { ok, status, json } = await clerk(DEV_KEY, 'GET', `/users?limit=${limit}&offset=${offset}&order_by=-created_at`)
    if (!ok) throw new Error(`Dev list failed (${status}): ${JSON.stringify(json)}`)
    users.push(...json)
    if (json.length < limit) break
    offset += limit
    await sleep(200)
  }
  return users
}

function primaryEmail(u) {
  const byId = u.email_addresses?.find((e) => e.id === u.primary_email_address_id)
  return (byId || u.email_addresses?.[0])?.email_address || null
}

async function findProdUserByEmail(email) {
  const { ok, json } = await clerk(PROD_KEY, 'GET', `/users?email_address=${encodeURIComponent(email)}`)
  return ok && Array.isArray(json) && json[0] ? json[0].id : null
}

async function createProdUser(email, publicMetadata) {
  const { ok, status, json } = await clerk(PROD_KEY, 'POST', '/users', {
    email_address: [email],
    public_metadata: publicMetadata || {},
    skip_password_requirement: true,
  })
  if (ok) return json.id
  // 422 = already exists (or validation) — try to find the existing account.
  if (status === 422) {
    const existing = await findProdUserByEmail(email)
    if (existing) return existing
  }
  throw new Error(`create failed (${status}): ${JSON.stringify(json)}`)
}

const devUsers = await listAllDevUsers()
console.log(`Dev users: ${devUsers.length}`)

const withEmail = devUsers.filter((u) => primaryEmail(u))
const noEmail = devUsers.length - withEmail.length
const providerCounts = {}
for (const u of devUsers) {
  for (const ea of u.external_accounts || []) {
    const p = (ea.provider || '').replace(/^oauth_/, '')
    providerCounts[p] = (providerCounts[p] || 0) + 1
  }
}
console.log(`  with email: ${withEmail.length}${noEmail ? `  (no email, will be skipped: ${noEmail})` : ''}`)
console.log(`  social connections: ${JSON.stringify(providerCounts)}`)

const map = []
if (DRY) {
  for (const u of devUsers) map.push({ email: primaryEmail(u), devId: u.id, prodId: null, publicMetadata: u.public_metadata })
  console.log('\n[dry-run] no users created. Preview map:')
  console.log(JSON.stringify(map.slice(0, 5), null, 2))
} else {
  let created = 0, reused = 0, skipped = 0
  for (const u of devUsers) {
    const email = primaryEmail(u)
    if (!email) { skipped++; console.warn(`skip (no email): dev ${u.id}`); continue }
    try {
      const before = await findProdUserByEmail(email)
      const prodId = await createProdUser(email, u.public_metadata)
      if (before && before === prodId) reused++; else created++
      map.push({ email, devId: u.id, prodId, publicMetadata: u.public_metadata })
      await sleep(250)
    } catch (e) {
      console.error(`FAILED ${email}: ${e.message}`)
    }
  }
  console.log(`\nCreated ${created}, reused ${reused}, skipped ${skipped}.`)
}

const outDir = path.join(root, 'scratchpad')
fs.mkdirSync(outDir, { recursive: true })
const outFile = path.join(outDir, 'clerk-user-map.json')
fs.writeFileSync(outFile, JSON.stringify(map, null, 2))
console.log(`\nWrote ${map.length} mappings → ${outFile}`)
if (!DRY) console.log('Next: swap the Vercel keys to production, then run scripts/remap-votes.mjs')
