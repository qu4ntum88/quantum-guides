import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { notProd } from '@/src/lib/adminGuard'

export async function POST(req: NextRequest) {
  const guard = notProd()
  if (guard) return guard

  const formData = await req.formData()
  const file = formData.get('file') as File
  // Sanitize so `folder` can't escape the guides directory (no slashes / `..`).
  const folderRaw = (formData.get('folder') as string) || 'uploads'
  const folder = folderRaw.replace(/[^a-zA-Z0-9_-]/g, '') || 'uploads'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const dir = path.join(process.cwd(), 'public/dcdl/guides', folder)
  fs.mkdirSync(dir, { recursive: true })

  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  fs.writeFileSync(path.join(dir, filename), buffer)

  return NextResponse.json({ url: `/dcdl/guides/${folder}/${filename}` })
}
