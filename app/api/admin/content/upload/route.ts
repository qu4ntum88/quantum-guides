import { NextRequest, NextResponse } from 'next/server'
import { getIsAdmin } from '@/src/lib/adminAuth'
import { supabaseAdmin } from '@/src/lib/supabase'

// Admin-only image upload. Receives a file, stores it in the public
// `content-images` Supabase Storage bucket, and returns its public URL.
// Replaces the old disk-write flow (which only worked on local dev).

const BUCKET = 'content-images'

export async function POST(req: NextRequest) {
  if (!(await getIsAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

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
