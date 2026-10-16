import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { notProd } from '@/src/lib/adminGuard'

// Runs the game-data pipeline scripts (E:\GameAssets\Exports\_pipeline) and the site sync
// scripts from the local admin panel. Local dev only: the game installs and AssetStudio live
// on the developer's PC, so this is blocked in production by notProd().
//
// Only the jobs listed here can run; the client sends a job id, never a command.

const EXPORTS = process.env.GAME_EXPORTS_DIR || 'E:\\GameAssets\\Exports'
const REPO = process.cwd()

type JobDef = { label: string; group: string; cwd: string; args: string[]; note?: string; report?: string }
const JOBS: Record<string, JobDef> = {
  'dcdl-extract': {
    group: 'DC: Dark Legion', label: 'Extract from game files',
    cwd: EXPORTS, args: [path.join(EXPORTS, '_pipeline', 'dcdl', 'update.mjs')],
    note: 'Art export + champions, legacy, game modes, events, change report. ~3–5 min.', report: 'dcdl',
  },
  'dcdl-extract-data': {
    group: 'DC: Dark Legion', label: 'Extract data only (reuse art)',
    cwd: EXPORTS, args: [path.join(EXPORTS, '_pipeline', 'dcdl', 'update.mjs'), '--skip-images'],
    note: 'Skips AssetStudio. ~1–2 min.', report: 'dcdl',
  },
  'dcdl-kits-preview': {
    group: 'DC: Dark Legion', label: 'Refresh site kits — preview',
    cwd: REPO, args: [path.join(REPO, 'scripts', 'sync-dcdl-kits.mjs')],
    note: 'Dry run: lists the champion, legacy and Combat Cycle text that would change.',
  },
  'dcdl-kits-apply': {
    group: 'DC: Dark Legion', label: 'Refresh site kits — apply',
    cwd: REPO, args: [path.join(REPO, 'scripts', 'sync-dcdl-kits.mjs'), '--write'],
    note: 'Writes heros.json, legacy.json, combat-cycle.json (descriptions only). Commit afterwards.',
  },
  'dcdl-sc-preview': {
    group: 'DC: Dark Legion', label: 'Check Supreme Commander — preview',
    cwd: REPO, args: [path.join(REPO, 'scripts', 'sync-dcdl-supreme-commander.mjs')],
    note: 'Dry run: compares point values, reward tracks and Maneuvers rewards with the game files; lists what would change.',
  },
  'dcdl-sc-apply': {
    group: 'DC: Dark Legion', label: 'Check Supreme Commander — apply',
    cwd: REPO, args: [path.join(REPO, 'scripts', 'sync-dcdl-supreme-commander.mjs'), '--write'],
    note: 'Writes the numbers in supreme-commander.json (tips, titles and icons are never touched). Commit afterwards.',
  },
  'vh-extract': {
    group: 'Void Hunters', label: 'Extract from game files',
    cwd: EXPORTS, args: [path.join(EXPORTS, '_pipeline', 'void-hunters', 'update.mjs')],
    note: 'Names, titles, lore, skill text templates, status effects + art. Play once after an update first. ~4–6 min.', report: 'void-hunters',
  },
  'vh-extract-data': {
    group: 'Void Hunters', label: 'Extract text only (reuse art)',
    cwd: EXPORTS, args: [path.join(EXPORTS, '_pipeline', 'void-hunters', 'update.mjs'), '--skip-images'],
    note: 'Skips the art export. ~1 min.', report: 'void-hunters',
  },
  'inv-extract': {
    group: 'Invokers: Titan Legacy', label: 'Pull from invokers.com',
    cwd: EXPORTS, args: [path.join(EXPORTS, '_pipeline', 'invokers', 'update.mjs')],
    note: 'Every Invoker + Titan: kits at all levels, stats, tolerances, official tier ratings, art. ~6–8 min first run, faster after (pages/art cached).', report: 'invokers',
  },
  'inv-site-sync': {
    group: 'Invokers: Titan Legacy', label: 'Update the site from the export',
    cwd: REPO, args: [path.join(REPO, 'scripts', 'sync-invokers.mjs'), '--write'],
    note: 'Rewrites src/inv/data (roster, unit pages, boss tier lists) and public/invokers art. Commit afterwards.',
  },
  'gf-extract': {
    group: 'Godforge', label: 'Extract from game files + godforge.gg',
    cwd: EXPORTS, args: [path.join(EXPORTS, '_pipeline', 'godforge', 'update.mjs')],
    note: 'Art export, game config, godforge.gg hero pages, bosses, weapons. ~6–8 min.', report: 'godforge',
  },
  'gf-extract-data': {
    group: 'Godforge', label: 'Extract data only (reuse art)',
    cwd: EXPORTS, args: [path.join(EXPORTS, '_pipeline', 'godforge', 'update.mjs'), '--skip-images'],
    note: 'Skips AssetStudio; still re-reads godforge.gg (cached pages are reused).', report: 'godforge',
  },
  'gf-site-sync': {
    group: 'Godforge', label: 'Update the hero pages from the export',
    cwd: REPO, args: [path.join(REPO, 'scripts', 'sync-godforge.mjs'), '--write'],
    note: 'Rewrites src/gf/data/game/heroes (kit, stats, ascension/awakening, summary, lore), legacy-ids.json and ability icons. Commit afterwards.',
  },
}

