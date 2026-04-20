import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const folder = (formData.get('folder') as string) || 'uploads'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const dir = path.join(process.cwd(), 'public/dcdl/guides', folder)
  fs.mkdirSync(dir, { recursive: true })

  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  fs.writeFileSync(path.join(dir, filename), buffer)

  return NextResponse.json({ url: `/dcdl/guides/${folder}/${filename}` })
}
