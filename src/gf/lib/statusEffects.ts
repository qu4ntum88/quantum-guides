import rawEffects from '../data/status-effects.json'

export type StatusEffect = {
  id: string
  name: string
  category: 'buff' | 'debuff' | 'disable'
  image: string
  description: string
}

export const STATUS_EFFECTS: StatusEffect[] = rawEffects as StatusEffect[]

export const EFFECT_COLOR: Record<string, string> = {
  buff:    '#60a5fa',
  debuff:  '#f87171',
  disable: '#f472b6',
}

// Name → effect (lowercase keys)
const byName = new Map<string, StatusEffect>()
for (const e of STATUS_EFFECTS) {
  byName.set(e.name.toLowerCase(), e)
}

// Bracket text that should never resolve to an effect
const SKIP = new Set([
  'buff', 'buffs', 'debuff', 'debuffs', 'disable', 'disables',
  'extra hit', 'extra turn', 'extra turn', 'lock', 'mirror',
  'revive', 'spd', 'fth',
])

// Aliases: normalised bracket text → normalised effect name
// Handles: untiered variants (→ tier I), typos, plurals
const ALIASES: Record<string, string> = {
  // Typos / plurals
  'pheonix':      'phoenix',
  'block debuff': 'block debuffs',
  'retaliates':   'retaliate',
  'intercepts':   'intercept',
  'shields':      'shield',
  // Untiered stat changes → tier I
  'acc down':  'acc down i',
  'acc up':    'acc up i',
  'atk down':  'atk down i',
  'atk up':    'atk up i',
  'def down':  'def down i',
  'def up':    'def up i',
  'fth down':  'fth down i',
  'fth up':    'fth up i',
  'res down':  'res down i',
  'res up':    'res up i',
  'spd down':  'spd down i',
  'spd up':    'spd up i',
  // Untiered named effects → tier I
  'aetherburn':  'aetherburn i',
  'blaze':       'blaze i',
  'blunt':       'blunt i',
  'curse':       'curse i',
  'drain':       'drain i',
  'hex':         'hex i',
  'protect':     'protect i',
  'radiance':    'radiance i',
  'sharpen':     'sharpen i',
  'vulnerable':  'vulnerable i',
}

export function lookupEffect(rawName: string): StatusEffect | null {
  const norm = rawName.trim().toLowerCase()
  if (SKIP.has(norm) || /^\d+$/.test(norm)) return null
  const key = ALIASES[norm] ?? norm
  return byName.get(key) ?? null
}

export const INSTANT_EFFECTS: string[] = [
  'Activate Effect',
  'Barrier',
  'Decrease Ability Cooldown',
  'Decrease Buff Duration',
  'Decrease Debuff Duration',
  'Decrease Disable Duration',
  'Decrease Divinity',
  'Decrease Turn Meter',
  'Heal',
  'Increase Ability Cooldown',
  'Increase Buff Duration',
  'Increase Debuff Duration',
  'Increase Disable Duration',
  'Increase Turn Meter',
  'Join Attack',
  'Mirror',
  'Remove Buff',
  'Remove Debuff',
  'Remove Disable',
  'Revive',
  'Steal Divinity',
  'Steal Turn Meter',
]

export function extractEffectIds(text: string): Set<string> {
  const ids = new Set<string>()
  const matches = text.match(/\[([^\]]+)\]/g) ?? []
  for (const m of matches) {
    const inner = m.slice(1, -1)
    const effect = lookupEffect(inner)
    if (effect) ids.add(effect.id)
  }
  return ids
}
