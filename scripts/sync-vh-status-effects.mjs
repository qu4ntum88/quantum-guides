// Fill src/vh/data/status-effects.json from the Void Hunters game-data export
// (E:\GameAssets\Exports\void-hunters\status-effects\status-effects.json, built by
// E:\GameAssets\Exports\_pipeline\void-hunters\update.mjs).
//
// For every effect already on the site: sets `name` to the game's display name (the site's
// names came from icon file names, e.g. "Holy Vow" is shown in game as "Vowkeeper") and
// `description` to the game's text. `id` and `image` are never touched, and nothing is added:
// effects the client has but the site doesn't are only counted. The one removal: a site entry
// that turns out to be the same game effect as another is dropped (see `kept` below).
//
// Also sets `hunters` (hunters.json ids, by name) to every hunter whose kit in hunters.json names
// the effect, shown as portraits on the card, and `unique: true` when it belongs to one hunter: an
// effect named for a hunter ("Owyn's Vow"), or one exactly one kit names, unless it is a common
// battle effect (COMMON below) that only one hunter on the site happens to use so far. The client
// can't say who uses what (skill text points at effects through server-filled placeholders), so
// the site's kit text is the source.
//
// The game fills numbers and linked names in from the server when a skill applies the effect,
// so the client text is a template. Numbers become X, Y, Z, W (in order of first use within
// one description); links become [effect], [tag], [skill type], [hunter], [skill], [effect type].
//
//   node scripts/sync-vh-status-effects.mjs          # dry run: what would change
//   node scripts/sync-vh-status-effects.mjs --write  # write the JSON
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const EXPORT = process.env.VH_EXPORT || 'E:\\GameAssets\\Exports\\void-hunters'
const WRITE = process.argv.includes('--write')
const SITE = path.join(ROOT, 'src', 'vh', 'data', 'status-effects.json')

const letters = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
// Site icon names that don't spell the game id.
const ICON_ALIASES = { resilient: 'RESILIENCE' }

// General effects any hunter can apply: never flagged as unique, however few hunters use them.
const COMMON = new Set([
  'Buff Immunity', 'Crit Damage Up', 'Crit Defense Up', 'Crit Immunity', 'Crit Rate Up', 'Crit Resistance Up',
  'Damage Immunity', 'Expose', 'Fortune', 'Health Recovery Down', 'Health Recovery Up', 'Health Up', 'Hunted',
  'Marked', 'Untargettable', 'Void Minion',
])

const NUMBER_LETTERS =['X', 'Y', 'Z', 'W', 'V', 'U']
const LINKS = { SE: '[effect]', ChTag: '[tag]', SkTag: '[skill type]', Char: '[hunter]', Skill: '[skill]', SETag: '[effect type]' }

