/**
 * PreToolUse hook: keep committed data files honest.
 *
 * Wired up in `.claude/settings.json`. Runs before any Bash `git commit` and
 * does two independent jobs:
 *
 *   1. Tier sync — when the official tier list has been edited on the site,
 *      folds the live rankings back into `heros.json` / `legacy.json` (via
 *      pull-tiers.mjs), because after the first on-site save Supabase is the
 *      source of truth and the JSON is only a fallback.
 *
 *   2. Date stamping — records today's date in `data-updated.json` for every
 *      data file the commit touches. That file drives the "Updated:" line on
 *      the tier list, best teams, combat cycle, and supreme commander pages;
 *      it exists because build systems normalise file mtimes, so the old
 *      mtime-based approach reported October 2018 in production.
 *
 * Anything either job changes is staged so it lands in the same commit.
 *
 * Design rules:
 *   - NEVER block a commit. Every failure path exits 0; the worst case is that
 *     the data is stale, which is exactly where we were before.
 *   - Stay silent when there is nothing to do, so ordinary commits look normal.
 *   - Resolve paths from this file, not the cwd, so it works wherever it runs.
 */

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const DATA_DIR = 'src/dcdl/data'
const TIER_FILES = [`${DATA_DIR}/heros.json`, `${DATA_DIR}/legacy.json`]
const STAMP_FILE = `${DATA_DIR}/data-updated.json`

const notes = []

/** Report what happened (if anything) and stop. */
function finish() {
  if (notes.length > 0) {
    process.stdout.write(`${JSON.stringify({ systemMessage: notes.join(' ') })}\n`)
  }
  process.exit(0)
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim()
}

function node(args) {
  return execFileSync(process.execPath, args, { cwd: repoRoot, encoding: 'utf8', timeout: 60_000 })
}

/** Is this a git repo we can work in? */
function gitAvailable() {
  try {
    git(['rev-parse', '--git-dir'])
    return true
  } catch {
    return false
  }
}

/**
 * Fingerprint file contents, so we detect a change the way that actually
 * matters. `git status --porcelain` is not enough: an untracked file reads
 * "??" both before and after its contents change, and an already-dirty file
 * reads " M" either way.
 */
function fingerprint(files) {
  return files
    .map((f) => {
      try {
        return createHash('sha1').update(fs.readFileSync(path.join(repoRoot, f))).digest('hex')
      } catch {
        return 'missing'
      }
    })
    .join('|')
}

// ── Is this a commit? ────────────────────────────────────────────────────────
let payload = {}
try {
  payload = JSON.parse(fs.readFileSync(0, 'utf8') || '{}')
} catch {
  process.exit(0)
}
if (!/\bgit\s+commit\b/.test(String(payload?.tool_input?.command ?? ''))) process.exit(0)
if (!gitAvailable()) process.exit(0)

// ── 1. Tier sync ─────────────────────────────────────────────────────────────
const beforeTiers = fingerprint(TIER_FILES)
let pullOutput = ''
try {
  pullOutput = node(['scripts/pull-tiers.mjs'])
} catch (err) {
  const detail = String(err?.stderr || err?.message || '').split('\n')[0]
  notes.push(`Tier sync skipped (${detail || 'pull-tiers.mjs failed'}); committing without it.`)
}

if (pullOutput && fingerprint(TIER_FILES) !== beforeTiers) {
  try {
    git(['add', '--', ...TIER_FILES])
    const pulled = pullOutput.split('\n').filter((l) => /pulled \d+ rankings/.test(l)).join(' ')
    notes.push(`Synced live tier rankings into the JSON files and staged them. ${pulled}`.trim())
  } catch {
    notes.push('Pulled live tier rankings but could not stage them — check "git status" before pushing.')
  }
}

// ── 2. Date stamping ─────────────────────────────────────────────────────────
// Every data file staged for this commit gets today's date, so the public
// "Updated:" line reflects reality after deploy.
let staged = []
try {
  staged = git(['diff', '--cached', '--name-only', '--', DATA_DIR])
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.endsWith('.json') && !s.endsWith('data-updated.json'))
} catch {
  finish()
}

if (staged.length === 0) finish()

const beforeStamp = fingerprint([STAMP_FILE])
try {
  node(['scripts/stamp-data-dates.mjs', ...staged])
} catch {
  finish() // stamping is best-effort
}

if (fingerprint([STAMP_FILE]) !== beforeStamp) {
  try {
    git(['add', '--', STAMP_FILE])
    const names = staged.map((f) => path.basename(f)).join(', ')
    notes.push(`Stamped today's date for ${names} in data-updated.json.`)
  } catch {
    // Non-fatal: the stamp is written, just not staged.
  }
}

finish()
