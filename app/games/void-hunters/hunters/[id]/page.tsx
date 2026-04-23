import { notFound } from 'next/navigation'
import type { Hunter, SkillEntry, BonusBreakdown } from '@/src/vh/components/HunterBox'

function readHunters(): Hunter[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/src/vh/data/hunters.json') as Hunter[]
}

export function generateStaticParams() {
  return readHunters().map((h) => ({ id: h.id }))
}

// ── Rarity colours ──────────────────────────────────────────────────────────
const RARITY_COLOR: Record<string, string> = {
  Legendary: '#f59e0b',
  Epic:      '#a855f7',
  Rare:      '#3b82f6',
}

const SKILL_TYPE_COLOR: Record<string, string> = {
  Basic:   '#6b7280',
  Special: '#7c3aed',
  Trait:   '#065f46',
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function Tag({ label, color = '#2a2a2a', textColor = '#aaa' }: { label: string; color?: string; textColor?: string }) {
  return (
    <span style={{
      display: 'inline-block',
      background: color,
      color: textColor,
      borderRadius: '0.35rem',
      padding: '0.15rem 0.55rem',
      fontSize: '0.7rem',
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      fontFamily: 'Unbounded, sans-serif',
    }}>
      {label}
    </span>
  )
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid #2a2a2a',
      borderRadius: '0.5rem',
      padding: '0.6rem 1rem',
      minWidth: '4.5rem',
      gap: '0.25rem',
    }}>
      <span style={{ fontSize: '0.65rem', color: '#666', fontFamily: 'Unbounded, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e8e8e8' }}>{value.toLocaleString()}</span>
    </div>
  )
}

function SectionCard({ title, children, accentColor = 'var(--gold)' }: { title: string; children: React.ReactNode; accentColor?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid #222',
      borderRadius: '0.75rem',
      overflow: 'hidden',
    }}>
      <div style={{
        borderBottom: `2px solid ${accentColor}33`,
        padding: '0.75rem 1.25rem',
        background: `linear-gradient(90deg, ${accentColor}18 0%, transparent 100%)`,
      }}>
        <h2 style={{ margin: 0, fontSize: '0.8rem', fontFamily: 'Unbounded, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', color: accentColor }}>
          {title}
        </h2>
      </div>
      <div style={{ padding: '1.25rem' }}>
        {children}
      </div>
    </div>
  )
}

