import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

const synergiesPath = path.join(process.cwd(), 'src/dcdl/data/synergies.json')
const infographicsDir = path.join(process.cwd(), 'public/dcdl/synergies/faction_infographics')

function notProd() {
  return process.env.NODE_ENV === 'production'
    ? NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    : null
}

export async function GET() {
  const guard = notProd()
  if (guard) return guard
  const synergies = JSON.parse(fs.readFileSync(synergiesPath, 'utf8'))
  const result = synergies.map((s: { id: string; name: string; image?: string; infographic?: string }) => ({
    id: s.id,
    name: s.name,
    image: s.image?.replace('./tag_images/', '/dcdl/synergies/tag_images/'),
    infographic: s.infographic?.replace('./faction_infographics/', '/dcdl/synergies/faction_infographics/'),
  }))
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const guard = notProd()
  if (guard) return guard

  const formData = await req.formData()
  const id = formData.get('id') as string
  const imageFile = formData.get('image') as File | null

  if (!id) return NextResponse.json({ error: 'Faction id is required.' }, { status: 400 })

  const synergies: Record<string, unknown>[] = JSON.parse(fs.readFileSync(synergiesPath, 'utf8'))
  const idx = synergies.findIndex((s) => (s as { id: string }).id === id)
  if (idx === -1) return NextResponse.json({ error: `Faction "${id}" not found.` }, { status: 404 })

  let infographicPath = (synergies[idx] as Record<string, unknown>).infographic as string | undefined

  if (imageFile?.size) {
    if (!fs.existsSync(infographicsDir)) fs.mkdirSync(infographicsDir, { recursive: true })
    const buffer = Buffer.from(await imageFile.arrayBuffer())
    fs.writeFileSync(path.join(infographicsDir, imageFile.name), buffer)
    infographicPath = `./faction_infographics/${imageFile.name}`
  }

  synergies[idx] = { ...synergies[idx], ...(infographicPath ? { infographic: infographicPath } : {}) }
  fs.writeFileSync(synergiesPath, JSON.stringify(synergies, null, 2))

  return NextResponse.json({ success: true })
}
