import { redirect } from 'next/navigation'

// The official tier lists now live on the database pages themselves (the
// "Tier List" view of /games/dc-dark-legion and /games/dc-dark-legion/legacy),
// and community lists moved to the infographics page. Kept as a temporary
// redirect, not a permanent one, while the merged layout is being trialled.
// Community list pages under /tier-list/[slug] are unaffected.
export default function TierListPage() {
  redirect('/games/dc-dark-legion?view=tier')
}
