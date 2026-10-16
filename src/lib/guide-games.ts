/**
 * The site's games, as the CMS knows them. A guide's `game` column (Supabase
 * `guides.game`) decides which section lists it and the URL it lives at; the
 * same ids key `patch_notes.game` and `game_info.game`, so every game gets its
 * own patch notes and codes. Isomorphic: used by the editors, the save routes
 * and the public pages.
 *
 * Adding a game here also needs: the id in the `guides_game_check`,
 * `patch_notes_game_check` and `game_info_game_check` constraints, a
 * `<base>/[id]` guide page (see `src/qgg/components/WorldGuidePage.tsx`), and
 * the game's guides in the sitemap.
 */
export const GUIDE_GAMES = [
  { id: 'dcdl', label: 'DC: Dark Legion', base: '/games/dc-dark-legion/guides', hub: '/games/dc-dark-legion/guides' },
  { id: 'godforge', label: 'Godforge', base: '/games/godforge/guides', hub: '/games/godforge' },
  { id: 'invokers', label: 'Invokers: Titan Legacy', base: '/games/invokers/guides', hub: '/games/invokers/guides' },
  { id: 'voidhunters', label: 'Void Hunters', base: '/games/void-hunters/guides', hub: '/games/void-hunters/guides' },
] as const

export type GuideGame = (typeof GUIDE_GAMES)[number]['id']

export const DEFAULT_GUIDE_GAME: GuideGame = 'dcdl'

export function toGuideGame(v: unknown): GuideGame {
  return GUIDE_GAMES.some((g) => g.id === v) ? (v as GuideGame) : DEFAULT_GUIDE_GAME
}

export const guideGame = (game: GuideGame) => GUIDE_GAMES.find((g) => g.id === game)!

export const guidePath = (game: GuideGame, id: string) => `${guideGame(game).base}/${id}`
