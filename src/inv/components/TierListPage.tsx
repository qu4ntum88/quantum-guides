import Link from 'next/link'
import { notFound } from 'next/navigation'
import JsonLd from '@/app/components/JsonLd'
import { breadcrumbLd, INV_CRUMB, itemListLd, monthYear } from '@/src/lib/seo'
import TierBrowser from '@/src/qgg/components/TierBrowser'
import WorldHero from '@/src/qgg/components/WorldHero'
import { boardColumns, boardFor, browserEntities, browserFilters, getIcons, listLinks } from '../lib/board'
import { getInvUpdatedISO, getRoster, getTierLists, type Kind } from '../lib/data'
import { TIERS, tierListPath, unitPath } from '../lib/constants'
import { getQuantumOverall } from '../lib/quantum-tiers'

// Banner art: a released Titan for each board.
const BANNER: Record<Kind, string> = {
  Invoker: '/invokers/units/titans/litria/full.webp',
  Titan: '/invokers/units/titans/baggodal/full.webp',
}

const plural = (k: Kind) => (k === 'Titan' ? 'Titans' : 'Invokers')

export function tierListTitle(kind: Kind, listId: string) {
  const when = monthYear(getInvUpdatedISO())
  if (listId === 'overall') {
    return kind === 'Titan'
      ? `Invokers: Titan Legacy Titan Tier List${when ? ` (${when})` : ''}`
      : `Invokers: Titan Legacy Tier List${when ? ` (${when})` : ''}: All Invokers Ranked`
  }
  const boss = getTierLists(kind).find((l) => l.id === listId)?.boss ?? listId
  return `${boss} ${kind} Tier List: Best ${plural(kind)} for ${boss} | Invokers: Titan Legacy`
}

export function tierListDescription(kind: Kind, listId: string) {
  const n = getRoster().filter((u) => u.kind === kind).length
  const bosses = getTierLists(kind).length
  if (listId === 'overall') {
    return kind === 'Titan'
      ? `All ${n} Titans in Invokers: Titan Legacy ranked: an overall tier across ${bosses} boss tier lists, plus the full Titan database with stats, skills and bound effects.`
      : `All ${n} Invokers in Invokers: Titan Legacy ranked by role: an overall tier across ${bosses} boss tier lists, plus a searchable Invoker database by element, class, faction and rarity.`
  }
  const boss = getTierLists(kind).find((l) => l.id === listId)?.boss ?? listId
  return `The best ${plural(kind)} for ${boss} in Invokers: Titan Legacy, ranked S+ to ${kind === 'Titan' ? 'D' : 'E'} by role, with every ${kind === 'Titan' ? 'Titan' : 'Invoker'}'s skills and stats one click away.`
}

