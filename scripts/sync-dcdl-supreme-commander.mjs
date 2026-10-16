// Check (and optionally refresh) the Supreme Commander guide data against the DCDL client.
//
// Source: the game's own config tables, read straight from the PC install with the pipeline's
// cfg.mjs reader (E:\GameAssets\Exports\_pipeline\dcdl\cfg.mjs, patch dir wins over base):
//   TheGreastCommandarRank  one row per day (StageIndex 1–6) + the weekly ranking (StageIndex 0):
//                           PointResource -> Point rows, GetRewardCondition -> Task thresholds,
//                           ActivityNodeReward -> Reward -> ItemGroup items, RankReward/RankGroup
//   Point                   one row per scoring action; ShowPoint is the value the game displays
//   AsyncPVPConst           Maneuvers (day 6) league-outcome rewards + the Battle Honor top list
//   TopListRankReward       Battle Honor ranking rewards
//
//   AllianceConfrontationConst + AllianceConfrontLeagueReward
//                           the monthly Tournament: groups, entry rules, end-of-season rewards
//
// What the sync owns (safe to re-run every patch):
//   - numbers inside Tyler's sections: point values, which items count on each day, reward-round
//     thresholds + Magic Eyes, Maneuvers milestones, league outcomes (it adds a missing outcome,
//     e.g. "Win by Default") and Battle Honor ranking rewards;
//   - the whole top-level `game` block (full 20-step tracks, daily + event rankings, League Duel
//     victory points, Maneuvers maps, the Tournament, and game icons for items Tyler hasn't given
//     one), plus the icon files it copies to public/dcdl/resource_icons/game/.
// The intro, day titles, tips, labels, descriptions, item names and itemIcons are Tyler's and
// never touched. The admin save keeps `game` from disk, so editing the guide can't clobber it.
//
//   node scripts/sync-dcdl-supreme-commander.mjs          # dry run: report matches + differences
//   node scripts/sync-dcdl-supreme-commander.mjs --write  # apply the differences
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { fileURLToPath, pathToFileURL } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const GAME = process.env.DCDL_GAME_DIR || 'E:\\FunPlus\\DC Dark Legion\\game'
const PIPELINE = process.env.DCDL_PIPELINE_DIR || 'E:\\GameAssets\\Exports\\_pipeline\\dcdl'
const EXPORT = process.env.DCDL_EXPORT || 'E:\\GameAssets\\Exports\\dcdl'
// Game icons for reward items with no icon of Tyler's, copied from the export's game-ui art.
const ICON_DIR = 'public/dcdl/resource_icons/game'
const WRITE = process.argv.includes('--write')
const DATA_FILE = path.join(ROOT, 'src/dcdl/data/supreme-commander.json')

const { readCfg } = await import(pathToFileURL(path.join(PIPELINE, 'cfg.mjs')).href)
const PATCH = path.join(GAME, 'KGPatchV2', 'patch_windows', 'res_base')
const BASE = path.join(GAME, 'DC_Data', 'StreamingAssets', 'res_base')
const src = (rel) => (fs.existsSync(path.join(PATCH, rel)) ? path.join(PATCH, rel) : path.join(BASE, rel))
const tables = new Map()
const T = (name) => {
  if (!tables.has(name)) tables.set(name, readCfg(src(`luaCfg/bin/${name}.bin`), { structs: true }).rows)
  return tables.get(name)
}
const byId = (name) => new Map(T(name).map((r) => [r._key, r]))
const en = JSON.parse(zlib.gunzipSync(fs.readFileSync(src('lang/key_en.bin'))).toString('utf8'))

