import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { notProd } from '@/src/lib/adminGuard'
import type { NotesGame, UnitNote } from '@/src/qgg/notes'
import { getGfRoster } from '@/src/gf/lib/heroes'
import { getVhRoster } from '@/src/vh/lib/hunters'
import { getRoster } from '@/src/inv/lib/data'

/**
 * Quantum's Take + P2W / New flags for Godforge heroes, Invokers / Titans and
 * Void Hunters hunters (src/qgg/notes.ts). Local Site Admin only: it writes the
 * game's notes.json, which is committed and deployed like the rest of the data.
 *
 *   GET   ?game=godforge|invokers|voidhunters → { units, notes }
 *   PATCH { game, id, note }                  → saves (an empty note removes the entry)
 */

const GAMES: NotesGame[] = ['godforge', 'invokers', 'voidhunters']

// Literal paths, one per game: a path computed from `game` would make the bundler
// trace the whole project into this function (see src/qgg/notes.ts).
function notesFile(game: NotesGame): string {
  if (game === 'godforge') return path.join(process.cwd(), 'src/gf/data/notes.json')
  if (game === 'invokers') return path.join(process.cwd(), 'src/inv/data/notes.json')
  return path.join(process.cwd(), 'src/vh/data/notes.json')
}

// Read fresh from disk (not the page-side import), so a save never works from a stale copy.
function readUnitNotes(game: NotesGame): Record<string, UnitNote> {
  try {
    return JSON.parse(fs.readFileSync(notesFile(game), 'utf8'))
  } catch {
    return {}
  }
}

const parseGame = (v: unknown): NotesGame | null => (GAMES.includes(v as NotesGame) ? (v as NotesGame) : null)

type UnitRow = { id: string; name: string; img: string | null; group: string; rarity: string | null }

function unitsFor(game: NotesGame): UnitRow[] {
  if (game === 'godforge') {
    return getGfRoster().map((h) => ({ id: h.id, name: h.name, img: h.portrait || h.fullArt, group: h.archetype ?? '', rarity: h.rarity }))
  }
  if (game === 'voidhunters') {
    return getVhRoster().map((h) => ({ id: h.id, name: h.name, img: h.portrait, group: h.class?.[0] ?? '', rarity: h.rarity }))
  }
  return getRoster().map((u) => ({ id: u.slug, name: u.name, img: u.portrait, group: u.kind, rarity: u.rarity }))
}

export async function GET(req: NextRequest) {
  const guard = notProd()
  if (guard) return guard
  const game = parseGame(req.nextUrl.searchParams.get('game'))
  if (!game) return NextResponse.json({ error: 'Unknown game' }, { status: 400 })
  const units = unitsFor(game).sort((a, b) => a.name.localeCompare(b.name))
  return NextResponse.json({ units, notes: readUnitNotes(game) })
}

export async function PATCH(req: NextRequest) {
  const guard = notProd()
  if (guard) return guard
  const b = await req.json().catch(() => ({}))
  const game = parseGame(b.game)
  const id = String(b.id ?? '')
  if (!game || !id) return NextResponse.json({ error: 'game and id are required' }, { status: 400 })
  if (!unitsFor(game).some((u) => u.id === id)) return NextResponse.json({ error: `No ${game} unit "${id}"` }, { status: 404 })

  const take = String(b.note?.take ?? '').replace(/\r\n/g, '\n').trim()
  const note: UnitNote = {
    ...(take && { take }),
    ...(b.note?.p2w && { p2w: true }),
    ...(b.note?.isNew && { isNew: true }),
  }

  const notes = readUnitNotes(game)
  if (Object.keys(note).length) notes[id] = note
  else delete notes[id]
  // Sorted keys keep the diff small and stable.
  const sorted = Object.fromEntries(Object.keys(notes).sort().map((k) => [k, notes[k]]))
  fs.writeFileSync(notesFile(game), `${JSON.stringify(sorted, null, 2)}\n`)
  return NextResponse.json({ success: true, note })
}
