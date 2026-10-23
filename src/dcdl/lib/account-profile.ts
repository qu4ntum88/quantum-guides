'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useUser } from '@clerk/nextjs'
import { emptyProfile, isEmptyProfile, normalizeProfile, type AccountProfile } from './account-bonuses'

/**
 * The visitor's DCDL Account Profile (roster, research, gear, hangar, VIP, room skins), shared
 * by the Account Profile page and every champion's Stat Calculator. Always kept in localStorage
 * (guarded: blocked storage just means nothing is remembered). For a signed-in member it is also
 * kept on the site (/api/dcdl/account → Supabase dcdl_account_profiles), together with the base
 * skins from owned-skins.ts, so it follows them to any device: the newer copy wins on load and
 * every later change is saved a moment after it's made.
 */

const KEY = 'qgg:dcdl-account-v1'
const EVENT = 'qgg:account-profile'
const SKINS_KEY = 'qgg:dcdl-owned-skins'
const EQUIPPED_KEY = 'qgg:dcdl-equipped-skin'
const SKINS_EVENT = 'qgg:owned-skins'

function get(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}
function set(key: string, value: string | null) {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {}
}
const read = () => get(KEY, '')
function subscribe(cb: () => void) {
  window.addEventListener('storage', cb)
  window.addEventListener(EVENT, cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener(EVENT, cb)
  }
}
const parse = (raw: string) => {
  try {
    return normalizeProfile(raw ? JSON.parse(raw) : null)
  } catch {
    return emptyProfile()
  }
}
function write(p: AccountProfile, stamp = true) {
  set(KEY, JSON.stringify(stamp ? { ...p, updatedAt: Date.now() } : p))
  window.dispatchEvent(new Event(EVENT))
}

/** The profile (empty on the server and before hydration) and an updater. */
export function useAccountProfile() {
  const raw = useSyncExternalStore(subscribe, read, () => '')
  const profile = useMemo(() => parse(raw), [raw])
  // Reads storage at call time, so quick successive edits never drop one.
  const update = useCallback((fn: (p: AccountProfile) => AccountProfile) => write(normalizeProfile(fn(parse(read())))), [])
  const replace = useCallback((p: AccountProfile) => write(normalizeProfile(p)), [])
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false)
  return { profile, update, replace, hydrated, empty: isEmptyProfile(profile) }
}

export type SyncState = 'local' | 'loading' | 'saving' | 'saved' | 'error'

type ServerRow = { profile: AccountProfile & { baseSkins?: { owned: string[]; equipped: string | null } }; updatedAt: number } | null

function skinsNow() {
  let owned: string[] = []
  try {
    const v = JSON.parse(get(SKINS_KEY, '[]'))
    owned = Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {}
  return { owned, equipped: get(EQUIPPED_KEY, '') || null }
}

/**
 * Keeps a signed-in member's profile in step with the site. Mount once per page (the Account
 * Profile page and the Stat Calculator do). Signed out it does nothing and reports 'local'.
 */
export function useAccountSync(): SyncState {
  const { isLoaded, isSignedIn } = useUser()
  const [state, setState] = useState<SyncState>('loading')
  const ready = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSent = useRef('')

  const push = useCallback(async () => {
    const p = parse(read())
    const body = JSON.stringify({ profile: { ...p, baseSkins: skinsNow() } })
    if (body === lastSent.current) return
    setState('saving')
    try {
      const res = await fetch('/api/dcdl/account', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body })
      if (!res.ok) throw new Error(String(res.status))
      lastSent.current = body
      setState('saved')
    } catch {
      setState('error')
    }
  }, [])

  // First load: pull the server copy, keep whichever is newer.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/dcdl/account', { cache: 'no-store' })
        if (!res.ok) throw new Error(String(res.status))
        const row = (await res.json()) as ServerRow
        if (cancelled) return
        const local = parse(read())
        if (row && row.updatedAt > local.updatedAt) {
          const { baseSkins, ...rest } = row.profile
          write(normalizeProfile({ ...rest, updatedAt: row.updatedAt }), false)
          if (baseSkins) {
            set(SKINS_KEY, JSON.stringify(baseSkins.owned ?? []))
            set(EQUIPPED_KEY, baseSkins.equipped || null)
            window.dispatchEvent(new Event(SKINS_EVENT))
          }
          lastSent.current = JSON.stringify({ profile: { ...parse(read()), baseSkins: skinsNow() } })
          setState('saved')
        } else if (!isEmptyProfile(local) && (!row || local.updatedAt > row.updatedAt)) {
          await push()
        } else setState('saved')
        ready.current = true
      } catch {
        if (!cancelled) setState('error')
      }
    })()
    return () => { cancelled = true }
  }, [isLoaded, isSignedIn, push])

  // Later changes (profile or base skins, this tab or another): save after a short pause.
  useEffect(() => {
    if (!isSignedIn) return
    const onChange = () => {
      if (!ready.current) return
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(push, 1200)
    }
    window.addEventListener(EVENT, onChange)
    window.addEventListener(SKINS_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(EVENT, onChange)
      window.removeEventListener(SKINS_EVENT, onChange)
      window.removeEventListener('storage', onChange)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [isSignedIn, push])

  return isLoaded && isSignedIn ? state : 'local'
}