// ---------- game -> site vocabulary ----------
// A Point row is identified by what it scores (type + param), not its id: each day has its own
// copy of the row (Drone is 202 on day 3, 209 on day 4, 217 on day 5).
const POINT_ITEM = {
  'AddItem:11': 'Mother Box', // "Earn 1 Mother Box Point" (item 11 = Chest Points)
  'DelItem:0|51': 'World Anvil Fragment',
  'DelItem:0|9': 'Drone',
  'DelItem:0|49': 'Worldline Particle',
  'DelItem:0|92': 'Magic Eye',
  'DelItem:0|91': 'AC/DC Shard',
  'DelItem:0|44': 'Quantum Component',
  'DelItem:0|234': 'Firepit Afterburner',
  'DelItem:0|236': 'Scarab Circuit',
  'DelItem:0|231': 'Mirror Cell',
  'DelItem:16|6': 'Alloy (x1,000)', // spend 1,000 Alloy crafting gear
  'TechLevelUpCostItemNum': 'Chip (x1,000)', // spend 1,000 Chips on base tech
  'GveInfomationSweep': 'Intel', // spend 1 Intel Point
  'StarUpHero:5': 'Legendary Champion Shard',
  'StarUpHero:6': 'Mythic Champion Shard',
  'WeaponStarUP:4': 'Epic Legacy Piece',
  'WeaponStarUP:5': 'Legendary Legacy Piece',
  'WeaponStarUP:6': 'Mythic Legacy Piece',
  'DispatchRedTruck': 'Legendary Truck (Dispatch)',
  'PlunderRedTruck': 'Legendary Truck (Infiltrate)',
  'RechargeScores': 'VIP Points',
}
// Reward item id -> the name the site uses (the game pluralises a few).
const ITEM_NAME = {
  6: 'Alloy', 18: 'Source Energy Gem', 20: 'League Contribution', 44: 'Quantum Component',
  49: 'Worldline Particle', 91: 'AC/DC Shard', 92: 'Magic Eye', 234: 'Firepit Afterburner', 236: 'Scarab Circuit',
}
const MAGIC_EYE = 92
// "1,1" -> "1", "4,10" -> "4–10" (the site's rank labels)
const rankLabel = (lo, hi) => (lo === hi ? `${lo}` : `${lo}–${hi}`)
// Reward items Tyler already has an icon for under another name.
const ICON_ALIAS = { Chip: 'Chip (x1,000)', 'Random Mythic Champion Shard': 'Mythic Champion Shard' }
// The reward track is shown in rounds of 5 steps (20 steps = 4 rounds); the site lists each
// round's last threshold and the Magic Eyes inside it.
const ROUND_SIZE = 5

// ---------- read the game ----------
const stages = T('TheGreastCommandarRank')
const points = byId('Point')
const tasks = byId('Task')
const rewards = byId('Reward')
const itemGroups = byId('ItemGroup')
const items = byId('Item')
const itemName = (id) => ITEM_NAME[id] || en[items.get(id)?.NameKey] || `item #${id}`
const itemIds = new Map() // reward item name -> item id (for its game icon)

function rewardItems(rewardId) {
  const r = rewards.get(rewardId)
  if (!r) throw new Error(`Reward ${rewardId} not found`)
  const out = []
  for (const g of r.RewardGroupList) for (const gid of g.GroupList) {
    const grp = itemGroups.get(gid)
    if (!grp) throw new Error(`ItemGroup ${gid} (reward ${rewardId}) not found`)
    // OneByOne = every listed item is granted; anything else would be a random pick.
    if (grp.Type !== 'OneByOne') throw new Error(`ItemGroup ${gid} is ${grp.Type}, not a fixed reward`)
    for (const i of grp.ItemGroupInfoList) {
      itemIds.set(itemName(i.Items), i.Items)
      out.push({ id: i.Items, item: itemName(i.Items), qty: i.Nums })
    }
  }
  return out
}
const finishCondition = (taskId) => {
  const c = tasks.get(taskId)?.FinishBranch?.[0]?.BranchCondition?.FixedCondition?.[0]
  if (!c) throw new Error(`Task ${taskId} has no finish condition`)
  return c
}

// Points are stored ×scale internally (Point) and shown divided (ShowPoint); reward thresholds
// use the internal unit. Derive the scale from the rows instead of hard-coding it.
const dayStages = stages.filter((s) => s.StageIndex > 0).sort((a, b) => a.StageIndex - b.StageIndex)
const ratios = {}
for (const s of dayStages) for (const pid of s.PointResource) {
  const p = points.get(pid)
  if (p?.ShowPoint && p.Point % p.ShowPoint === 0) ratios[p.Point / p.ShowPoint] = (ratios[p.Point / p.ShowPoint] || 0) + 1
}
const SCALE = Number(Object.entries(ratios).sort((a, b) => b[1] - a[1])[0]?.[0])
if (!SCALE) throw new Error('Could not work out the point scale from the Point table')

