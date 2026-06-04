// One-shot script: copies rarity/affinity/allegiance/archetype/faction from
// heroes-api.json into heroes.json, matching by hero name.
//
// Usage: node scripts/merge-gf-attrs.mjs

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const apiPath   = resolve(ROOT, 'src/gf/data/heroes-api.json')
const adminPath = resolve(ROOT, 'src/gf/data/heroes.json')

const apiData   = JSON.parse(readFileSync(apiPath,   'utf8'))
const adminData = JSON.parse(readFileSync(adminPath, 'utf8'))

const apiHeroes = apiData.heroes.filter(h => !h._error)

// Build case-insensitive name → API hero map
const byName = new Map(apiHeroes.map(h => [h.name.toLowerCase(), h]))

// Known name mismatches: admin lowercase name → API lowercase name
const fixes = {
  'lubu':           'lu bu',
  'the fisher king':'fisher king',
  'yddraiggoch':    'y ddraig goch',
  'osirus':         'osiris',
}

// Normalise fields that differ in format between the two files
const normArchetype = a => a ?? null
const normFaction   = f => (f ? f.toUpperCase() : null)

let matched = 0, skipped = 0

const updated = adminData.map(hero => {
  const key  = fixes[hero.name.toLowerCase()] ?? hero.name.toLowerCase()
  const api  = byName.get(key)
  if (!api) {
    skipped++
    console.log(`  UNMATCHED: "${hero.name}"`)
    return hero
  }
  matched++
  return {
    ...hero,
    rarity:     api.rarity     ?? hero.rarity,
    affinity:   api.affinity   ?? hero.affinity,
    allegiance: api.allegiance ?? hero.allegiance,
    archetype:  normArchetype(api.archetype ?? null) ?? hero.archetype,
    faction:    normFaction(api.faction ?? null) ?? hero.faction,
  }
})

writeFileSync(adminPath, JSON.stringify(updated, null, 2))
console.log(`\nDone. Matched ${matched}/${adminData.length} heroes; ${skipped} unmatched.`)
