import { NextResponse } from 'next/server'
import { notProd } from '@/src/lib/adminGuard'
import { getGfRoster } from '@/src/gf/lib/heroes'

// Hero picker list for the Site Admin's Godforge → Dungeon Recs tab. Hero data
// itself comes from scripts/sync-godforge.mjs; Quantum's notes on a hero are
// edited through /api/admin/notes.
export async function GET() {
  const guard = notProd()
  if (guard) return guard
  return NextResponse.json(getGfRoster().map((h) => ({ id: h.id, name: h.name, portrait: h.portrait, rarity: h.rarity })))
}