const unknownPoints = []
const game = { days: [], maneuvers: null, weekly: null }
for (const s of dayStages) {
  const day = { day: s.StageIndex, name: en[s.StageName] || s.StageName, victoryPoints: s.WinPoint, points: [], nodes: [], dailyRanking: [] }
  for (const pid of s.PointResource) {
    const p = points.get(pid)
    const key = POINT_ITEM[`${p.PointType}:${p.Param}`] ? `${p.PointType}:${p.Param}` : p.PointType
    const item = POINT_ITEM[key]
    if (!item) unknownPoints.push({ day: s.StageIndex, id: pid, text: en[p.PointTypeDesc] || p.PointTypeDesc || p.StringId, value: p.ShowPoint })
    day.points.push({ item: item || en[p.PointTypeDesc] || `Point #${pid}`, value: p.ShowPoint, known: !!item })
  }
  s.GetRewardCondition.forEach((tid, i) => {
    const c = finishCondition(tid)
    const raw = Number(String(c.Param).split(';').pop())
    day.nodes.push({ type: c.Typ, at: c.Typ === 'TaskCommanderReachPointDaily' ? raw / SCALE : raw, rewards: rewardItems(s.ActivityNodeReward[i]) })
  })
  if (s.RankReward) {
    const groups = s.RankGroup.split('|')
    s.RankReward.split('|').forEach((rid, i) => day.dailyRanking.push({ rank: groups[i], rewards: rewardItems(Number(rid)) }))
  }
  game.days.push(day)
}
const weeklyStage = stages.find((s) => s.StageIndex === 0 && s.RankReward)
if (weeklyStage) {
  const groups = weeklyStage.RankGroup.split('|')
  game.weekly = weeklyStage.RankReward.split('|').map((rid, i) => ({ rank: groups[i], rewards: rewardItems(Number(rid)) }))
}

// Maneuvers (the no-resource day): milestones are "attack N times" tasks on its stage row;
// outcomes + Battle Honor ranking come from the Maneuvers mode's own config.
const manDay = game.days.find((d) => d.points.length === 0 && d.nodes.every((n) => n.type === 'AsyncPVPATKTimes'))
if (manDay) {
  const cfg = T('AsyncPVPConst')[0]
  const rankRows = T('TopListRankReward').filter((r) => r.TopListId === cfg.PersonalAchievementTopList).sort((a, b) => a.RankUp - b.RankUp)
  game.maneuvers = {
    day: manDay.day,
    milestones: manDay.nodes.map((n) => ({ at: n.at, rewards: n.rewards })),
    outcomes: {
      Victory: rewardItems(cfg.WinReward),
      Defeat: rewardItems(cfg.FailReward),
      'No Opponent': rewardItems(cfg.ByeReward),
      'Win by Default': rewardItems(cfg.NoWarWinReward), // opponent didn't qualify
    },
    ranking: rankRows.map((r) => ({ rank: rankLabel(r.RankUp, r.RankDown), rewards: rewardItems(r.Reward) })),
    maps: (cfg.RandomMapName || []).map((k) => en[k] || k),
  }
}

