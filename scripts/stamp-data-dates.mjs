/**
 * Maintains `src/dcdl/data/data-updated.json` — the "last updated" date for each
 * data file, used by the Updated: stamp on the tier list, best teams, combat
 * cycle, and supreme commander pages.
 *
 * Why this file exists: those pages used to read `fs.statSync().mtimeMs`, but
 * build systems normalise file mtimes, so in production every data file
 * reported the same bogus date (October 20, 2018). A committed stamp is the
 * only thing that survives a deploy intact.
 *
 * Two modes:
 *
 *   node scripts/stamp-data-dates.mjs --seed
 *     Fill in any missing entry from git history (the last commit that touched
 *     that file). Existing entries are left alone.
 *
 *   node scripts/stamp-data-dates.mjs <file...>
 *     Stamp the named data files with today's date. Used by the pre-commit hook
 *     for whichever data files that commit touches.
 *
 * Exits 0 on every path — this must never be able to block a commit.
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(repoRoot, 'src/dcdl/data')
const stampPath = path.join(dataDir, 'data-updated.json')

function readStamp() {
  try {
    return JSON.parse(fs.readFileSync(stampPath, 'utf8'))
  } catch {
    return {}
  }
}

function writeStamp(stamp) {
  // Sorted keys so the file has a stable diff.
  const sorted = Object.fromEntries(Object.entries(stamp).sort(([a], [b]) => a.localeCompare(b)))
  fs.writeFileSync(stampPath, `${JSON.stringify(sorted, null, 2)}\n`)
}

/** ISO date (YYYY-MM-DD) of the last commit touching a data file, if any. */
function gitDate(fileName) {
  try {
    const out = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', `src/dcdl/data/${fileName}`],
      { cwd: repoRoot, encoding: 'utf8' }
    ).trim()
    return out ? out.slice(0, 10) : null
  } catch {
    return null
  }
}

const args = process.argv.slice(2)
const stamp = readStamp()
let changed = false

if (args.includes('--seed')) {
  let files = []
  try {
    files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json') && f !== 'data-updated.json')
  } catch {
    process.exit(0)
  }
  for (const file of files) {
    if (stamp[file]) continue
    const date = gitDate(file)
    if (!date) continue
    stamp[file] = date
    changed = true
    console.log(`seeded ${file} → ${date}`)
  }
} else {
  const today = new Date().toISOString().slice(0, 10)
  for (const arg of args) {
    const file = path.basename(arg)
    if (!file.endsWith('.json') || file === 'data-updated.json') continue
    if (stamp[file] === today) continue
    stamp[file] = today
    changed = true
  }
}

if (changed) writeStamp(stamp)
process.exit(0)
