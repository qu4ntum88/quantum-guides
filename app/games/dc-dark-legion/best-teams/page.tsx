import { getResolvedHeros, getDataLastUpdated, type HeroResolved } from '@/src/dcdl/lib/data'
import '../../godforge/game.css'
import './best-teams.css'

type ReplacementRow = { required: string; replacements: string[] }
type Team = { rank: number; name?: string; explanation: string; required: string[]; optional: string[]; replacements?: ReplacementRow[] }
type Synergy = { id: string; name: string; image: string }

function readTeams(): Team[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/src/dcdl/data/best-teams.json') as Team[]
}

function readSynergies(): Synergy[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/src/dcdl/data/synergies.json') as Synergy[]
}

function synergyImagePath(raw: string): string {
  return '/dcdl/synergies/' + raw.replace(/^\.\//, '')
}

const RARITY_BG: Record<string, string> = {
  'Iconic':   '#00292a',
  'Mythic +': '#3a000f',
  'Mythic':   '#3a0014',
  'Legendary':'#3a2d00',
  'Epic':     '#2e0038',
}

function ChampPortrait({ hero, variant }: { hero: HeroResolved; variant: 'req' | 'opt' | 'sub' }) {
  return (
    <a className={`bt-champ bt-champ--${variant}`} href={`/games/dc-dark-legion/heros/${hero.id}`} title={hero.name}>
      <span className="bt-frame">
        <img
          src={hero.imageHeadshot ?? ''}
          alt={hero.name}
          style={{ background: RARITY_BG[hero.rarity] ?? '#111' }}
        />
      </span>
      <span className="bt-champ-name">{hero.name.split('(')[0].trim()}</span>
    </a>
  )
}

function ArrowIcon() {
  return (
    <svg className="bt-arrow" viewBox="0 0 32 12" aria-hidden="true">
      <path d="M1 6 H28 M23 1.5 L28.5 6 L23 10.5" />
    </svg>
  )
}

function FlexSlot() {
  return (
    <div className="bt-flex">
      <span className="bt-flex-box">FLEX</span>
      <span className="bt-champ-name">&nbsp;</span>
    </div>
  )
}

function FormationLine({ label, heroes }: { label: string; heroes: (HeroResolved | null)[] }) {
  return (
    <div className="bt-line">
      <span className="bt-line-label">{label}</span>
      <div className="bt-line-slots">
        {heroes.map((hero, i) =>
          hero ? <ChampPortrait key={hero.id} hero={hero} variant="req" /> : <FlexSlot key={`flex-${i}`} />
        )}
      </div>
    </div>
  )
}

export default function BestTeamsPage() {
  const lastUpdated = getDataLastUpdated('heros.json', 'best-teams.json')
  const heroes = getResolvedHeros()
  const heroMap = Object.fromEntries(heroes.map((h) => [h.id, h]))
  const synergies = readSynergies()
  const synergyMap = Object.fromEntries(synergies.map((s) => [s.id, s]))
  const teams = readTeams()
  const filledTeams = teams.filter((t) => t.required.length > 0 || t.optional.length > 0 || t.explanation)
  const hasReplacements = filledTeams.some((t) => (t.replacements ?? []).length > 0)

  return (
    <main>
      <section className="gh-hero" style={{ '--game-accent': '#CCA453' } as React.CSSProperties}>
        <div className="container">
          <p className="gh-overline">DC: Dark Legion — Ranked Meta</p>
          <h1 className="gh-hero-title">Best Teams in DC: Dark Legion</h1>
          <p className="gh-hero-sub">Quantum&apos;s top team compositions ranked by overall effectiveness.</p>
          <div className="gh-hero-divider" />
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', fontFamily: 'monospace' }}>Updated: {lastUpdated}</span>
            <a href="/games/dc-dark-legion" style={{ fontSize: '0.78rem', color: 'var(--gold)', opacity: 0.85, textDecoration: 'none' }}>← Champion List</a>
          </div>
        </div>
      </section>

      <section className="bt-section">
        <div className="container">
          {filledTeams.length > 0 && (
            <div className="bt-legend">
              <span><i className="bt-key bt-key--req" /> Required core</span>
              <span><i className="bt-key bt-key--opt" /> Optional flex</span>
              {hasReplacements && <span><ArrowIcon /> Viable replacement</span>}
            </div>
          )}

          {filledTeams.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No teams have been configured yet.</p>
          ) : (
            filledTeams.map((team, index) => {
              const requiredSlots = Array.from({ length: 5 }, (_, i) => heroMap[team.required[i] ?? ''] ?? null)
              const frontline = requiredSlots.slice(0, 2)
              const backline = requiredSlots.slice(2, 5)
              const requiredHeroes = requiredSlots.filter(Boolean) as HeroResolved[]
              const optionalHeroes = team.optional.map((id) => heroMap[id]).filter(Boolean)
              const replacementRows = (team.replacements ?? [])
                .map((row) => ({
                  required: heroMap[row.required],
                  replacements: row.replacements.map((id) => heroMap[id]).filter(Boolean),
                }))
                .filter((row) => row.required && row.replacements.length > 0)

              // Count synergies across all champions on the team
              const allHeroes = [...requiredHeroes, ...optionalHeroes]
              const synCounts: Record<string, number> = {}
              allHeroes.forEach((h) => {
                h.tagSynergies.forEach((s) => { synCounts[s.id] = (synCounts[s.id] ?? 0) + 1 })
              })
              const triggeredSynergies = Object.entries(synCounts)
                .filter(([, count]) => count >= 3)
                .map(([id]) => synergyMap[id])
                .filter(Boolean)

              const rankNo = String(team.rank).padStart(2, '0')

              return (
                <article
                  key={team.rank}
                  className="bt-card"
                  data-rank={team.rank}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="bt-card-inner">
                    <span className="bt-watermark" aria-hidden="true">{rankNo}</span>

                    <header className="bt-head">
                      <div className="bt-plate"><span>#{team.rank}</span></div>
                      {team.name && <h2 className="bt-team-name">{team.name}</h2>}
                      {triggeredSynergies.length > 0 && (
                        <div className="bt-syn">
                          {triggeredSynergies.map((syn) => (
                            <div key={syn.id} className="bt-syn-item" title={syn.name}>
                              <img src={synergyImagePath(syn.image)} alt={syn.name} />
                              <span>{syn.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </header>

                    {team.explanation && <p className="bt-expl">{team.explanation}</p>}

                    <div className="bt-roster">
                      <div className="bt-group bt-group--req">
                        <div className="bt-group-label">Required Core</div>
                        <div className="bt-formation">
                          <FormationLine label="Frontline" heroes={frontline} />
                          <FormationLine label="Backline" heroes={backline} />
                        </div>
                      </div>
                      {optionalHeroes.length > 0 && (
                        <div className="bt-group bt-group--opt">
                          <div className="bt-group-label">Optional</div>
                          <div className="bt-champs">
                            {optionalHeroes.map((hero) => <ChampPortrait key={hero.id} hero={hero} variant="opt" />)}
                          </div>
                        </div>
                      )}
                    </div>

                    {replacementRows.length > 0 && (
                      <div className="bt-subs">
                        <div className="bt-subs-label">Viable Replacements</div>
                        <div className="bt-sub-rows">
                          {replacementRows.map((row) => (
                            <div key={row.required.id} className="bt-sub-row">
                              <ChampPortrait hero={row.required} variant="sub" />
                              <ArrowIcon />
                              {row.replacements.map((hero) => <ChampPortrait key={hero.id} hero={hero} variant="sub" />)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              )
            })
          )}
        </div>
      </section>

      {/* Logos Footer */}
      <section style={{ padding: '2.5rem 0 3rem', background: '#0a0a10' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
            <img
              src="/images/site/Q%20GOLD%20FULL%20ICON.png"
              alt="Quantum Game Guides"
              style={{ height: '6rem', objectFit: 'contain' }}
            />
            <img
              src="/dcdl/logos/Game_logo_-_blue_white.png"
              alt="DC: Dark Legion"
              style={{ height: '6rem', objectFit: 'contain' }}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