// Monthly Tournament: leagues play League Duels (the daily league-vs-league result of Supreme
// Commander) across a 4-week season inside one of three groups; rewards are paid at season end by
// group × the league's rank in its group × your rank inside your league.
{
  const cfg = T('AllianceConfrontationConst')[0]
  const art = byId('ArtResourceUI')
  const present = new Set(T('AllianceConfrontLeagueReward').map((r) => r.LeagueRankGroup))
  const enumOrder = ['AllianceConfrontationRankSilver', 'AllianceConfrontationRankGold', 'AllianceConfrontationRankDiamond']
  // LeagueRankName / LeagueRankIcon are listed lowest group first, the same order as the enum.
  const groups = enumOrder.filter((g) => present.has(g)).map((g) => {
    const i = enumOrder.indexOf(g)
    const rows = T('AllianceConfrontLeagueReward').filter((r) => r.LeagueRankGroup === g).sort((a, b) => a.LeagueRankRange[0] - b.LeagueRankRange[0])
    return {
      id: g.replace('AllianceConfrontationRank', '').toLowerCase(),
      name: en[cfg.LeagueRankName[i]] || g,
      iconArt: art.get(cfg.LeagueRankIcon[i])?.Name || null,
      leagueRanks: rows.map((r) => {
        const member = r.RankGroup.split('|')
        return {
          rank: rankLabel(...r.LeagueRankRange),
          memberRanks: r.RankReward.split('|').map((rid, j) => ({ rank: rankLabel(...member[j].split(',')), rewards: rewardItems(Number(rid)) })),
        }
      }),
    }
  })
  // The game's own Tournament guide text, numbered lines -> one rule each.
  const rules = (key) => String(en[key] || '').split('\n').map((s) => s.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)
  game.tournament = {
    rules: [...rules('event_sc_duel_association_rule_rank_desc'), ...rules('event_sc_duel_association_rule_reward_desc')],
    groups,
    minMembers: cfg.LeagueNeedMemberCnt,
    // "{0}/{1} points are required to be eligible for tournament rewards" (internal unit).
    pointsRequired: cfg.LeagueNeedRewardNeedScore / SCALE,
  }
}

// ---------- compare with the site ----------
const site = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
const next = structuredClone(site)
const ok = []
const diffs = []
const conflicts = []
const note = (good, label, from, to) => {
  if (good) ok.push(label)
  else diffs.push(`${label}: site ${fmt(from)} → game ${fmt(to)}`)
}
const fmtRewards = (rs) => rs.map((r) => `${r.item} ×${r.qty.toLocaleString('en-US')}`).join(', ')
const fmt = (v) => (typeof v === 'string' ? v : Array.isArray(v) && v[0]?.qty !== undefined ? fmtRewards(v) : JSON.stringify(v))
const sameRewards = (a, b) => JSON.stringify(a.map((r) => [r.item, r.qty])) === JSON.stringify(b.map((r) => [r.item, r.qty]))
const siteRewards = (rs) => rs.map(({ item, qty }) => ({ item, qty }))

const siteDays = site.days.filter((d) => !d.noResources)
const gameResourceDays = game.days.filter((d) => d !== manDay)
if (site.days.length !== game.days.length) conflicts.push(`The game has ${game.days.length} days, the site ${site.days.length}.`)

// Which items count on each day.
for (const sd of siteDays) {
  const gd = gameResourceDays.find((d) => d.day === sd.day)
  if (!gd) { conflicts.push(`Day ${sd.day}: no resource stage with that index in the game.`); continue }
  const gameItems = gd.points.map((p) => p.item)
  const same = gameItems.length === sd.usableItems.length && gameItems.every((i) => sd.usableItems.includes(i))
  note(same, `Day ${sd.day} counted items`, sd.usableItems, gameItems)
  if (!same) next.days.find((d) => d.day === sd.day).usableItems = gameItems
}

// Point tables: every day that uses a table must agree on each item's value.
for (const [key, table] of Object.entries(site.pointTables)) {
  const users = siteDays.filter((d) => d.pointTable === key).map((d) => gameResourceDays.find((g) => g.day === d.day)).filter(Boolean)
  const want = new Map()
  for (const d of users) for (const p of d.points) {
    if (want.has(p.item) && want.get(p.item).value !== p.value) conflicts.push(`${table.label}: ${p.item} is ${want.get(p.item).value} on day ${want.get(p.item).day} but ${p.value} on day ${d.day}.`)
    else want.set(p.item, { value: p.value, day: d.day })
  }
  const rows = next.pointTables[key].rows
  for (const row of rows) {
    if (!want.has(row.item)) { conflicts.push(`${table.label}: ${row.item} isn't scored on any of its days in the game.`); continue }
    const v = want.get(row.item).value
    note(row.value === v, `${table.label}: ${row.item}`, row.value, v)
    row.value = v
  }
  for (const [item, { value }] of want) if (!rows.some((r) => r.item === item)) {
    diffs.push(`${table.label}: new item ${item} = ${value}`)
    rows.push({ item, value })
  }
}

