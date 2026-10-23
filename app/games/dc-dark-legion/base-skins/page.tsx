import Link from 'next/link'
import { getDataLastUpdated } from '@/src/dcdl/lib/data'
import { getBaseSkins, formatBonus, releaseMonth, type BaseSkin, type SkinBonus } from '@/src/dcdl/lib/base-skins'
import TakeBody from '@/src/dcdl/components/TakeBody'
import { OwnedTotals, OwnToggle } from './OwnedSkins'
import JsonLd from '@/app/components/JsonLd'
import { pageMeta, breadcrumbLd, faqLd, DCDL_CRUMB } from '@/src/lib/seo'
import '../../godforge/game.css'
import './base-skins.css'

const PATH = '/games/dc-dark-legion/base-skins'

export const metadata = pageMeta({
  title: 'Base Skins: Every Bonus in DC: Dark Legion',
  description:
    'Every DC: Dark Legion base skin with its owned and equipped bonuses, where it came from, and the total stats you get from owning them all.',
  path: PATH,
})

const FAQ = [
  {
    q: 'Do base skin bonuses stack?',
    a: 'The owned bonus of every skin you have unlocked applies at the same time, so they add up. The equipped bonus only applies for the one skin your base is wearing.',
  },
  {
    q: 'How do I change my base skin?',
    a: 'Tap your avatar to open your profile and apply any skin you have unlocked from there.',
  },
  {
    q: 'Can I still get base skins from past events?',
    a: 'Each skin so far has come from its themed event. In the September/October Feedback Report (October 16, 2026) the developers said they are considering selectable chests that could be exchanged during events for cosmetics from earlier events, base skins included. That is still being planned and nothing is confirmed.',
  },
]

function Bonuses({ label, list, tone }: { label: string; list: SkinBonus[]; tone: 'owned' | 'equipped' }) {
  return (
    <div className={`bsk-bonus is-${tone}`}>
      <div className="bsk-bonus-label">{label}</div>
      {list.length ? (
        <ul>
          {list.map((b) => (
            <li key={b.key}><strong>{formatBonus(b)}</strong> {b.stat}</li>
          ))}
        </ul>
      ) : (
        <p className="bsk-muted">None</p>
      )}
    </div>
  )
}

function Source({ skin }: { skin: BaseSkin }) {
  const r = skin.release
  const month = releaseMonth(r)
  if (r.event) return <>{r.event} event{month && <> · {month}</>}</>
  if (r.postTitle) return <>{r.postTitle}</>
  return null
}

function SkinCard({ skin, newest }: { skin: BaseSkin; newest: boolean }) {
  return (
    <article className="bsk-card" id={skin.id}>
      <div className="bsk-art">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {skin.banner ? <img src={skin.banner} alt={`${skin.name} base skin`} loading="lazy" /> : skin.icon && <img src={skin.icon} alt={`${skin.name} base skin`} loading="lazy" />}
      </div>
      <div className="bsk-info">
        <div className="bsk-head">
          <h3>{skin.name}</h3>
          {newest && <span className="bsk-tag">Newest</span>}
          <OwnToggle id={skin.id} name={skin.name} />
        </div>
        <p className="bsk-src"><Source skin={skin} /></p>
        <div className="bsk-bonuses">
          <Bonuses label="Owned" list={skin.owned} tone="owned" />
          <Bonuses label="Equipped" list={skin.equipped} tone="equipped" />
        </div>
        {skin.howToGet && (
          <p className="bsk-how"><span>How to get it:</span> {skin.howToGet}</p>
        )}
      </div>
      {skin.take && (
        <div className="bsk-take">
          <div className="bsk-take-label">Quantum&apos;s Take</div>
          <TakeBody text={skin.take} />
        </div>
      )}
    </article>
  )
}

export default function BaseSkinsPage() {
  const updated = getDataLastUpdated('base-skins.json', 'base-skins-notes.json')
  const skins = getBaseSkins()

  return (
    <main className="bsk">
      <JsonLd data={breadcrumbLd([DCDL_CRUMB, ['Base Skins', PATH]])} />
      <JsonLd data={faqLd(FAQ)} />
      <section className="gh-hero" style={{ '--game-accent': '#CCA453' } as React.CSSProperties}>
        <div className="container">
          <p className="gh-overline">DC: Dark Legion · Base Skins</p>
          <h1 className="gh-hero-title">Base Skins</h1>
          <p className="gh-hero-sub">
            Every base skin with the bonus you get for owning it, the bonus you get while it is equipped, and the event it came from.
          </p>
          <div className="gh-hero-divider" />
          <div className="bsk-hero-meta">
            {updated && <span className="bsk-updated">Updated: {updated}</span>}
            <Link href="/games/dc-dark-legion/guides">← DC: Dark Legion Guides</Link>
          </div>
        </div>
      </section>

      <div className="container bsk-body">
        <section className="bsk-summary" aria-labelledby="bsk-total-h">
          <div>
            <h2 id="bsk-total-h">Your owned bonuses</h2>
            <p className="bsk-lead">
              Every skin you unlock adds its owned bonus to every champion, whether or not it is equipped. On top of them, the skin you equip adds its equipped bonus.
              Tick the skins you own to see your total.
            </p>
          </div>
          <OwnedTotals skins={skins.map(({ id, name, order, owned }) => ({ id, name, order, owned }))} />
        </section>

        <section aria-labelledby="bsk-all-h">
          <h2 id="bsk-all-h">All base skins</h2>
          <p className="bsk-lead">Newest first.</p>
          <div className="bsk-grid">
            {skins.map((s, i) => <SkinCard key={s.id} skin={s} newest={i === 0} />)}
          </div>
        </section>

        <section aria-labelledby="bsk-compare-h">
          <h2 id="bsk-compare-h">Equipped bonuses side by side</h2>
          <p className="bsk-lead">You can only wear one skin at a time, so this is the choice that changes with your team.</p>
          <div className="bsk-table-wrap">
            <table className="bsk-table">
              <thead>
                <tr><th scope="col">Skin</th><th scope="col">Equipped</th><th scope="col">Owned</th></tr>
              </thead>
              <tbody>
                {skins.map((s) => (
                  <tr key={s.id}>
                    <th scope="row">
                      <a href={`#${s.id}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {s.icon && <img src={s.icon} alt="" loading="lazy" />}
                        <span>{s.name}</span>
                      </a>
                    </th>
                    <td>{s.equipped.map((b) => `${formatBonus(b)} ${b.stat}`).join(', ') || '—'}</td>
                    <td>{s.owned.map((b) => `${formatBonus(b)} ${b.stat}`).join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bsk-faq" aria-labelledby="bsk-faq-h">
          <h2 id="bsk-faq-h">Questions</h2>
          {FAQ.map((f) => (
            <div key={f.q} className="bsk-faq-item">
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
