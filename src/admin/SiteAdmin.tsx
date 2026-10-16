'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { SignInButton } from '@clerk/nextjs'
import { gold, hint } from '@/src/dcdl/components/admin/editor-ui'
import { GuidesTab, InfographicsTab, PatchTab } from '@/src/dcdl/components/admin/ContentEditor'
import GameDataPanel from '@/src/dcdl/components/admin/GameDataPanel'
import OfficialTiersTab from '@/src/dcdl/components/studio/OfficialTiersTab'
import ReviewQueueTab from '@/src/dcdl/components/studio/ReviewQueueTab'
import ApplicationsTab from '@/src/dcdl/components/studio/ApplicationsTab'
import UnitNotesPanel from './UnitNotesPanel'
import {
  BestTeamsForm,
  ChampionForm,
  CombatCycleForm,
  GfDungeonRecsForm,
  LegacyForm,
  SupremeCommanderForm,
} from './dcdl-forms'

/**
 * The Site Admin: one panel for all four games plus site-wide jobs.
 *
 * Two kinds of tab, and the badge on each says which:
 *   - LOCAL tabs edit the repo's files (game data, takes, best teams, …). They only
 *     work under `next dev` on Tyler's PC; changes publish when committed and pushed.
 *   - LIVE tabs write to Supabase (tier lists, guides, patch notes, infographics,
 *     review). They work here and on the live site at /admin, need an admin sign-in,
 *     and show on the site within about a minute.
 * The URL hash (#game/tab) remembers where you are.
 */

type Access = { local: boolean; admin: boolean; signedIn: boolean; userId: string | null }
type Kind = 'local' | 'live'
type Tab = { id: string; label: string; kind: Kind; render: (setStatus: (s: string) => void) => React.ReactNode }
type Section = { id: string; label: string; tabs: Tab[] }

function LegacyOptionsChampionForm() {
  const [legacyOptions, setLegacyOptions] = useState<{ id: string; name: string; image?: string }[]>([])
  const load = useCallback(() => {
    fetch('/api/admin/dcdl/legacy')
      .then((r) => r.json())
      .then((d: { id: string; name: string }[]) => setLegacyOptions([...d].sort((a, b) => a.name.localeCompare(b.name))))
  }, [])
  useEffect(() => { load() }, [load])
  return <ChampionForm legacyOptions={legacyOptions} onRefreshHeroes={load} />
}