// Reward tracks: rounds of ROUND_SIZE steps.
const roundsOf = (d) => {
  if (d.nodes.length % ROUND_SIZE) conflicts.push(`Day ${d.day} has ${d.nodes.length} reward steps (not a multiple of ${ROUND_SIZE}).`)
  const out = []
  for (let i = 0; i < d.nodes.length; i += ROUND_SIZE) {
    const chunk = d.nodes.slice(i, i + ROUND_SIZE)
    const eyes = chunk.flatMap((n) => n.rewards).filter((r) => r.id === MAGIC_EYE).reduce((a, r) => a + r.qty, 0)
    out.push({ round: out.length + 1, eyes, points: chunk.at(-1).at })
  }
  return out
}
for (const [key, track] of Object.entries(site.rewardTracks)) {
  const users = siteDays.filter((d) => d.rewardTrack === key).map((d) => gameResourceDays.find((g) => g.day === d.day)).filter(Boolean)
  if (!users.length) { conflicts.push(`${track.label}: no day uses this track.`); continue }
  const want = roundsOf(users[0])
  for (const d of users.slice(1)) if (JSON.stringify(roundsOf(d)) !== JSON.stringify(want)) conflicts.push(`${track.label}: day ${d.day}'s track differs from day ${users[0].day}'s.`)
  want.forEach((w, i) => {
    const s = track.rounds[i]
    note(s?.points === w.points, `${track.label} round ${w.round} points`, s?.points, w.points)
    note(s?.eyes === w.eyes, `${track.label} round ${w.round} Magic Eyes`, s?.eyes, w.eyes)
  })
  if (track.rounds.length !== want.length) diffs.push(`${track.label}: site has ${track.rounds.length} rounds, game ${want.length}`)
  next.rewardTracks[key].rounds = want
}

// Maneuvers.
if (game.maneuvers && site.metropolis) {
  const m = game.maneuvers, sm = site.metropolis, nm = next.metropolis
  const sameMilestoneReward = m.milestones.every((x) => sameRewards(x.rewards, m.milestones[0].rewards))
  if (!sameMilestoneReward) conflicts.push('Maneuvers milestones no longer all give the same reward (the site shows one reward for every milestone).')
  const thresholds = m.milestones.map((x) => x.at)
  note(JSON.stringify(sm.milestones.thresholds) === JSON.stringify(thresholds), 'Maneuvers milestone thresholds', sm.milestones.thresholds, thresholds)
  nm.milestones.thresholds = thresholds
  const mReward = siteRewards(m.milestones[0].rewards)
  note(sameRewards(sm.milestones.reward, mReward), 'Maneuvers milestone reward', sm.milestones.reward, mReward)
  nm.milestones.reward = mReward
  for (const o of nm.leagueOutcomes.outcomes) {
    const g = m.outcomes[o.name]
    if (!g) { conflicts.push(`League outcome "${o.name}" has no match in the game.`); continue }
    const want = siteRewards(g)
    note(sameRewards(o.rewards, want), `League outcome ${o.name}`, siteRewards(o.rewards), want)
    o.rewards = want
  }
  for (const [name, rs] of Object.entries(m.outcomes)) if (!nm.leagueOutcomes.outcomes.some((o) => o.name === name)) {
    diffs.push(`League outcomes: new outcome ${name} (${fmtRewards(rs)})`)
    nm.leagueOutcomes.outcomes.push({ name, rewards: siteRewards(rs) })
  }
  const tiers = m.ranking.map((r) => ({ rank: r.rank, rewards: siteRewards(r.rewards) }))
  note(JSON.stringify(sm.ranking.tiers.map((t) => t.rank)) === JSON.stringify(tiers.map((t) => t.rank)), 'Battle Honor ranking brackets', sm.ranking.tiers.map((t) => t.rank), tiers.map((t) => t.rank))
  for (const t of tiers) {
    const s = sm.ranking.tiers.find((x) => x.rank === t.rank)
    if (s) note(sameRewards(s.rewards, t.rewards), `Battle Honor rank ${t.rank}`, siteRewards(s.rewards), t.rewards)
  }
  nm.ranking.tiers = tiers
}

