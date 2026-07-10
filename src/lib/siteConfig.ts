// Public visibility flags for the game sections.
//
// Set a flag to `true` to re-expose that section on the live site (nav links,
// homepage cards, and its public /games/* pages). Set to `false` to hide it:
// the pages return 404, the nav/homepage entries disappear, and it drops out of
// the sitemap / gets disallowed in robots.txt.
//
// NOTE: this only affects the PUBLIC site. The admin panel at /admin/dcdl reads
// and writes the underlying JSON data files directly and is unaffected — you can
// keep editing Godforge / Void Hunters offline while they're hidden.
export const PUBLIC_SECTIONS = {
  dcdl: true,
  godforge: false,
  voidHunters: false,
} as const

export type GameSection = keyof typeof PUBLIC_SECTIONS
