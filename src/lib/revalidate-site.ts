import { revalidatePath } from 'next/cache'

/**
 * Rebuild every page on its next visit. Called by the LIVE admin routes after a
 * successful write (guides, patch notes, codes, infographics, moderation, tier lists,
 * history), so a save shows on the site straight away.
 *
 * Pages themselves only refresh once a day (`revalidate = 86400`). They used to
 * refresh every 60 s, which kept Vercel rebuilding 300–800 KB pages whenever a
 * crawler or a link prefetch came by: 617K ISR writes in a month, and part of why
 * the site was paused on Hobby (2026-11-07). Admin saves are rare, so throwing the
 * whole cache away on each one costs far less than a timer.
 *
 * Data written outside these routes (e.g. the local patch-notes sync script writing
 * straight to Supabase) shows within a day, or on the next deploy.
 */
export function revalidateSite() {
  revalidatePath('/', 'layout')
}
