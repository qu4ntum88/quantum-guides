import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { notProd } from '@/src/lib/adminGuard'
import type { BaseSkinNotes, SkinNote } from '@/src/dcdl/lib/base-skins'

/**
 * Quantum's Take and extra "how to get" text per DCDL base skin. Local Site Admin only: it
 * writes src/dcdl/data/base-skins-notes.json, which the base-skins sync never touches.
 *
 *   GET                       → { skins, notes }
 *   PATCH { id, note }        → saves (an empty note removes the entry)
 */

const DATA_FILE = path.join(process.cwd(), 'src/dcdl/data/base-skins.json')
const NOTES_FILE = path.join(process.cwd(), 'src/dcdl/data/base-skins-notes.json')

type SkinRow = { id: string; name: string; icon: string | null; order: number }

// Read fresh from disk, so a save never works from a stale copy.
function readSkins(): SkinRow[] {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as { skins: SkinRow[] }
  return data.skins.map(({ id, name, icon, order }) => ({ id, name, icon, order })).sort((a, b) => b.order - a.order)
}
function readNotes(): BaseSkinNotes {
  try {
    const n = JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'))
    return { confirmedInGame: n.confirmedInGame ?? [], skins: n.skins ?? {} }
  } catch {
    return { confirmedInGame: [], skins: {} }
  }
}

export async function GET() {
  const guard = notProd()
  if (guard) return guard
  return NextResponse.json({ skins: readSkins(), notes: readNotes().skins })
}

export async function PATCH(req: NextRequest) {
  const guard = notProd()
  if (guard) return guard
  const b = await req.json().catch(() => ({}))
  const id = String(b.id ?? '')
  if (!readSkins().some((s) => s.id === id)) return NextResponse.json({ error: `No base skin "${id}"` }, { status: 404 })

  const clean = (v: unknown) => String(v ?? '').replace(/\r\n/g, '\n').trim()
  const take = clean(b.note?.take)
  const howToGet = clean(b.note?.howToGet)
  const note: SkinNote = { ...(howToGet && { howToGet }), ...(take && { take }) }

  const notes = readNotes()
  if (Object.keys(note).length) notes.skins[id] = note
  else delete notes.skins[id]
  // Sorted keys keep the diff small and stable.
  const skins = Object.fromEntries(Object.keys(notes.skins).sort().map((k) => [k, notes.skins[k]]))
  fs.writeFileSync(NOTES_FILE, `${JSON.stringify({ confirmedInGame: notes.confirmedInGame, skins }, null, 2)}\n`)
  return NextResponse.json({ success: true, note })
}