const SECTIONS: Section[] = [
  {
    id: 'dcdl',
    label: 'DC: Dark Legion',
    tabs: [
      { id: 'champions', label: 'Champions', kind: 'local', render: () => <LegacyOptionsChampionForm /> },
      { id: 'legacy', label: 'Legacy Pieces', kind: 'local', render: () => <LegacyForm /> },
      { id: 'tiers', label: 'Tier Lists', kind: 'live', render: (s) => <OfficialTiersTab setStatus={s} types={['champion', 'legacy']} /> },
      { id: 'info', label: 'Game Info', kind: 'live', render: (s) => <PatchTab setStatus={s} game="dcdl" /> },
      { id: 'guides', label: 'Guides', kind: 'live', render: (s) => <GuidesTab setStatus={s} game="dcdl" /> },
      { id: 'best-teams', label: 'Best Teams', kind: 'local', render: () => <BestTeamsForm /> },
      { id: 'supreme-commander', label: 'Supreme Commander', kind: 'local', render: () => <SupremeCommanderForm /> },
      { id: 'infographics', label: 'Infographics', kind: 'live', render: (s) => <InfographicsTab setStatus={s} /> },
      { id: 'combat-cycle', label: 'Combat Cycle', kind: 'local', render: () => <CombatCycleForm /> },
    ],
  },
  {
    id: 'godforge',
    label: 'Godforge',
    tabs: [
      { id: 'heroes', label: 'Heroes', kind: 'local', render: () => <UnitNotesPanel game="godforge" noun="Heroes" /> },
      { id: 'tiers', label: 'Tier Lists', kind: 'live', render: (s) => <OfficialTiersTab setStatus={s} types={['gf_hero']} /> },
      { id: 'info', label: 'Game Info', kind: 'live', render: (s) => <PatchTab setStatus={s} game="godforge" /> },
      { id: 'guides', label: 'Guides', kind: 'live', render: (s) => <GuidesTab setStatus={s} game="godforge" /> },
      { id: 'dungeons', label: 'Dungeon Recs', kind: 'local', render: () => <GfDungeonRecsForm /> },
    ],
  },
  {
    id: 'invokers',
    label: 'Invokers',
    tabs: [
      { id: 'units', label: 'Invokers & Titans', kind: 'local', render: () => <UnitNotesPanel game="invokers" noun="Units" /> },
      { id: 'tiers', label: 'Tier Lists', kind: 'live', render: (s) => <OfficialTiersTab setStatus={s} types={['inv_invoker', 'inv_titan']} /> },
      { id: 'info', label: 'Game Info', kind: 'live', render: (s) => <PatchTab setStatus={s} game="invokers" /> },
      { id: 'guides', label: 'Guides', kind: 'live', render: (s) => <GuidesTab setStatus={s} game="invokers" /> },
    ],
  },
  {
    id: 'voidhunters',
    label: 'Void Hunters',
    tabs: [
      { id: 'hunters', label: 'Hunters', kind: 'local', render: () => <UnitNotesPanel game="voidhunters" noun="Hunters" /> },
      { id: 'tiers', label: 'Tier Lists', kind: 'live', render: (s) => <OfficialTiersTab setStatus={s} types={['vh_hunter']} /> },
      { id: 'info', label: 'Game Info', kind: 'live', render: (s) => <PatchTab setStatus={s} game="voidhunters" /> },
      { id: 'guides', label: 'Guides', kind: 'live', render: (s) => <GuidesTab setStatus={s} game="voidhunters" /> },
    ],
  },
  {
    id: 'site',
    label: 'Site',
    tabs: [
      { id: 'game-data', label: 'Game Data', kind: 'local', render: () => <GameDataPanel /> },
      { id: 'review', label: 'Review Queue', kind: 'live', render: (s) => <ReviewQueueTab setStatus={s} /> },
      { id: 'applications', label: 'Applications', kind: 'live', render: (s) => <ApplicationsTab setStatus={s} /> },
    ],
  },
]

function readHash(): { section: string; tab: string } {
  const [section = '', tab = ''] = (typeof window === 'undefined' ? '' : window.location.hash.slice(1)).split('/')
  return { section, tab }
}

const badge = (kind: Kind): React.CSSProperties => ({
  marginLeft: '0.4rem', fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.08em', padding: '0.1rem 0.3rem',
  borderRadius: '0.25rem', verticalAlign: 'middle',
  color: kind === 'live' ? '#4ade80' : '#93c5fd',
  border: `1px solid ${kind === 'live' ? 'rgba(74,222,128,0.4)' : 'rgba(147,197,253,0.4)'}`,
})

function Blocked({ kind, access }: { kind: Kind; access: Access }) {
  if (kind === 'local') {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>This tab edits files</h3>
        <p style={{ color: '#aaa', margin: 0, lineHeight: 1.6 }}>
          It writes the site&apos;s data files, so it only works in the Site Admin on your PC
          (<code>npm run dev</code> → <code>localhost:3000/admin</code>). Changes go live when you commit and push.
        </p>
      </div>
    )
  }
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Needs an admin sign-in</h3>
      {!access.signedIn ? (
        <p style={{ color: '#aaa', lineHeight: 1.6 }}>
          This tab saves to the live database. <SignInButton mode="modal"><button className="btn">Sign in</button></SignInButton>
        </p>
      ) : (
        <p style={{ color: '#aaa', margin: 0, lineHeight: 1.6 }}>
          This tab saves to the live database, and this account isn&apos;t an admin here.
          {access.local && (
            <>
              {' '}Local dev signs in through Clerk&apos;s development instance, where your admin role doesn&apos;t exist.
              Add this line to <code>.env.local</code> and restart <code>npm run dev</code>:
              <code style={{ display: 'block', marginTop: '0.6rem', padding: '0.5rem 0.7rem', background: '#000', borderRadius: '0.35rem', color: gold, userSelect: 'all' }}>
                ADMIN_USER_IDS={access.userId}
              </code>
              <span style={{ ...hint, display: 'block' }}>Or use these tabs on the live site at quantumgameguides.com/admin.</span>
            </>
          )}
        </p>
      )}
    </div>
  )
}

