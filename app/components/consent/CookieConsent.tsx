'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import {
  ALLOW_ALL,
  CATEGORY_META,
  CONSENT_CHANGE_EVENT,
  DENY_OPTIONAL,
  OPEN_PREFERENCES_EVENT,
  OptionalCategory,
  currentCategories,
  hasStoredConsent,
  pushConsentToDataLayer,
  writeConsent,
} from '@/src/lib/consent'

type OptionalState = Record<OptionalCategory, boolean>

function toOptional(all: { analytics: boolean; advertising: boolean; errorTracking: boolean }): OptionalState {
  return { analytics: all.analytics, advertising: all.advertising, errorTracking: all.errorTracking }
}

const gold = 'var(--gold)'

// Client-only flag via the sanctioned external-store API — false during SSR,
// true after hydration — so we can read localStorage without a mount effect
// that calls setState synchronously.
const noop = () => () => {}
function useIsClient(): boolean {
  return useSyncExternalStore(noop, () => true, () => false)
}

export default function CookieConsent() {
  const isClient = useIsClient()
  const [showModal, setShowModal] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [draft, setDraft] = useState<OptionalState>(() => toOptional(DENY_OPTIONAL))

  const decided = isClient && hasStoredConsent()
  const showBanner = isClient && !decided && !bannerDismissed && !showModal

  // Re-apply a saved choice to the dataLayer for returning visitors. Pushing to
  // an external system (not setState) is exactly what effects are for.
  useEffect(() => {
    if (isClient && hasStoredConsent()) pushConsentToDataLayer(currentCategories())
  }, [isClient])

  // Open the preferences modal on request from the footer / cookie policy.
  useEffect(() => {
    const openHandler = () => {
      setDraft(toOptional(currentCategories()))
      setShowModal(true)
    }
    window.addEventListener(OPEN_PREFERENCES_EVENT, openHandler)
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, openHandler)
  }, [])

  // Keep the modal toggles in sync if consent changes in another tab.
  useEffect(() => {
    const sync = () => setDraft(toOptional(currentCategories()))
    window.addEventListener(CONSENT_CHANGE_EVENT, sync)
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, sync)
  }, [])

  const save = useCallback((categories: OptionalState) => {
    writeConsent(categories)
    setBannerDismissed(true)
    setShowModal(false)
  }, [])

  const acceptAll = useCallback(() => save(toOptional(ALLOW_ALL)), [save])
  const rejectOptional = useCallback(() => save(toOptional(DENY_OPTIONAL)), [save])

  useEffect(() => {
    if (!showModal) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowModal(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showModal])

  return (
    <>
      {showBanner && !showModal && (
        <ConsentBanner onManage={() => setShowModal(true)} onReject={rejectOptional} onAccept={acceptAll} />
      )}
      {showModal && (
        <PreferencesModal draft={draft} setDraft={setDraft} onCancel={() => setShowModal(false)} onSave={() => save(draft)} />
      )}
    </>
  )
}

const barBtn: React.CSSProperties = {
  padding: '0.5rem 1rem', borderRadius: '0.4rem', fontSize: '0.8rem', cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.25)', background: 'transparent', color: '#ddd',
  fontFamily: 'inherit',
}
const barBtnPrimary: React.CSSProperties = {
  ...barBtn, background: gold, color: '#0a0a14', borderColor: gold, fontWeight: 700,
}

function ConsentBanner({
  onManage, onReject, onAccept,
}: { onManage: () => void; onReject: () => void; onAccept: () => void }) {
  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      style={{
        position: 'fixed', insetInline: 0, bottom: 0, zIndex: 1000,
        background: 'rgba(8,8,16,0.97)', borderTop: `1px solid rgba(204,164,83,0.35)`,
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        className="container"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1rem' }}
      >
        <p style={{ margin: 0, maxWidth: '640px', fontSize: '0.85rem', color: '#c9c9c9', lineHeight: 1.6 }}>
          We use essential cookies to keep the site working and to remember this choice. With your OK
          we&rsquo;ll also enable <strong style={{ color: '#fff' }}>analytics</strong>,{' '}
          <strong style={{ color: '#fff' }}>advertising</strong>, and{' '}
          <strong style={{ color: '#fff' }}>error-tracking</strong> cookies. Nothing optional loads until you accept.{' '}
          <Link href="/cookies" style={{ color: gold, textDecoration: 'underline' }}>Cookie Policy</Link>
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={onManage} style={barBtn}>Manage</button>
          <button type="button" onClick={onReject} style={barBtn}>Reject non-essential</button>
          <button type="button" onClick={onAccept} style={barBtnPrimary}>Accept all</button>
        </div>
      </div>
    </div>
  )
}

function PreferencesModal({
  draft, setDraft, onCancel, onSave,
}: {
  draft: OptionalState
  setDraft: React.Dispatch<React.SetStateAction<OptionalState>>
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} role="dialog" aria-modal="true" aria-labelledby="cookie-prefs-title">
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onCancel} aria-hidden="true" />
      <div style={{ position: 'relative', width: '100%', maxWidth: '520px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '0.6rem', border: `1px solid rgba(204,164,83,0.35)`, background: '#0d0d18' }}>
        <div style={{ padding: '1.4rem 1.5rem 0.9rem' }}>
          <h2 id="cookie-prefs-title" style={{ margin: 0, fontSize: '1.4rem' }}>Cookie preferences</h2>
          <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.85rem', color: '#aaa', lineHeight: 1.6 }}>
            Choose which cookie categories Quantum Game Guides may set. Essential cookies are always on.
          </p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {CATEGORY_META.map((cat) => {
            const locked = cat.key === 'essential'
            const checked = locked ? true : draft[cat.key as OptionalCategory]
            return (
              <div key={cat.key} style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.9rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: '#fff' }}>{cat.label}</p>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: '#aaa', lineHeight: 1.55 }}>{cat.blurb}</p>
                  </div>
                  <Toggle checked={checked} disabled={locked} label={`${cat.label} cookies`} onChange={(v) => setDraft((prev) => ({ ...prev, [cat.key as OptionalCategory]: v }))} />
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 1.5rem 1.4rem' }}>
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#777', lineHeight: 1.5 }}>Changes apply on the next page load.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
            <button type="button" onClick={onCancel} style={barBtn}>Cancel</button>
            <button type="button" onClick={onSave} style={barBtnPrimary}>Save preferences</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Toggle({
  checked, disabled, label, onChange,
}: { checked: boolean; disabled?: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', marginTop: '0.15rem', height: '1.5rem', width: '2.75rem', flexShrink: 0,
        borderRadius: '999px', border: '1px solid', transition: 'background 0.15s',
        borderColor: checked ? gold : 'rgba(255,255,255,0.25)',
        background: checked ? gold : 'rgba(255,255,255,0.1)',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{ position: 'absolute', top: '0.15rem', left: checked ? '1.35rem' : '0.15rem', height: '1rem', width: '1rem', borderRadius: '999px', background: checked ? '#0a0a14' : '#fff', transition: 'left 0.15s' }} />
    </button>
  )
}
