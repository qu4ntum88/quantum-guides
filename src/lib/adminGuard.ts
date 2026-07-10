import { NextResponse } from 'next/server'

// The admin data endpoints read/write local JSON files and uploaded images on the
// developer's machine. They are part of the local "edit → commit → push" workflow and
// are NOT meant to be callable on the deployed site. Block them in production so the
// deployed app never exposes an unauthenticated write/upload/delete surface.
//
// Returns a 403 response to return early, or null when the request may proceed.
export function notProd() {
  return process.env.NODE_ENV === 'production'
    ? NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    : null
}
