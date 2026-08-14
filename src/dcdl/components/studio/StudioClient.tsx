'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CAN, ROLE_LABEL } from '@/src/lib/roles'
import { useViewerRole } from '@/src/lib/useViewerRole'
import { btnQuiet, gold } from '@/src/dcdl/components/admin/editor-ui'
import { GuidesTab, InfographicsTab } from '@/src/dcdl/components/admin/ContentEditor'
import TierListsTab from './TierListsTab'
import OfficialTiersTab from './OfficialTiersTab'
import ApplicationsTab from './ApplicationsTab'
import ReviewQueueTab from './ReviewQueueTab'

/**
 * Creator Studio — one page whose tabs are decided by the signed-in user's role.
 *
 *   creator → My Tier Lists
 *   editor  → + Guides, Infographics (submitted for review)
 *   admin   → + Official Tiers, Applications, Review Queue
 *
 * This gate only picks the UI. Every route behind these tabs re-resolves the
 * role from Clerk server-side, so a member who forces their way here can read
 * and write nothing.
 */

type TabDef = { key: string; label: string; render: (setStatus: (s: string) => void) => React.ReactNode }

export default function StudioClient() {
  const { isLoaded, isSignedIn, role, creatorName } = useViewerRole()
  const [active, setActive] = useState<string>('')
  const [status, setStatus] = useState('')

  const tabs = useMemo<TabDef[]>(() => {
    const t: TabDef[] = []
    if (CAN.tierLists(role)) t.push({ key: 'tiers', label: 'My Tier Lists', render: (s) => <TierListsTab setStatus={s} /> })
    if (CAN.officialTiers(role)) t.push({ key: 'official', label: 'Official Tier Lists', render: (s) => <OfficialTiersTab setStatus={s} /> })
    if (CAN.guides(role)) t.push({ key: 'guides', label: 'Guides', render: (s) => <GuidesTab setStatus={s} /> })
    if (CAN.infographics(role)) t.push({ key: 'infographics', label: 'Infographics', render: (s) => <InfographicsTab setStatus={s} /> })
    if (CAN.moderate(role)) {
      t.push({ key: 'review', label: 'Review Queue', render: (s) => <ReviewQueueTab setStatus={s} /> })
      t.push({ key: 'applications', label: 'Applications', render: (s) => <ApplicationsTab setStatus={s} /> })
    }
    return t
  }, [role])

  if (!isLoaded) return <p style={{ color: '#888' }}>Loading…</p>

  if (!isSignedIn) {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Please sign in</h3>
        <p style={{ color: '#aaa', margin: '0 0 1rem' }}>The Creator Studio is for approved creators and editors.</p>
        <Link href="/sign-in?redirect_url=/studio" className="btn">Sign in</Link>
      </div>
    )
  }

  if (tabs.length === 0) {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>You don&rsquo;t have studio access yet</h3>
        <p style={{ color: '#aaa', margin: '0 0 1rem', lineHeight: 1.6 }}>
          The Creator Studio is for approved creators and editors. You can apply from the members page — approved
          creators publish their own tier lists on the site, credited by name.
        </p>
        <Link href="/members" className="btn">Apply on the members page</Link>
      </div>
    )
  }

  const current = tabs.find((t) => t.key === active) ?? tabs[0]

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap',
        marginBottom: '1.35rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <span style={{
          fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase',
          color: '#0a0a14', background: gold, padding: '0.22rem 0.55rem', borderRadius: '999px',
        }}>{ROLE_LABEL[role]}</span>
        {creatorName && <span style={{ color: '#aaa', fontSize: '0.85rem' }}>publishing as <strong style={{ color: '#fff' }}>{creatorName}</strong></span>}
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setActive(t.key); setStatus('') }}
            style={{
              ...btnQuiet,
              borderColor: current.key === t.key ? gold : 'rgba(255,255,255,0.2)',
              color: current.key === t.key ? gold : '#ccc',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {status && <p style={{ fontSize: '0.85rem', color: gold, marginBottom: '1rem' }}>{status}</p>}

      {current.render(setStatus)}
    </div>
  )
}
