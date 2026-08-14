import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/src/lib/roles-server'
import { supabaseAdmin } from '@/src/lib/supabase'

// Image upload for editors and admins. Receives a file, stores it in the public
// `content-images` Supabase Storage bucket, and returns its public URL.
// Replaces the old disk-write flow (which only worked on local dev).

const BUCKET = 'content-images'
const MAX_BYTES = 12 * 1024 * 1024

export async function POST(req: NextRequest) {
  if (!(await requireRole('editor'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Images must be 12 MB or smaller.' }, { status: 413 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files can be uploaded.' }, { status: 415 })
  }

  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
  const objectPath = `${crypto.randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(objectPath, buffer, {
    cacheControl: '31536000',
    contentType: file.type || `image/${ext}`,
    upsert: false,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const url = supabaseAdmin.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl
  return NextResponse.json({ url })
}