function SkillCard({ skill }: { skill: SkillEntry }) {
  const typeColor = SKILL_TYPE_COLOR[skill.type] ?? '#2a2a2a'
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid #2a2a2a',
      borderRadius: '0.6rem',
      overflow: 'hidden',
    }}>
      {/* Skill header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: `${typeColor}22`,
        borderBottom: `1px solid ${typeColor}44`,
        flexWrap: 'wrap',
      }}>
        {skill.image && (
          <img
            src={skill.image}
            alt={skill.name}
            style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.35rem', objectFit: 'cover', flexShrink: 0 }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: '#e8e8e8', letterSpacing: '0.05em' }}>
            {skill.name}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Tag label={skill.type} color={typeColor} textColor="#fff" />
            {skill.cooldown !== null && (
              <Tag label={`CD: ${skill.cooldown}`} color="#1e293b" textColor="#94a3b8" />
            )}
            {skill.tags.map((t) => (
              <Tag key={t} label={t} color="#1a1a1a" textColor="#777" />
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{ padding: '0.85rem 1rem' }}>
        <p style={{ margin: 0, fontSize: '0.88rem', color: '#c8c8c8', lineHeight: 1.6 }}>
          {skill.description}
        </p>

        {skill.upgrades.length > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', fontFamily: 'Unbounded, sans-serif', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Upgrades
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {skill.upgrades.map((u, i) => (
                <li key={i} style={{ fontSize: '0.8rem', color: '#888', lineHeight: 1.5 }}>{u}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function AwakenTable({ rows, label }: { rows: { stars: number; bonuses: string[] }[]; label: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', fontFamily: 'Unbounded, sans-serif', color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {rows.map((row) => (
          <div key={row.stars} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ minWidth: '3.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', fontFamily: 'Unbounded, sans-serif' }}>
              {'★'.repeat(row.stars)}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#aaa', lineHeight: 1.5 }}>
              {row.bonuses.join(' · ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function HunterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const allHunters = readHunters().slice().sort((a, b) => a.name.localeCompare(b.name))
  const hunter = allHunters.find((h) => h.id === id)
  if (!hunter) return notFound()

  const idx = allHunters.indexOf(hunter)
  const prev = allHunters[(idx - 1 + allHunters.length) % allHunters.length]
  const next = allHunters[(idx + 1) % allHunters.length]

  const rarityColor = RARITY_COLOR[hunter.rarity] ?? '#888'
  const skills = hunter.skills ?? []
  const basicSkills  = skills.filter((s) => s.type === 'Basic')
  const specialSkills = skills.filter((s) => s.type === 'Special')
  const traits       = skills.filter((s) => s.type === 'Trait')
  const bd = hunter.bonus_breakdown as BonusBreakdown | null | undefined

  return (
    <main>
      {/* Full-art background */}
      {hunter.fullArt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          backgroundImage: `url('${hunter.fullArt}')`,
          backgroundSize: 'auto 100%',
          backgroundPosition: '115% top',
          backgroundRepeat: 'no-repeat',
          opacity: 0.18,
        }} />
      )}

      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingTop: '2rem', paddingBottom: '4rem' }}>

        {/* Prev / Next nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <a href={`/games/void-hunters/hunters/${prev.id}`} className="btn" style={{ padding: '0.5rem 1.25rem', background: 'var(--purple)', borderColor: 'var(--purple)', fontFamily: 'Unbounded, sans-serif', textTransform: 'uppercase', fontSize: '0.72rem' }}>
            ← {prev.name}
          </a>
          <a href="/games/void-hunters" style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>Back to Hunter List</a>
          <a href={`/games/void-hunters/hunters/${next.id}`} className="btn" style={{ padding: '0.5rem 1.25rem', background: 'var(--purple)', borderColor: 'var(--purple)', fontFamily: 'Unbounded, sans-serif', textTransform: 'uppercase', fontSize: '0.72rem' }}>
            {next.name} →
          </a>
        </div>

        {/* Hero header */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Portrait */}
          <div style={{
            flexShrink: 0,
            width: '10rem',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            border: `2px solid ${rarityColor}66`,
            background: '#111',
            boxShadow: `0 0 24px ${rarityColor}33`,
          }}>
            {hunter.portrait
              ? <img src={hunter.portrait} alt={hunter.name} style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
              : <div style={{ aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '3rem' }}>?</div>
            }
          </div>

          {/* Name / meta */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'Unbounded, sans-serif', color: rarityColor, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                {hunter.rarity}
              </div>
              <h1 style={{ margin: 0, fontFamily: 'Unbounded, sans-serif', fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', color: '#f0f0f0', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {hunter.name}
              </h1>
              {hunter.title && (
                <div style={{ fontSize: '0.95rem', color: rarityColor, fontStyle: 'italic', marginTop: '0.25rem' }}>
                  {hunter.title}
                </div>
              )}
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {hunter.class.map((c) => <Tag key={c} label={c} color="#3b0764" textColor="#c084fc" />)}
              {hunter.homeland.map((h) => <Tag key={h} label={h} color="#1a1a1a" textColor="#94a3b8" />)}
              {hunter.species.map((s) => <Tag key={s} label={s} color="#1a1a1a" textColor="#94a3b8" />)}
              {hunter.other.map((o) => <Tag key={o} label={o} color="#1a1a1a" textColor="#666" />)}
            </div>

            {/* Power + Stats */}
            {hunter.power !== undefined && (
              <div>
                <div style={{ fontSize: '0.65rem', fontFamily: 'Unbounded, sans-serif', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Max Power
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: rarityColor, fontFamily: 'Unbounded, sans-serif' }}>
                  {hunter.power.toLocaleString()}
                </div>
              </div>
            )}

            {hunter.stats && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <StatBox label="ATK"   value={hunter.stats.attack} />
                <StatBox label="DEF"   value={hunter.stats.defense} />
                <StatBox label="HP"    value={hunter.stats.health} />
                <StatBox label="SPD"   value={hunter.stats.speed} />
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {hunter.bio && hunter.bio.length > 0 && (
          <SectionCard title="Lore" accentColor="var(--gold)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {hunter.bio.map((para, i) => (
                <p key={i} style={{ margin: 0, fontSize: '0.92rem', color: '#b0b0b0', lineHeight: 1.75, fontStyle: para === 'Coming soon...' ? 'italic' : 'normal' }}>
                  {para}
                </p>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Skills */}
        {basicSkills.length > 0 && (
          <SectionCard title="Basic Skills" accentColor="#6b7280">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {basicSkills.map((s) => <SkillCard key={s.order} skill={s} />)}
            </div>
          </SectionCard>
        )}

        {specialSkills.length > 0 && (
          <SectionCard title="Special Skills" accentColor="#7c3aed">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {specialSkills.map((s) => <SkillCard key={s.order} skill={s} />)}
            </div>
          </SectionCard>
        )}

        {traits.length > 0 && (
          <SectionCard title="Traits" accentColor="#10b981">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {traits.map((s) => <SkillCard key={s.order} skill={s} />)}
            </div>
          </SectionCard>
        )}

        {/* Bonus Breakdown */}
        {bd && (
          <SectionCard title="Awakening Bonuses" accentColor="#f59e0b">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {bd.awaken && bd.awaken.length > 0 && (
                <AwakenTable rows={bd.awaken} label="Awaken" />
              )}
              {bd.super_awaken && bd.super_awaken.length > 0 && (
                <AwakenTable rows={bd.super_awaken} label="Super Awaken" />
              )}
              {bd.super_awaken_skill_enhance && bd.super_awaken_skill_enhance.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.7rem', fontFamily: 'Unbounded, sans-serif', color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                    Super Awaken Skill Enhance
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {bd.super_awaken_skill_enhance.map((e, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <span style={{ minWidth: '3.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', fontFamily: 'Unbounded, sans-serif' }}>
                          {'★'.repeat(e.stars)}
                        </span>
                        <span style={{ fontSize: '0.82rem', color: '#aaa', lineHeight: 1.5 }}>
                          <strong style={{ color: '#c8c8c8' }}>{e.skill}</strong> ({e.type}): {e.effect}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

      </div>
    </main>
  )
}
