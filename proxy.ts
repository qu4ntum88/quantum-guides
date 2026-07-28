import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// NOTE: /admin/content is intentionally NOT protected here. Clerk's
// auth.protect() was returning a 404 on the current (development) Clerk
// instance, and it's redundant anyway — app/admin/content/page.tsx and every
// /api/admin/content/* route independently enforce getIsAdmin(). Gating it in
// the page (via auth()) instead of the middleware (via auth.protect()) avoids
// the failing handshake path.
const isProtectedRoute = createRouteMatcher(['/members(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