function readable(template) {
  if (!template) return ''
  const numbers = new Map()
  return template
    .replace(/\$\(([A-Za-z]+?)(\d+)(?::[A-Za-z]+)?\)/g, (m, kind, n) => {
      if (kind === 'Stat' || kind === 'Val') {
        const key = kind + n
        if (!numbers.has(key)) numbers.set(key, NUMBER_LETTERS[numbers.size] ?? 'N')
        return numbers.get(key)
      }
      return LINKS[kind] ?? m
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const exportFile = path.join(EXPORT, 'status-effects', 'status-effects.json')
if (!fs.existsSync(exportFile)) throw new Error(`No export at ${exportFile}; run the Void Hunters extraction first`)
const game = JSON.parse(fs.readFileSync(exportFile, 'utf8'))
const site = JSON.parse(fs.readFileSync(SITE, 'utf8'))

// The export lists the current SE_ keys before the older META_SE_ ones, so first match wins
// (META_SE_HUNTER_SPREY "Hunter's Prey" would otherwise shadow SE_HUNTERSPREY "Hunted").
const byId = new Map()
const byName = new Map()
for (const g of game) {
  if (!byId.has(letters(g.id))) byId.set(letters(g.id), g)
  if (!byName.has(letters(g.name))) byName.set(letters(g.name), g)
}

// ---- who uses what: every string in each hunter's skills + star bonuses (not the bio)
const hunters = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'vh', 'data', 'hunters.json'), 'utf8'))
const strings = (v) => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [])
// "non-Control debuffs", "Control debuffs" are effect categories, not the effect of that name.
const kits = hunters.map((h) => ({ h, text: strings([h.skills, h.bonus_breakdown]).join('\n').replace(/\bnon-[A-Z][a-z]+/g, '') }))
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Every hunter whose kit names the effect (sorted by name), and whether it is one hunter's own. */
function effectHunters(name) {
  const re = new RegExp(`(?<![A-Za-z])${escapeRe(name)}(?![A-Za-z'])(?!\\s+(debuff|buff|effect)s?\\b)`, 'i')
  const users = kits.filter((k) => re.test(k.text)).map((k) => k.h)
  // A vow belongs to the hunter it's named for, whoever else mentions it. Hunter names can carry
  // a title the vow leaves out ("Hermeida's Vow" → "St. Hermeida").
  const vow = name.match(/^(.+?)'s? Vow$/)?.[1]
  const owner = vow ? hunters.find((h) => letters(h.name).endsWith(letters(vow))) : null
  if (owner && !users.includes(owner)) users.push(owner)
  users.sort((a, b) => a.name.localeCompare(b.name))
  return { users, unique: !!owner || (users.length === 1 && !COMMON.has(name)) }
}

const used = new Set()
const renamed = []
const described = []
const noText = []
const unique = []
const shared = []

// Match each site entry to a game effect: by its icon file first, else by name.
const matched = site.map((s) => {
  const iconKey = letters(path.basename(s.image || '').replace(/^SE_/i, '').replace(/-Icon.*$/i, ''))
  const byIcon = byId.get(letters(ICON_ALIASES[iconKey] || iconKey))
  return { s, g: byIcon || byName.get(letters(s.name)), byIcon: !!byIcon }
})
// One game effect, one card: the site once had a card per icon file, so the game's HOLYVOW
// ("Vowkeeper") had two (SE_HolyVow + SE_Vowkeeper). Keep the one whose icon matches the game id.
const removed = []
const kept = matched.filter((m, i) => {
  if (!m.g) return true
  const firstIcon = matched.findIndex((o) => o.g === m.g && o.byIcon)
  const first = firstIcon >= 0 ? firstIcon : matched.findIndex((o) => o.g === m.g)
  if (first === i) return true
  removed.push(`${m.s.id} (${path.basename(m.s.image)}), same as ${matched[first].s.id}`)
  return false
})

const next = kept.map(({ s, g }) => {
  const name = g?.name ?? s.name
  const { users, unique: isUnique } = effectHunters(name)
  const { hunter: _old, hunters: _oldList, unique: _oldUnique, ...rest } = s
  const withOwner = (e) => (users.length
    ? { ...e, hunters: users.map((h) => h.id), ...(isUnique ? { unique: true } : {}) }
    : e)
  if (isUnique) unique.push(`${name} → ${users.map((h) => h.name).join(', ')}`)
  else if (users.length) shared.push(users.length)
  if (!g || !g.description) { noText.push(s.name); return withOwner(rest) }
  used.add(g.id)
  const description = readable(g.description)
  if (g.name !== s.name) renamed.push(`${s.name} → ${g.name}`)
  if (description !== s.description) described.push(g.name)
  return withOwner({ ...rest, name, description })
})

const notOnSite = game.filter((g) => !used.has(g.id) && !site.some((s) => letters(s.name) === letters(g.name)))

console.log(`Site effects: ${next.length} · with game text: ${next.length - noText.length} · descriptions changed: ${described.length}`)
if (removed.length) console.log(`\nRemoved as duplicates of another card (${removed.length}):\n  ${removed.join('\n  ')}`)
if (renamed.length) console.log(`\nRenamed to the in-game name (${renamed.length}):\n  ${renamed.join('\n  ')}`)
console.log(`\nUnique to one hunter (${unique.length}):\n  ${unique.join('\n  ')}`)
console.log(`\nShared, with portraits (${shared.length}): up to ${Math.max(0, ...shared)} hunters on one effect`)
console.log(`No hunter on the site names it: ${next.length - unique.length - shared.length}`)
if (noText.length) console.log(`\nNo text in the game files, left as is (${noText.length}): ${noText.join(', ')}`)
console.log(`\nIn the client but not on the site (not added): ${notOnSite.length}`)
for (const name of described.slice(0, 5)) console.log(`\n${name}: ${next.find((e) => e.name === name).description.replace(/\n/g, ' / ')}`)

if (WRITE) {
  fs.writeFileSync(SITE, JSON.stringify(next, null, 2) + '\n')
  console.log(`\nWrote ${path.relative(ROOT, SITE)}`)
} else {
  console.log('\nDry run, nothing written. Re-run with --write to apply.')
}
