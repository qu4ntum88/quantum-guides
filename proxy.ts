import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest, type NextFetchEvent } from 'next/server'

// NOTHING is protected via auth.protect() here, deliberately.
//
// On the current Clerk instance auth.protect() returns a 404 to signed-out
// visitors instead of redirecting them to sign-in. /admin/content was already
// excluded for that reason; /members had the same bug (any signed-out visitor
// hitting it got a 404 rather than the sign-in prompt the page renders), and
// /studio inherited it when it was added alongside.
//
// Every one of these pages gates itself client-side via useUser() and renders a
// proper signed-out state, and every /api/** route re-resolves the caller's
// role server-side (requireRole / getIsAdmin) before touching data — so the
// middleware check was redundant as well as broken.
//
// clerkMiddleware still runs, which is what makes auth() and useUser() work.
const clerk = clerkMiddleware()

// A corrupt __session cookie must never take the site down.
//
// Verified against production on 2026-08-14: a __session cookie whose signature
// segment is not decodable base64 makes clerkMiddleware throw *before* it sets its
// own X-Clerk-Auth-* headers, so every page returns a bare HTTP 500 — reproducible
// 5/5. The visitor is then wedged: the cookie is sent on every request, including
// the one that would let them sign out, so there is no in-app way to recover.
// Well-formed foreign or expired tokens are handled correctly, so this only bites on
// actual cookie corruption — but the blast radius is the entire site for that person.
//
// Treat an unparseable session as no session: continue signed-out and expire the bad
// cookie on every scope it could have been set on, so the next request is clean.
export default async function proxy(req: NextRequest, evt: NextFetchEvent) {
  try {
    return await clerk(req, evt)
  } catch (err) {
    console.error('[proxy] clerkMiddleware threw; clearing session cookies', err)

    const res = NextResponse.next()
    const host = req.nextUrl.hostname
    // Cookies may have been written host-only or on the registrable domain; clearing
    // one scope leaves the other being sent, so clear both.
    const domains: (string | undefined)[] = [undefined, host.replace(/^www\./, '.')]
    for (const name of ['__session', '__client_uat', '__clerk_db_jwt']) {
      for (const domain of domains) {
        res.cookies.set({ name, value: '', maxAge: 0, path: '/', ...(domain ? { domain } : {}) })
      }
    }
    return res
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
