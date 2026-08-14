import { clerkMiddleware } from '@clerk/nextjs/server'

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
export default clerkMiddleware()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