type Run = { id: string; job: string; startedAt: number; endedAt?: number; code?: number | null; log: string }
// Module-level so runs survive between requests while the dev server is up.
const g = globalThis as unknown as { __pipelineRuns?: Map<string, Run> }
const runs = (g.__pipelineRuns ??= new Map())

function latestReport(game: string) {
  const dir = path.join(EXPORTS, game, '_review')
  if (!fs.existsSync(dir)) return null
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()
  const latest = files[files.length - 1]
  return latest ? { file: latest, text: fs.readFileSync(path.join(dir, latest), 'utf8') } : null
}

export async function GET(req: NextRequest) {
  const guard = notProd()
  if (guard) return guard
  const id = req.nextUrl.searchParams.get('run')
  if (id) {
    const run = runs.get(id)
    return run ? NextResponse.json(run) : NextResponse.json({ error: 'Unknown run' }, { status: 404 })
  }
  const report = req.nextUrl.searchParams.get('report')
  if (report) return NextResponse.json(latestReport(['godforge', 'void-hunters', 'invokers'].includes(report) ? report : 'dcdl'))
  return NextResponse.json({
    exportsDir: EXPORTS,
    jobs: Object.entries(JOBS).map(([id, j]) => ({ id, group: j.group, label: j.label, note: j.note, report: j.report })),
    runs: [...runs.values()].map(({ log, ...r }) => ({ ...r, logTail: log.slice(-400) })).sort((a, b) => b.startedAt - a.startedAt).slice(0, 10),
  })
}

export async function POST(req: NextRequest) {
  const guard = notProd()
  if (guard) return guard
  const { job } = (await req.json().catch(() => ({}))) as { job?: string }
  const def = job ? JOBS[job] : undefined
  if (!def || !job) return NextResponse.json({ error: 'Unknown job' }, { status: 400 })
  if ([...runs.values()].some((r) => r.job === job && r.endedAt === undefined)) {
    return NextResponse.json({ error: 'That job is already running' }, { status: 409 })
  }
  if (!fs.existsSync(def.args[0])) return NextResponse.json({ error: `Script not found: ${def.args[0]}` }, { status: 404 })

  const id = `${job}-${Date.now()}`
  const run: Run = { id, job, startedAt: Date.now(), log: '' }
  runs.set(id, run)
  const child = spawn(process.execPath, def.args, { cwd: def.cwd, windowsHide: true })
  const append = (chunk: Buffer) => { run.log = (run.log + chunk.toString()).slice(-200_000) }
  child.stdout.on('data', append)
  child.stderr.on('data', append)
  child.on('close', (code) => { run.code = code; run.endedAt = Date.now() })
  child.on('error', (e) => { run.log += `\n${e.message}`; run.code = -1; run.endedAt = Date.now() })
  return NextResponse.json({ id })
}