export default async function TierListPage({ kind, listId }: { kind: Kind; listId: string }) {
  // Quantum's own overall ranking (Site Admin → Invokers → Tier Lists) replaces the boss-list average once saved.
  const quantum = listId === 'overall' ? await getQuantumOverall(kind) : null
  const rows = boardFor(kind, listId, quantum)
  if (!rows) notFound()
  const lists = listLinks(kind)
  const units = browserEntities(kind)
  const columns = boardColumns(kind)
  const boss = listId === 'overall' ? null : lists.find((l) => l.id === listId)!.boss
  const path = tierListPath(kind, listId)
  const updated = getInvUpdatedISO()

  // Top of the board, for the summary text and the ItemList structured data.
  const ranked = rows.flatMap((r) => r.groups.flatMap((g) => g.members.map((s) => ({ s, tier: r.tier, role: g.role }))))
  const name = new Map(units.map((u) => [u.id, u.name]))
  const topByRole = columns
    .map(({ key: role }) => ({ role, top: ranked.filter((x) => x.role === role).slice(0, 3) }))
    .filter((x) => x.top.length)

  const heading = boss
    ? `${boss} ${kind} Tier List`
    : kind === 'Titan' ? 'Titan Tier List' : 'Invoker Tier List'

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbLd([
            INV_CRUMB,
            [kind === 'Titan' ? 'Titan Tier List' : 'Invoker Tier List', tierListPath(kind, 'overall')],
            ...(boss ? [[boss, path] as [string, string]] : []),
          ]),
          itemListLd(heading, ranked.slice(0, 50).map((x) => ({ name: name.get(x.s) ?? x.s, path: unitPath(kind, x.s) }))),
        ]}
      />
      <WorldHero
        world="invokers"
        overline="Invokers: Titan Legacy"
        title={heading}
        art={BANNER[kind]}
        note={updated ? `Updated ${monthYear(updated)}` : null}
        sub={
          boss
              ? `Who to bring against ${boss}: every ${kind === 'Titan' ? 'Titan' : 'Invoker'} ranked for this boss, grouped by role.`
              : quantum
                ? `Quantum's overall ranking of all ${units.length} ${plural(kind)}${kind === 'Titan' ? '' : ' by role'}. Pick a boss to see the game's own list for that fight${kind === 'Titan' ? '' : ', or switch to Grid to browse the whole database'}.`
                : kind === 'Titan'
                  ? `All ${units.length} Titans ranked. The overall tier combines each Titan's placements on all ${lists.length} boss tier lists; pick a boss to see its own list.`
                  : `All ${units.length} Invokers ranked by role. The overall tier combines each Invoker's placements on all ${lists.length} boss tier lists; pick a boss to see its own list, or switch to Grid to browse the whole database.`
        }
      />

      <section className="container w-section w-wide">
        <TierBrowser
          entities={units}
          rows={rows}
          tierOrder={TIERS}
          columns={columns}
          filters={browserFilters(kind)}
          icons={getIcons()}
          storageKey={`qgg:inv-${kind === 'Titan' ? 'titans' : 'invokers'}-view`}
          boardTitle={heading}
          boardNote={updated ? `Updated ${monthYear(updated)}` : null}
          searchPlaceholder={`Search ${plural(kind)} or effects…`}
          listNav={{
            label: 'Tier list for',
            items: [
              { href: tierListPath(kind, 'overall'), label: 'Overall', active: listId === 'overall' },
              ...lists.map((l) => ({ href: tierListPath(kind, l.id), label: l.boss, active: l.id === listId })),
            ],
          }}
        />
      </section>

      <section className="container w-section w-prose">
        <h2>{boss ? `Best ${plural(kind)} for ${boss}` : `Best ${plural(kind)} right now`}</h2>
        <ul>
          {topByRole.map(({ role, top }) => (
            <li key={role}>
              <strong>{role}:</strong>{' '}
              {top.map((x, i) => (
                <span key={x.s}>
                  {i > 0 && ', '}
                  <Link href={unitPath(kind, x.s)}>{name.get(x.s)}</Link> ({x.tier})
                </span>
              ))}
            </li>
          ))}
        </ul>
        <h2>How this tier list works</h2>
        <p>
          Invokers: Titan Legacy has a separate ranking for each boss, because a pick that shreds one boss can be dead
          weight against another.{' '}
          {boss
            ? `This page is the ${boss} list. Use the boss links above the board to compare it with the others, or the Overall list for a general ranking.`
            : quantum
              ? `The Overall list is Quantum's own ranking from playing the game, on the same S+ to E scale. The boss lists are the game's official ones, shown as published.`
              : `The Overall list scores each placement (S+ = 7 down to E = 0) and averages it across every boss list the ${kind === 'Titan' ? 'Titan' : 'Invoker'} appears on. Averaging pulls everyone toward the middle, so the overall tiers are then handed out in the same proportions the boss lists use: the top scorers get S+, and so on down.`}{' '}
          Filters dim anything that doesn&apos;t match on the board, and remove it in the Grid view.
        </p>
        <p>
          {kind === 'Titan' ? (
            <>Looking for Invokers instead? See the <Link href={tierListPath('Invoker', listId)}>{boss ? `${boss} Invoker tier list` : 'Invoker tier list'}</Link>.</>
          ) : (
            <>Pair them with the right Titan: see the <Link href={tierListPath('Titan', listId)}>{boss ? `${boss} Titan tier list` : 'Titan tier list'}</Link>.</>
          )}
        </p>
      </section>
    </main>
  )
}
