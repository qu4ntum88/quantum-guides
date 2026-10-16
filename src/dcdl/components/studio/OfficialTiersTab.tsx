'use client'

import { useEffect, useState } from 'react'
import TierListEditor, { TIERS, type EditorItem, type TierAssignment } from '@/src/dcdl/components/tier/TierListEditor'
import ExportTierListButton from '@/src/dcdl/components/tier/ExportTierListButton'
import { btn, btnDanger, btnQuiet, gold, hint } from '@/src/dcdl/components/admin/editor-ui'

/**
 * The official Quantum tier lists, edited from the live site.
 *
 * This is the same board the local admin panel has always had, but saving
 * writes to Supabase instead of heros.json, so it works from any device. The
 * JSON files stay in place as the fallback — run `node scripts/pull-tiers.mjs`
 * before committing to fold live tiers back into them.
 */

type EntityType = 'champion' | 'legacy' | 'gf_hero' | 'vh_hunter'

const TYPES: { id: EntityType; label: string; title: string; unranked: string }[] = [
  { id: 'champion', label: 'DCDL Champions', title: "Quantum's Champion Tier List", unranked: 'Unranked champions' },
  { id: 'legacy', label: 'DCDL Legacy Pieces', title: "Quantum's Legacy Piece Tier List", unranked: 'Unranked legacy pieces' },
  { id: 'gf_hero', label: 'Godforge Heroes', title: "Quantum's Godforge Tier List", unranked: 'Unranked heroes' },
  { id: 'vh_hunter', label: 'Void Hunters', title: "Quantum's Void Hunters Tier List", unranked: 'Unranked hunters' },
]
type CatalogItem = EditorItem & { tier: string }

export default function OfficialTiersTab({ setStatus }: { setStatus: (s: string) => void }) {
  const [type, setType] = useState<EntityType>('champion')
  const [items, setItems] = useState<CatalogItem[]>([])
  const [tiers, setTiers] = useState<readonly string[]>(TIERS)
  const [assign, setAssign] = useState<TierAssignment>({})
  const [saved, setSaved] = useState<TierAssignment>({})
  const [savedOrder, setSavedOrder] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Loads the board for the selected type. Switching type flips `loading` in
  // the click handler, so nothing sets state synchronously inside the effect.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await fetch(`/api/admin/tiers?type=${type}`)
      const body: { items: CatalogItem[]; tiers: string[] } = res.ok ? await res.json() : { items: [], tiers: [...TIERS] }
      const catalog = body.items
      if (cancelled) return
      setItems(catalog)
      setTiers(body.tiers)
      const a = Object.fromEntries(catalog.map((c) => [c.id, c.tier ?? '']))
      setAssign(a)
      setSaved(a)
      setSavedOrder(catalog.map((c) => c.id))
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [type])

  const orderChanged = items.length > 0 && items.map((i) => i.id).join('|') !== savedOrder.join('|')
  const dirty = orderChanged || items.some((i) => (assign[i.id] ?? '') !== (saved[i.id] ?? ''))
  const rankedCount = items.filter((i) => assign[i.id]).length
  const meta = TYPES.find((t) => t.id === type)!

  async function save() {
    setSaving(true); setStatus('')
    const res = await fetch('/api/admin/tiers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType: type,
        assignments: items.map((i) => ({ id: i.id, tier: assign[i.id] ?? '' })),
      }),
    })
    const json = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { setStatus(json.error ?? 'Save failed.'); return }
    setSaved({ ...assign })
    setSavedOrder(items.map((i) => i.id))
    setStatus('Saved. The live tier list updates within about a minute.')
  }

  async function clearArrows() {
    if (!confirm('Clear the tier-movement arrows for every item in this list?')) return
    const res = await fetch(`/api/admin/tiers?type=${type}`, { method: 'DELETE' })
    setStatus(res.ok ? 'Movement arrows cleared.' : 'Reset failed.')
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {TYPES.map(({ id: t, label }) => (
          <button key={t} style={{ ...btnQuiet, borderColor: type === t ? gold : 'rgba(255,255,255,0.2)', color: type === t ? gold : '#ccc' }}
            onClick={() => { if (t !== type) { setLoading(true); setType(t) } }}>
            {label}
          </button>
        ))}
      </div>

      <p style={{ ...hint, marginBottom: '1.25rem', lineHeight: 1.6 }}>
        This is the official list on the public tier list page. Saving here takes over from the JSON files; the commit
        hook (<code style={{ color: gold }}>scripts/pull-tiers.mjs</code>) folds these rankings back into the game&apos;s JSON.
        Godforge heroes and Void Hunters hunters you haven&apos;t placed yet start at their rarity tier.
      </p>

      {loading ? <p style={{ color: '#888' }}>Loading…</p> : (
        <TierListEditor
          items={items}
          assign={assign}
          onChange={setAssign}
          onReorder={(next) => setItems(next as CatalogItem[])}
          unrankedLabel={meta.unranked}
          tiers={tiers}
        />
      )}

      <div style={{
        display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center',
        position: 'sticky', bottom: 0, padding: '0.9rem 0', marginTop: '0.5rem',
        background: 'linear-gradient(to top, var(--bg, #0a0a14) 65%, transparent)',
      }}>
        <button style={btn} onClick={save} disabled={saving || !dirty}>
          {saving ? 'Saving…' : dirty ? 'Save Tier List' : 'Saved'}
        </button>
        <ExportTierListButton
          title={meta.title}
          // Previewing the board as it stands right now, saved or not.
          dateLine={`Updated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
          tiers={tiers}
          fit={type === 'legacy' || type === 'gf_hero' ? 'contain' : 'cover'}
          items={items.filter((i) => assign[i.id]).map((i) => ({ id: i.id, name: i.name, img: i.img, tier: assign[i.id] }))}
        />
        <button style={btnDanger} onClick={clearArrows}>Clear movement arrows</button>
        <span style={hint}>{rankedCount} ranked</span>
      </div>
    </div>
  )
}
