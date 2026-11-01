import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { notProd } from '@/src/lib/adminGuard'

// Void Hunters fight recorder (E:\GameAssets\Exports\_pipeline\void-hunters\record-fights.mjs):
// start it in its own window, stop it, and report whether it's running. Local dev only, like
// the other pipeline jobs: the game and the recordings live on the developer's PC.
//
// The recorder keeps _combat\recording.json current while it runs; Stop drops a
// _combat\stop-recording file that it picks up at its next poll (~2s).

const EXPORTS = process.env.GAME_EXPORTS_DIR || 'E:\\GameAssets\\Exports'
const COMBAT = path.join(EXPORTS, 'void-hunters', '_combat')
const LAUNCHER = path.join(COMBAT, 'Record fights.cmd')
const STATUS = path.join(COMBAT, 'recording.json')
const STOP = path.join(COMBAT, 'stop-recording')
const REPORT = path.join(COMBAT, 'REPORT.md')

type Status = { pid: number; startedAt: string; heartbeat: string; savedThisSession: number; lastSaved: string | null; totalSaved: number }

function recorder(): Status | null {
  try {
    const s = JSON.parse(fs.readFileSync(STATUS, 'utf8')) as Status
    if (Date.now() - Date.parse(s.heartbeat) > 15_000) return null
    process.kill(s.pid, 0) // throws when the process is gone
    return s
  } catch {
    return null
  }
}

const fightCount = () => {
  try { return fs.readdirSync(path.join(COMBAT, 'fights')).filter((f) => f.toLowerCase().endsWith('.cra')).length } catch { return 0 }
}

export async function GET(req: NextRequest) {
  const guard = notProd()
  if (guard) return guard
  if (req.nextUrl.searchParams.get('report')) {
    return fs.existsSync(REPORT)
      ? NextResponse.json({ file: REPORT, text: fs.readFileSync(REPORT, 'utf8') })
      : NextResponse.json({ error: 'No report yet: save a fight first.' }, { status: 404 })
  }
  const running = recorder()
  return NextResponse.json({
    installed: fs.existsSync(LAUNCHER),
    running: !!running,
    stopping: !!running && fs.existsSync(STOP),
    startedAt: running?.startedAt ?? null,
    savedThisSession: running?.savedThisSession ?? 0,
    lastSaved: running?.lastSaved ?? null,
    totalSaved: fightCount(),
    reportUpdated: fs.existsSync(REPORT) ? fs.statSync(REPORT).mtime.toISOString() : null,
    folder: COMBAT,
  })
}

// POST { action: 'start' | 'stop' }
export async function POST(req: NextRequest) {
  const guard = notProd()
  if (guard) return guard
  const { action } = (await req.json().catch(() => ({}))) as { action?: string }
  if (action === 'start') {
    if (recorder()) return NextResponse.json({ ok: true, already: true })
    if (!fs.existsSync(LAUNCHER)) return NextResponse.json({ error: `Recorder not found: ${LAUNCHER}` }, { status: 404 })
    try { fs.unlinkSync(STOP) } catch { /* none pending */ }
    // A visible console window of its own, so it keeps recording if the dev server stops.
    // `start x.cmd` would run it with /K and leave the window open after Stop; cmd /c closes it.
    const child = spawn('cmd.exe', ['/c', 'start', '"Void Hunters fight recorder"', 'cmd.exe', '/c', `""${LAUNCHER}""`], {
      cwd: COMBAT, detached: true, stdio: 'ignore', windowsVerbatimArguments: true,
    })
    child.unref()
    return NextResponse.json({ ok: true })
  }
  if (action === 'stop') {
    if (!recorder()) return NextResponse.json({ ok: true, already: true })
    fs.writeFileSync(STOP, new Date().toISOString())
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
