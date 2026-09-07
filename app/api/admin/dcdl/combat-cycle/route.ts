import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { notProd } from '@/src/lib/adminGuard'

const DATA_FILE = path.join(process.cwd(), 'src/dcdl/data/combat-cycle.json')
const ICON_DIR = path.join(process.cwd(), 'public/dcdl/resource_icons')

type CCStatusEffect = { name: string; effect: string }
type CCSkill = { name: string; description: string; type?: string; status_effects?: CCStatusEffect[] }
type CCCurrency = { name: string; image: string }

type CCBoss = {
  id: string
  name: string
  ccTag: string
  day: string
  currencies: CCCurrency[]
  image: string
  portrait: string
  mechanics: string
  skills: CCSkill[]
}

function readBosses(): CCBoss[] {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) } catch { return [] }
}

function listIcons(): string[] {
  try {
    return fs.readdirSync(ICON_DIR)
      .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
      .sort((a, b) => a.localeCompare(b))
  } catch { return [] }
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export async function GET() {
  const guard = notProd()
  if (guard) return guard
  return NextResponse.json({ bosses: readBosses(), icons: listIcons() })
}

// Saves ONE boss back into the array, matched by id. Editing a single boss at a
// time means a save can never clobber the other six.
export async function POST(req: NextRequest) {
  const guard = notProd()
  if (guard) return guard

  const body = (await req.json()) as Partial<CCBoss>
  const id = str(body.id)
  if (!id) return NextResponse.json({ error: 'Missing boss id' }, { status: 400 })

  const bosses = readBosses()
  const idx = bosses.findIndex((b) => b.id === id)
  if (idx === -1) return NextResponse.json({ error: `No boss with id "${id}"` }, { status: 404 })

  if (!str(body.name)) return NextResponse.json({ error: 'Boss name is required' }, { status: 400 })

  const skills: CCSkill[] = (Array.isArray(body.skills) ? body.skills : [])
    .map((s) => {
      const effects = (Array.isArray(s?.status_effects) ? s.status_effects : [])
        .map((e) => ({ name: str(e?.name), effect: str(e?.effect) }))
        .filter((e) => e.name || e.effect)
      const type = str(s?.type)
      return {
        name: str(s?.name),
        description: str(s?.description),
        ...(type ? { type } : {}),
        ...(effects.length > 0 ? { status_effects: effects } : {}),
      }
    })
    .filter((s) => s.name || s.description)

  if (skills.length > 20) {
    return NextResponse.json({ error: 'A boss can have at most 20 skills' }, { status: 400 })
  }

  const currencies: CCCurrency[] = (Array.isArray(body.currencies) ? body.currencies : [])
    .map((c) => ({ name: str(c?.name), image: path.basename(str(c?.image)) }))
    .filter((c) => c.name && c.image)

  // id, image and portrait keep their existing values — those point at files on
  // disk and aren't editable from the panel.
  const existing = bosses[idx]
  bosses[idx] = {
    ...existing,
    name: str(body.name),
    ccTag: str(body.ccTag) || existing.ccTag,
    day: str(body.day),
    mechanics: str(body.mechanics),
    currencies,
    skills,
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(bosses, null, 2), 'utf8')
  return NextResponse.json({ success: true, boss: bosses[idx] })
}
