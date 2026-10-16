/**
 * Games that have a CMS guide section. A guide's `game` column (Supabase
 * `guides.game`, check-constrained to these ids) decides which section lists
 * it and the URL it lives at. Isomorphic: used by the editor, the save route
 * and the public pages.
 *
 * Adding a game here also needs: the id in the `guides_game_check` constraint,
 * a `<base>/[id]` guide page, and the game's guides in the sitemap.
 */
export const GUIDE_GAMES = [
  { id: 'dcdl', label: 'DC: Dark Legion', base: '/games/dc-dark-legion/guides' },
  { id: 'invokers', label: 'Invokers: Titan Legacy', base: '/games/invokers/guides' },
] as const

export type GuideGame = (typeof GUIDE_GAMES)[number]['id']

export const DEFAULT_GUIDE_GAME: GuideGame = 'dcdl'

export function toGuideGame(v: unknown): GuideGame {
  return GUIDE_GAMES.some((g) => g.id === v) ? (v as GuideGame) : DEFAULT_GUIDE_GAME
}

export const guidePath = (game: GuideGame, id: string) =>
  `${GUIDE_GAMES.find((g) => g.id === game)!.base}/${id}`
