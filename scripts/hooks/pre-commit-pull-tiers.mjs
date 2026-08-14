/**
 * PreToolUse hook: keep committed tier data in step with the live site.
 *
 * Wired up in `.claude/settings.json`. Runs before any Bash `git commit` and,
 * when the official tier list has been edited on the site, folds the live
 * rankings back into `heros.json` / `legacy.json` (via scripts/pull-tiers.mjs)
 * and stages them so they land in the same commit.
 *
 * Design rules:
 *   - NEVER block a commit. Every failure path exits 0 quietly; the worst case
 *     is that the JSON is stale, which is exactly where we were before.
 *   - Stay silent when there is nothing to do, so ordinary commits are unaffected.
 *   - Resolve paths from this file, not the cwd, so it works wherever it runs.
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const DATA_FILES = ['src/dcdl/data/heros.json', 'src/dcdl/data/legacy.json']

/** Emit a message into the Claude Code transcript, then stop. */
function say(message) {
  process.stdout.write(`${JSON.stringify({ systemMessage: message })}\n`)
  process.exit(0)
}

function readStdin() {
  try {
    // fd 0 is the hook payload; empty when run by hand.
    return fs.readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim()
}

let payload = {}
try {
  payload = JSON.parse(readStdin() || '{}')
} catch {
  process.exit(0)
}

const command = String(payload?.tool_input?.command ?? '')
if (!/\bgit\s+commit\b/.test(command)) process.exit(0)

// What did the data files look like before? Only report a change we caused.
let before = ''
try {
  before = git(['status', '--porcelain', '--', ...DATA_FILES])
} catch {
  process.exit(0) // not a git repo / git unavailable
}

let output = ''
try {
  output = execFileSync(process.execPath, ['scripts/pull-tiers.mjs'], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 60_000,
  })
} catch (err) {
  // Offline, missing Supabase keys, whatever — say so but let the commit run.
  const detail = String(err?.stderr || err?.message || '').split('\n')[0]
  say(`Tier sync skipped (${detail || 'pull-tiers.mjs failed'}). Committing without it — run "node scripts/pull-tiers.mjs" later if the official tier list has site edits.`)
}

// Nothing saved from the site yet → the script leaves the files alone.
if (/nothing saved on the site yet/.test(output) && !/pulled \d+ rankings/.test(output)) {
  process.exit(0)
}

let after = ''
try {
  after = git(['status', '--porcelain', '--', ...DATA_FILES])
} catch {
  process.exit(0)
}

if (after === before) process.exit(0) // live tiers already matched the files

try {
  git(['add', '--', ...DATA_FILES])
} catch {
  say('Pulled live tier rankings into heros.json / legacy.json, but could not stage them — check "git status" before pushing.')
}

const pulled = output
  .split('\n')
  .filter((line) => /pulled \d+ rankings/.test(line))
  .join(' ')

say(`Synced live tier rankings into the JSON files and staged them for this commit. ${pulled}`.trim())
