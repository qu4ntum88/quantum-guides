'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'

/**
 * Which DCDL base skins the visitor says they own, and which one their base has equipped: a
 * per-browser convenience shared by the Base Skins page (owned-bonus totals) and every
 * champion's Stat Calculator, so a pick in one place carries over to the other. Stored in
 * localStorage (owned = JSON array of skin ids, equipped = one id); every read and write is
 * guarded, so a blocked or private-mode storage just means nothing is remembered.
 *
 * Equipping implies owning: equipping a skin also marks it owned, and un-owning the equipped
 * skin unequips it.
 */

const KEY = 'qgg:dcdl-owned-skins'
const EQUIPPED_KEY = 'qgg:dcdl-equipped-skin'
const EVENT = 'qgg:owned-skins'

function get(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}
const read = () => get(KEY, '[]')
const readEquipped = () => get(EQUIPPED_KEY, '')

function subscribe(cb: () => void) {
  // `storage` covers other tabs; the custom event covers this one.
  window.addEventListener('storage', cb)
  window.addEventListener(EVENT, cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener(EVENT, cb)
  }
}

function parse(raw: string): Set<string> {
  try {
    const v = JSON.parse(raw)
    return new Set<string>(Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

function write(ids: string[], equipped = readEquipped()) {
  const owned = [...new Set(ids)].sort()
  try {
    localStorage.setItem(KEY, JSON.stringify(owned))
    if (equipped && owned.includes(equipped)) localStorage.setItem(EQUIPPED_KEY, equipped)
    else localStorage.removeItem(EQUIPPED_KEY)
  } catch {}
  window.dispatchEvent(new Event(EVENT))
}

/** Owned skin ids and the equipped one (empty on the server and before hydration), plus setters. */
export function useOwnedSkins() {
  const raw = useSyncExternalStore(subscribe, read, () => '[]')
  const rawEquipped = useSyncExternalStore(subscribe, readEquipped, () => '')
  const owned = useMemo(() => parse(raw), [raw])
  const equipped = rawEquipped && owned.has(rawEquipped) ? rawEquipped : null
  // Setters read storage at call time, not the last render's state, so quick taps never drop one.
  const toggle = useCallback((id: string) => {
    const now = parse(read())
    write(now.has(id) ? [...now].filter((x) => x !== id) : [...now, id])
  }, [])
  const setAll = useCallback((ids: string[]) => write(ids), [])
  const equip = useCallback((id: string | null) => {
    write(id ? [...parse(read()), id] : [...parse(read())], id ?? '')
  }, [])
  return { owned, equipped, toggle, setAll, equip }
}