export default function SiteAdmin() {
  const [access, setAccess] = useState<Access | null>(null)
  const [sectionId, setSectionId] = useState('dcdl')
  const [tabId, setTabId] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetch('/api/admin/whoami').then((r) => r.json()).then(setAccess).catch(() => setAccess({ local: false, admin: false, signedIn: false, userId: null }))
    const apply = () => {
      const h = readHash()
      if (SECTIONS.some((s) => s.id === h.section)) { setSectionId(h.section); setTabId(h.tab) }
    }
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [])

  const section = SECTIONS.find((s) => s.id === sectionId) ?? SECTIONS[0]
  const usable = (t: Tab) => !!access && (t.kind === 'local' ? access.local : access.admin)
  // Default to the first tab that works here (on the live site that skips the file-editing ones).
  const tab = section.tabs.find((t) => t.id === tabId) ?? section.tabs.find(usable) ?? section.tabs[0]

  function go(next: string, nextTab = '') {
    setSectionId(next)
    setTabId(nextTab)
    setStatus('')
    history.replaceState(null, '', `#${next}${nextTab ? `/${nextTab}` : ''}`)
  }

  if (!access) return <p style={{ color: '#888' }}>Loading…</p>

  if (!access.local && !access.admin) {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Admins only</h3>
        <p style={{ color: '#aaa', lineHeight: 1.6 }}>
          {access.signedIn ? 'This account isn’t an admin. ' : ''}Creators and editors work in the{' '}
          <Link href="/studio" style={{ color: gold }}>Creator Studio</Link>.
        </p>
        {!access.signedIn && <SignInButton mode="modal"><button className="btn">Sign in</button></SignInButton>}
      </div>
    )
  }

  const gameBtn = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--gold)' : 'var(--purple)', color: active ? '#111' : '#fff',
    border: 'none', borderRadius: '0.375rem', cursor: 'pointer', padding: '0.5rem 1.2rem',
    fontFamily: 'Unbounded, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em',
  })
  const subBtn = (active: boolean): React.CSSProperties => ({
    background: 'none', border: 'none', cursor: 'pointer', padding: '0.6rem 0.9rem', whiteSpace: 'nowrap',
    fontSize: '0.88rem', fontWeight: active ? 700 : 400, color: active ? 'var(--gold)' : '#888',
    borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent', marginBottom: '-2px',
    fontFamily: active ? 'Unbounded, sans-serif' : 'inherit',
  })

  return (
    <div>
      <p style={{ ...hint, fontSize: '0.8rem', marginTop: 0, marginBottom: '1.25rem', lineHeight: 1.6 }}>
        <span style={badge('live')}>LIVE</span> tabs save to the database and show on the site within a minute, from here or
        from quantumgameguides.com/admin. <span style={badge('local')}>LOCAL</span> tabs edit the repo&apos;s files on this PC and
        publish when you commit and push.
        {access.local ? ' You are on the local Site Admin.' : ' You are on the live site, so LOCAL tabs are unavailable here.'}
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {SECTIONS.map((s) => (
          <button key={s.id} type="button" style={gameBtn(s.id === section.id)} onClick={() => go(s.id)}>{s.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.1rem', marginBottom: '1.75rem', borderBottom: '2px solid #333', overflowX: 'auto' }}>
        {section.tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => go(section.id, t.id)}
            style={{ ...subBtn(t.id === tab.id), opacity: usable(t) ? 1 : 0.45 }}
          >
            {t.label}<span style={badge(t.kind)}>{t.kind === 'live' ? 'LIVE' : 'LOCAL'}</span>
          </button>
        ))}
      </div>

      {status && <p style={{ fontSize: '0.85rem', color: gold, marginBottom: '1rem' }}>{status}</p>}

      {usable(tab) ? (
        <div key={`${section.id}/${tab.id}`}>{tab.render(setStatus)}</div>
      ) : (
        <Blocked kind={tab.kind} access={access} />
      )}
    </div>
  )
}
