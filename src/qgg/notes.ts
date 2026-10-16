import gfNotes from '@/src/gf/data/notes.json'
import invNotes from '@/src/inv/data/notes.json'
import vhNotes from '@/src/vh/data/notes.json'

/**
 * Quantum's own notes on Godforge heroes, Invokers / Titans and Void Hunters hunters:
 * his take, and the Pay-to-Win / New flags. Edited in the Site Admin (each game's
 * Heroes / Units / Hunters tab, via app/api/admin/notes) and kept in a small per-game
 * file the data syncs never touch, so re-running sync-godforge / sync-invokers can't
 * wipe them. DCDL keeps these on the champion itself in heros.json / legacy.json.
 *
 * `take` uses the TakeBody syntax (blank line = paragraph, `## ` heading,
 * `- ` list, `**bold**`).
 *
 * Static imports on purpose: reading these with fs and a path picked per game makes
 * the bundler trace every file under the project into each page's function (1.5 GB,
 * past Vercel's limit). `next dev` hot-reloads the JSON after an admin save.
 */

export type NotesGame = 'godforge' | 'invokers' | 'voidhunters'
export type UnitNote = { take?: string; p2w?: boolean; isNew?: boolean }

const NOTES: Record<NotesGame, Record<string, UnitNote>> = {
  godforge: gfNotes,
  invokers: invNotes,
  voidhunters: vhNotes,
}

/** Every unit's notes for a game. */
export const getUnitNotes = (game: NotesGame): Record<string, UnitNote> => NOTES[game]

export const getUnitNote = (game: NotesGame, id: string): UnitNote => NOTES[game][id] ?? {}

/** Tile badges for a unit (QTile `flags`). */
export function noteFlags(game: NotesGame, id: string) {
  const n = getUnitNote(game, id)
  return n.p2w || n.isNew ? { p2w: !!n.p2w, isNew: !!n.isNew } : undefined
}
