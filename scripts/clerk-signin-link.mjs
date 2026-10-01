#!/usr/bin/env node
/**
 * Mint a one-time sign-in link for a user who cannot use the normal sign-in UI.
 *
 * Why this exists: the July 2026 dev->production Clerk migration created *shell*
 * accounts — Clerk cannot export password hashes, and OAuth connections cannot be
 * copied, so every migrated user arrived with a verified email and nothing else.
 * Their only factor is an emailed code, and if they can't reach the sign-in UI at
 * all they have no way to even request one. This is the escape hatch: the link
 * signs them in directly, no password, no OAuth, no email round-trip.
 *
 * Once they're in, they should add a password or connect Google/Discord from the
 * user menu ("Manage account"), which permanently fixes their access.
 *
 * Usage:
 *   node scripts/clerk-signin-link.mjs someone@example.com
 *   node scripts/clerk-signin-link.mjs someone@example.com other@example.com
 *   node scripts/clerk-signin-link.mjs --all-migrated     # everyone from 2026-07-28
 *
 * Links are single-use and expire in 1 hour by default (--hours=N to change).
 * Treat them like passwords: anyone holding the link becomes that user.
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const SITE = 'https://www.quantumgameguides.com'
const MIGRATION_DAY = '2026-07-28'

function loadEnv() {
  const file = path.join(ROOT, '.env.local')
  if (!fs.existsSync(file)) return {}
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=')
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
      })
  )
}

const env = { ...loadEnv(), ...process.env }
// IMPORTANT: always the sk_live key. CLERK_SECRET_KEY in .env.local is the *dev*
// instance, which the website does not use — see docs and the two-instance note.
const sk = [env.CLERK_PROD_SECRET_KEY, env.CLERK_SECRET_KEY].find((k) => k?.startsWith('sk_live'))
if (!sk) {
  console.error('No sk_live key found. Set CLERK_PROD_SECRET_KEY in .env.local.')
  process.exit(1)
}

const api = async (p, opts = {}) => {
  const r = await fetch(`https://api.clerk.com/v1${p}`, {
    ...opts,
    headers: { Authorization: `Bearer ${sk}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  })
  const text = await r.text()
  let body
  try { body = JSON.parse(text) } catch { body = text }
  return { status: r.status, body }
}

const args = process.argv.slice(2)
const hoursArg = args.find((a) => a.startsWith('--hours='))
const hours = hoursArg ? Number(hoursArg.split('=')[1]) : 1
const emails = args.filter((a) => !a.startsWith('--'))
const allMigrated = args.includes('--all-migrated')

if (!emails.length && !allMigrated) {
  console.error('Usage: node scripts/clerk-signin-link.mjs <email> [more emails] | --all-migrated [--hours=N]')
  process.exit(1)
}

// Confirm which instance we're about to touch, so this can never hit the wrong one.
const inst = await api('/instance')
if (inst.body?.environment_type !== 'production') {
  console.error(`Refusing to run: key resolves to "${inst.body?.environment_type}" instance ${inst.body?.id}`)
  process.exit(1)
}
console.log(`instance ${inst.body.id} (production)\n`)

let targets = []
if (allMigrated) {
  let all = []
  for (let off = 0; off < 2000; off += 100) {
    const { body } = await api(`/users?limit=100&offset=${off}`)
    if (!Array.isArray(body) || !body.length) break
    all = all.concat(body)
    if (body.length < 100) break
  }
  targets = all.filter((u) => new Date(u.created_at).toISOString().slice(0, 10) === MIGRATION_DAY)
  console.log(`${targets.length} accounts from the ${MIGRATION_DAY} migration\n`)
} else {
  for (const email of emails) {
    const { body } = await api(`/users?email_address=${encodeURIComponent(email)}`)
    if (Array.isArray(body) && body[0]) targets.push(body[0])
    else console.error(`  NOT FOUND: ${email}`)
  }
}

for (const u of targets) {
  const primary = (u.email_addresses ?? []).find((e) => e.id === u.primary_email_address_id) ?? u.email_addresses?.[0]
  const { status, body } = await api('/sign_in_tokens', {
    method: 'POST',
    body: JSON.stringify({ user_id: u.id, expires_in_seconds: Math.round(hours * 3600) }),
  })
  if (status >= 300) {
    console.error(`${primary?.email_address}\n  FAILED ${status}: ${JSON.stringify(body).slice(0, 200)}\n`)
    continue
  }
  console.log(`${primary?.email_address ?? u.id}`)
  console.log(`${SITE}/sign-in?__clerk_ticket=${body.token}\n`)
}

console.log(`Links are single-use and expire in ${hours}h. Anyone holding one becomes that user — send them directly, never in a public channel.`)