// ---------- the game-owned block ----------
const rankRows = (rows) => rows.map((r) => ({ rank: r.rank.includes(',') ? rankLabel(...r.rank.split(',')) : r.rank, rewards: siteRewards(r.rewards) }))
next.game = {
  about: 'Written by scripts/sync-dcdl-supreme-commander.mjs from the game files on every run; hand edits here are overwritten.',
  days: game.days.map((d) => ({
    day: d.day,
    name: d.name,
    victoryPoints: d.victoryPoints,
    track: d === manDay ? [] : d.nodes.map((n) => ({ points: n.at, rewards: siteRewards(n.rewards) })),
    dailyRanking: rankRows(d.dailyRanking),
  })),
  eventRanking: rankRows(game.weekly || []),
  maneuvers: game.maneuvers ? { day: game.maneuvers.day, maps: game.maneuvers.maps } : null,
  tournament: {
    rules: game.tournament.rules,
    minMembers: game.tournament.minMembers,
    pointsRequired: game.tournament.pointsRequired,
    groups: game.tournament.groups.map((g) => ({
      id: g.id,
      name: g.name,
      icon: null, // filled below from the export art
      leagueRanks: g.leagueRanks.map((lr) => ({ rank: lr.rank, memberRanks: rankRows(lr.memberRanks) })),
    })),
  },
  icons: {},
}

// Icons: Tyler's itemIcons win; an alias reuses one of his for the same item under another name;
// otherwise the game's own icon is copied from the export's game-ui art.
const uiRoot = (() => {
  const raw = path.join(EXPORT, '_raw')
  if (!fs.existsSync(raw)) return null
  return fs.readdirSync(raw).sort().reverse().map((d) => path.join(raw, d, 'game-ui')).find((p) => fs.existsSync(p)) || null
})()
const uiImages = new Map()
if (uiRoot) (function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name.endsWith('.png')) uiImages.set(e.name.slice(0, -4).toLowerCase(), p)
  }
})(uiRoot)
const artNames = byId('ArtResourceUI')
const iconCopies = new Map() // public file -> source png
const missingArt = []
const gameIcon = (artName, label) => {
  const file = artName && uiImages.get(artName.toLowerCase())
  if (!file) { missingArt.push(label); return null }
  // Already in the hand-picked icon folder under the game's file name: use that copy.
  const existing = `public/dcdl/resource_icons/${path.basename(file)}`
  if (fs.existsSync(path.join(ROOT, existing))) return existing.replace(/^public/, '')
  const rel = `${ICON_DIR}/${path.basename(file)}`
  iconCopies.set(path.join(ROOT, rel), file)
  return rel.replace(/^public/, '')
}
const allRewards = [
  ...next.game.days.flatMap((d) => [...d.track.flatMap((t) => t.rewards), ...d.dailyRanking.flatMap((r) => r.rewards)]),
  ...next.game.eventRanking.flatMap((r) => r.rewards),
  ...next.game.tournament.groups.flatMap((g) => g.leagueRanks.flatMap((lr) => lr.memberRanks.flatMap((r) => r.rewards))),
  ...(next.metropolis ? [...next.metropolis.milestones.reward, ...next.metropolis.leagueOutcomes.outcomes.flatMap((o) => o.rewards), ...next.metropolis.ranking.tiers.flatMap((t) => t.rewards)] : []),
]
for (const name of new Set(allRewards.map((r) => r.item))) {
  if (next.itemIcons?.[name]) continue
  if (next.itemIcons?.[ICON_ALIAS[name]]) { next.game.icons[name] = next.itemIcons[ICON_ALIAS[name]]; continue }
  const id = itemIds.get(name)
  const icon = id ? gameIcon(artNames.get(items.get(id)?.Icon)?.Name, name) : null
  if (icon) next.game.icons[name] = icon
}
next.game.tournament.groups.forEach((g, i) => { g.icon = gameIcon(game.tournament.groups[i].iconArt, `${g.name} badge`) })
if (!uiRoot) {
  // No export on this PC: keep whatever icons the last run found rather than dropping them.
  next.game.icons = site.game?.icons || {}
  next.game.tournament.groups.forEach((g) => { g.icon = site.game?.tournament?.groups?.find((x) => x.id === g.id)?.icon || null })
  iconCopies.clear()
}
const staleIcons = [...iconCopies].filter(([dest, from]) => !fs.existsSync(dest) || !fs.readFileSync(dest).equals(fs.readFileSync(from)))

