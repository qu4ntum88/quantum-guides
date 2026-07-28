'use client'

import { useCallback, useRef } from 'react'

/**
 * Shared UI primitives for the on-site content editor — the style constants,
 * the image-upload hook, and the reusable <ImageField>. Extracted so both
 * ContentEditor and BlockEditor share one implementation.
 */

// ── Shared styles ────────────────────────────────────────────────────────────
export const gold = 'var(--gold)'
export const label: React.CSSProperties = {
  display: 'block', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: gold, marginBottom: '0.35rem', marginTop: '1rem',
}
export const input: React.CSSProperties = {
  width: '100%', padding: '0.55rem 0.7rem', borderRadius: '0.4rem',
  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.35)',
  color: '#fff', fontSize: '0.9rem', fontFamily: 'inherit',
}
export const hint: React.CSSProperties = { fontSize: '0.7rem', color: '#888', marginTop: '0.25rem' }
export const btn: React.CSSProperties = {
  padding: '0.5rem 1.1rem', borderRadius: '0.4rem', border: `1px solid ${gold}`,
  background: gold, color: '#0a0a14', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
  fontFamily: 'Unbounded, sans-serif',
}
export const btnQuiet: React.CSSProperties = {
  ...btn, background: 'transparent', color: '#ccc', borderColor: 'rgba(255,255,255,0.2)',
}
export const btnDanger: React.CSSProperties = { ...btnQuiet, color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)' }

// ── Image upload ─────────────────────────────────────────────────────────────
export function useImageUpload(setStatus: (s: string) => void) {
  return useCallback(async (file: File): Promise<string | null> => {
    setStatus('Uploading image…')
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/content/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) { setStatus(`Upload failed: ${json.error ?? res.status}`); return null }
    setStatus('Image uploaded.')
    return json.url as string
  }, [setStatus])
}

export function ImageField({
  value, onChange, setStatus,
}: { value: string; onChange: (url: string) => void; setStatus: (s: string) => void }) {
  const upload = useImageUpload(setStatus)
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" style={{ maxHeight: '9rem', borderRadius: '0.4rem', border: '1px solid rgba(255,255,255,0.15)', marginBottom: '0.5rem', display: 'block' }} />
      ) : (
        <p style={{ ...hint, marginBottom: '0.5rem' }}>No image yet.</p>
      )}
      <input
        ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f) { const url = await upload(f); if (url) onChange(url) }
          if (ref.current) ref.current.value = ''
        }}
      />
      <button type="button" style={btnQuiet} onClick={() => ref.current?.click()}>
        {value ? 'Replace image' : 'Upload image'}
      </button>
      {value && (
        <button type="button" style={{ ...btnQuiet, marginLeft: '0.5rem' }} onClick={() => onChange('')}>
          Remove
        </button>
      )}
    </div>
  )
}
