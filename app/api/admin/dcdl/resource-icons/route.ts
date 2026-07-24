import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { notProd } from '@/src/lib/adminGuard'

const ICON_DIR = path.join(process.cwd(), 'public/dcdl/resource_icons')

// Lists the resource icon images available to assign in the admin panel.
export async function GET() {
  const guard = notProd()
  if (guard) return guard
  let files: string[] = []
  try {
    files = fs.readdirSync(ICON_DIR).filter((f) => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f))
  } catch {
    files = []
  }
  const icons = files
    .sort((a, b) => a.localeCompare(b))
    .map((f) => ({ name: f, path: `/dcdl/resource_icons/${f}` }))
  return NextResponse.json(icons)
}