// Every item the data names needs an icon on the page.
const named = new Set([
  ...next.days.flatMap((d) => d.usableItems),
  ...Object.values(next.pointTables).flatMap((t) => t.rows.map((r) => r.item)),
  ...allRewards.map((r) => r.item),
])
const noIcon = [...named].filter((i) => !next.itemIcons?.[i] && !next.game.icons[i])

// ---------- report ----------
const line = (s = '') => console.log(s)
line(`Supreme Commander vs the game client (${fs.existsSync(PATCH) ? 'patch + base' : 'base'} files, point scale ×${SCALE})`)
line()
line(`Matches: ${ok.length} values in the guide's own sections`)
line(`Differences: ${diffs.length}`)
for (const d of diffs) line(`  - ${d}`)
if (conflicts.length) { line(`Needs a decision (the site's shape can't express this): ${conflicts.length}`); for (const c of conflicts) line(`  - ${c}`) }
if (unknownPoints.length) { line('New scoring actions not mapped to a site item (add them to POINT_ITEM):'); for (const u of unknownPoints) line(`  - day ${u.day}: "${u.text}" = ${u.value} (Point #${u.id})`) }
if (noIcon.length) line(`Items with no icon: ${noIcon.join(', ')}`)
if (!uiRoot) line(`No game-ui art under ${path.join(EXPORT, '_raw')} (run the DCDL extraction); icons kept from the last run.`)
else if (missingArt.length) line(`No game art found for: ${missingArt.join(', ')}`)
line()
const gb = next.game
const gameChanged = JSON.stringify(site.game) !== JSON.stringify(gb)
line(`Game-data block (${gameChanged ? (site.game ? 'CHANGED' : 'NEW') : 'unchanged'}):`)
line(`  - Reward tracks: ${gb.days.filter((d) => d.track.length).map((d) => `day ${d.day} ${d.track.length} steps to ${d.track.at(-1).points.toLocaleString('en-US')}`).join(', ')}`)
line(`  - Daily ranking to rank ${gb.days[0]?.dailyRanking.at(-1)?.rank ?? '—'}; event ranking to rank ${gb.eventRanking.at(-1)?.rank ?? '—'}`)
line(`  - Day names: ${gb.days.map((d) => `${d.day} "${d.name}"`).join(', ')}`)
line(`  - League Duel victory points: ${gb.days.map((d) => `day ${d.day} = ${d.victoryPoints}`).join(', ')}`)
if (gb.maneuvers) line(`  - Maneuvers map: ${gb.maneuvers.maps.join(' or ')} (random)`)
line(`  - Tournament: ${gb.tournament.groups.map((x) => x.name).join(' / ')}; ${gb.tournament.minMembers}+ members; ${gb.tournament.pointsRequired.toLocaleString('en-US')} points to qualify for rewards`)
line(`  - Icons: ${Object.keys(gb.icons).length} items + ${gb.tournament.groups.filter((x) => x.icon).length} group badges (${staleIcons.length} file${staleIcons.length === 1 ? '' : 's'} to copy)`)
line()

const changed = JSON.stringify(next) !== JSON.stringify(site) || staleIcons.length > 0
if (!changed) line('Site data already matches the game.')
else if (!WRITE) line('Dry run: nothing written. Re-run with --write to apply the differences above.')
else {
  if (conflicts.length || unknownPoints.length) line('Note: items under "Needs a decision" / "New scoring actions" were left for a manual edit.')
  fs.writeFileSync(DATA_FILE, JSON.stringify(next, null, 2), 'utf8')
  if (staleIcons.length) fs.mkdirSync(path.join(ROOT, ICON_DIR), { recursive: true })
  for (const [dest, from] of staleIcons) fs.copyFileSync(from, dest)
  line(`Wrote ${path.relative(ROOT, DATA_FILE)}${staleIcons.length ? ` and ${staleIcons.length} icon(s) in ${ICON_DIR}` : ''}. Commit afterwards.`)
}
