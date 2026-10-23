// Build the data behind the DCDL Account Profile page and the account bonuses in every
// champion's Stat Calculator: everything account-wide that changes a champion's stats.
//
// Source: the game's config tables, read from the PC install with the pipeline's cfg.mjs reader
// (E:\GameAssets\Exports\_pipeline\dcdl\cfg.mjs, patch dir wins over base). Decoded 2026-10-23
// (tables, Lua and in-game checks are written up in CLAUDE.md under "Account Profile"):
//   HeroGlobalSkill   Global Skills, 5 levels, at stars 0/8/13/18/23 (Task TaskHeroStarUp; level 1
//                     is on as soon as the champion is unlocked).
//                     Each level holds an all-champion part, a class part (HeroCareer) and a
//                     faction part (HeroTagTemplate).
//   Hero / HeroTag    a champion's class (HeroCareer) and factions (HeroTag.SkillTags).
//   Technology        personal research, Combat tree (Classification 2): class ATK% / HP% nodes.
//   AllianceTechnology league research, Combat tree: every stat only counts in some modes
//                     (Attribute.ConvertToId / ConvertBattleType).
//   Equip / EquipMainAttr / EquipBase / AttrGrowthNew   gear: stats depend on armor weight, slot
//                     and gear level only (HeroPowerUtil.GetEquipAllAttrMapByHero); a faction tag
//                     matching the champion multiplies a piece by 1 + MatchTagBenifit.
//   VehiclesApokolips Apokolips level (Quantum Components): flat stats for every champion plus a
//                     milestone every 200 levels; milestones stack
//                     (CastleVehicleHelper.GetAllUnlockApokolipsBonusAttr).
//   VehicleComponent  Firepit Afterburner parts (6, level 0–120, account-wide).
//   VehiclesModify    Afterburner milestones by the total upgrade count (TotalModifyLevel).
//   Vehicles / VehiclesStar   ships: star bonus + the ship's unique skill (text only).
//                     VehiclesSKill is the pre-April-2025 per-ship system and is not used.
//   VipSystem / VipBuff       VIP champion stats (GroupType Hero); each level lists its totals.
//   AppearanceDecorate        room skins with a stat bonus (owned = applied).
//   Attribute         stat names and which part of the formula a stat belongs to.
//
// Writes src/dcdl/data/game/account-bonuses.json and art in public/dcdl/account/. Long level
// series are run-length encoded as [start, delta, count, delta, count, …] (see decodeSeries in
// src/dcdl/lib/account-bonuses.ts). Everything here is already in the live game: only site
// champions are listed, hidden ships are skipped, and the old ship-skill system is left out.
//
//   node scripts/sync-dcdl-account-bonuses.mjs          # dry run: report what would change
//   node scripts/sync-dcdl-account-bonuses.mjs --write  # write the JSON + art
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import crypto from 'crypto'
import { fileURLToPath, pathToFileURL } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const GAME = process.env.DCDL_GAME_DIR || 'E:\\FunPlus\\DC Dark Legion\\game'
const PIPELINE = process.env.DCDL_PIPELINE_DIR || 'E:\\GameAssets\\Exports\\_pipeline\\dcdl'
const EXPORT = process.env.DCDL_EXPORT || 'E:\\GameAssets\\Exports\\dcdl'
const WRITE = process.argv.includes('--write')
const DATA_FILE = path.join(ROOT, 'src/dcdl/data/game/account-bonuses.json')
const CHAMP_DIR = path.join(ROOT, 'src/dcdl/data/game/champions')
const ART_DIR = 'public/dcdl/account'

const { readCfg } = await import(pathToFileURL(path.join(PIPELINE, 'cfg.mjs')).href)
const PATCH = path.join(GAME, 'KGPatchV2', 'patch_windows', 'res_base')
const BASE = path.join(GAME, 'DC_Data', 'StreamingAssets', 'res_base')
const src = (rel) => (fs.existsSync(path.join(PATCH, rel)) ? path.join(PATCH, rel) : path.join(BASE, rel))
const rows = (name) => readCfg(src(`luaCfg/bin/${name}.bin`), { structs: true }).rows
const byId = (name) => new Map(rows(name).map((r) => [r._key, r]))
const en = JSON.parse(zlib.gunzipSync(fs.readFileSync(src('lang/key_en.bin'))).toString('utf8'))
const t = (k) => (k ? en[k] ?? null : null)
const clean = (s) => (s || '').replace(/<\/?color[^>]*>/g, '').replace(/<br>/g, ' ').replace(/\s+/g, ' ').trim()
const line = (s = '') => console.log(s)
const warnings = []

// ---------- stats ----------
const attrById = byId('Attribute')
const attrByName = new Map([...attrById.values()].map((r) => [r.Attribute0, r]))
const attrKey = (id) => (typeof id === 'string' ? id : attrById.get(id)?.Attribute0 ?? null)
const MAIN = { Hp: 'HP', Atk: 'ATK', Def: 'P. DEF', Fort: 'S. DEF' }
// Labels the site uses for the other stats (the game's are inconsistent).
const LABEL = {
  Crit: 'Crit Rate', CritRes: 'Crit RES', CritPower: 'Crit DMG', CritPowerRes: 'Crit DMG RES',
  Dodge: 'Dodge', Hit: 'ACC', SprWave: 'Spiritual AMP', EffectHit: 'Effect ACC', EffectRes: 'Effect RES',
  HealAdd: 'Healing Bonus', HealedAdd: 'Healing Taken Up', EnergySpeed: 'Energy Gain', SkillSpeed: 'Cooldown Bonus',
  PhyAdd: 'Physical PEN', SprAdd: 'Spiritual PEN', PhyDes: 'Physical RES', SprDes: 'Spiritual RES',
}
const usedStats = new Set()
/** Attribute0 → { label, calc (one of the four main stats, or null), bucket, pct }. */
function statInfo(key) {
  const a = attrByName.get(key)
  const pct = /^M10k/.test(a?.Percent || '')
  const m = key.match(/^(Hp|Atk|Def|Fort)(Hero|Equip|EquipRatio|TechRatio|StarRatio|BattleRatio|Battle|General)$/)
  if (m) {
    const bucket = { Hero: 'base', Equip: 'flat', EquipRatio: 'pct', TechRatio: 'pct', StarRatio: 'star', BattleRatio: 'pct', Battle: 'flat', General: 'flat' }[m[2]]
    return { label: MAIN[m[1]], calc: MAIN[m[1]], bucket, pct }
  }
  const stem = key.replace(/(HeroRatio|EquipRatio|BattleRatio|Hero|Equip|Battle)$/, '')
  const label = LABEL[stem] || clean(t(a?.Name)) || key
  if (!LABEL[stem]) warnings.push(`stat ${key} has no site label; using "${label}"`)
  return { label, calc: null, bucket: 'other', pct }
}
const stat = (key, value) => {
  const k = attrKey(key)
  if (!k || !value) return null
  usedStats.add(k)
  return [k, value]
}
const stats = (list) => list.map(([k, v]) => stat(k, v)).filter(Boolean)

// ---------- level series ----------
/**
 * A level curve, exact and small. Curves whose step repeats every few levels (the Apokolips
 * repeats every 10) are { start, length, cycle: [steps] }; the rest are run-length encoded as
 * [start, delta, count, delta, count, …]. decodeSeries in src/dcdl/lib/account-bonuses.ts reads both.
 */
function encodeSeries(values) {
  const steps = values.slice(1).map((v, i) => v - values[i])
  for (let p = 2; p <= 50 && p * 4 <= steps.length; p++) {
    if (steps.every((d, i) => d === steps[i % p])) return { start: values[0] ?? 0, length: values.length, cycle: steps.slice(0, p) }
  }
  const out = [values[0] ?? 0]
  for (let i = 1; i < values.length; i++) {
    const d = values[i] - values[i - 1]
    if (out.length > 1 && out[out.length - 2] === d) out[out.length - 1]++
    else out.push(d, 1)
  }
  return out
}

// ---------- art ----------
const artUI = byId('ArtResourceUI')
const rawRoot = path.join(EXPORT, '_raw')
const uiRoot = fs.existsSync(rawRoot)
  ? fs.readdirSync(rawRoot).sort().reverse().map((d) => path.join(rawRoot, d, 'game-ui')).find((p) => fs.existsSync(p))
  : null
const images = new Map()
;(function index(dir) {
  if (!dir) return
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) index(p)
    else if (e.name.endsWith('.png')) images.set(e.name.slice(0, -4).toLowerCase(), p)
  }
})(uiRoot)
const hash = (f) => crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex')
const artCopies = []
const missingArt = []
function artFile(artId, name) {
  const sprite = artUI.get(artId)?.Name
  const from = sprite && images.get(sprite.toLowerCase())
  const rel = `${ART_DIR}/${name}.png`
  const dest = path.join(ROOT, rel)
  if (!from) {
    if (fs.existsSync(dest)) return `/${rel.replace(/^public\//, '')}`
    missingArt.push(`${name} (${sprite || artId})`)
    return null
  }
  if ((!fs.existsSync(dest) || hash(dest) !== hash(from)) && !artCopies.some(([d]) => d === dest)) artCopies.push([dest, from])
  return `/${rel.replace(/^public\//, '')}`
}

// ---------- classes + factions ----------
const careers = byId('HeroCareerType')
const CLASS = Object.fromEntries([...careers.values()].filter((c) => c.Id !== 999).map((c) => [c.Id, t(c.Type)]))
const synergies = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/dcdl/data/synergies.json'), 'utf8'))
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const synergyByName = new Map(synergies.map((s) => [norm(s.name), s.id]))
const tagTemplates = byId('HeroTagTemplate')
const factions = {}
function faction(tplId) {
  if (!tplId) return null
  const tpl = tagTemplates.get(tplId)
  const name = clean(t(tpl?.Name))
  if (!name) return null
  const id = synergyByName.get(norm(name)) || `tag-${tplId}`
  factions[id] ??= { name, game: tplId }
  return id
}

// ---------- champions + Global Skills ----------
const heroes = byId('Hero')
const heroTags = byId('HeroTag')
const globalByGroup = new Map()
for (const g of rows('HeroGlobalSkill')) {
  if (!globalByGroup.has(g.Group)) globalByGroup.set(g.Group, [])
  globalByGroup.get(g.Group).push(g)
}
const tasks = byId('Task')
function starOf(taskId) {
  const conds = tasks.get(taskId)?.FinishBranch?.flatMap((b) => b.BranchCondition?.FixedCondition ?? []) ?? []
  const c = conds.find((x) => x.Typ === 'TaskHeroStarUp')
  return c ? Number(String(c.Param).split(';')[1]) : null
}
const equipTypeOf = new Map() // career id → armor weight
for (const e of rows('Equip')) for (const c of e.MatchOccupation) equipTypeOf.set(c, e.EquipType)

const champions = {}
for (const f of fs.readdirSync(CHAMP_DIR).filter((x) => x.endsWith('.json')).sort()) {
  const siteId = f.slice(0, -5)
  const gameId = JSON.parse(fs.readFileSync(path.join(CHAMP_DIR, f), 'utf8')).gameId
  const h = heroes.get(gameId)
  if (!h) { warnings.push(`${siteId}: game hero ${gameId} not found`); continue }
  const levels = (globalByGroup.get(h.GlobalSkill) || []).sort((a, b) => a.Level - b.Level)
  const top = levels[levels.length - 1]
  const global = levels.length
    ? {
        // The skill's name is the site's (heros.json globalSkill.name).
        careerClass: top.HeroCareer ? (top.HeroCareer === 999 ? 'All' : CLASS[top.HeroCareer]) : null,
        faction: faction(top.HeroTagTemplate),
        levels: levels.map((r) => {
          let star = starOf(r.Condition)
          if (star == null) warnings.push(`${siteId}: Global Skill level ${r.Level} has no star condition`)
          // The task says star 0 for level 1, but in game level 1 switches on at 3★ White, the
          // same "third star of the tier" as levels 2–5 (Tyler checked, 2026-10-23).
          if (r.Level === 1 && star === 0) star = 3
          return {
            star,
            all: stats([[r.AttrId1, r.AttrValue1], [r.AttrId2, r.AttrValue2]]),
            career: stats([[r.CareerAttrId1, r.CareerAttrValue1], [r.CareerAttrId2, r.CareerAttrValue2]]),
            faction: stats([[r.TagAttrId1, r.TagAttrValue1], [r.TagAttrId2, r.TagAttrValue2]]),
          }
        }),
      }
    : null
  champions[siteId] = {
    gameId,
    mythicPlus: gameId >= 300 && gameId < 1000,
    class: CLASS[h.HeroCareer] ?? null,
    armor: equipTypeOf.get(h.HeroCareer) ?? null,
    factions: (heroTags.get(h.Tag)?.SkillTags ?? []).map(faction).filter(Boolean),
    globalSkill: global,
  }
}
// The Mythic+ version of a champion is the upgraded original: owning it replaces the base one.
for (const [id, c] of Object.entries(champions)) {
  if (!c.mythicPlus) continue
  const base = Object.entries(champions).find(([, o]) => o.gameId === c.gameId - 300)
  if (base) c.upgradeOf = base[0]
}

// ---------- personal research ----------
const techArtName = (id) => artUI.get(id)?.Name
function researchNodes(table, cls, keep) {
  const groups = new Map()
  for (const r of rows(table)) {
    if (r.Classification !== cls) continue
    if (!groups.has(r.Group)) groups.set(r.Group, [])
    groups.get(r.Group).push(r)
  }
  const out = []
  const seen = new Map() // name → times seen, for the tier number
  for (const g of [...groups.keys()].sort((a, b) => a - b)) {
    const lv = groups.get(g).sort((a, b) => a.Level - b.Level).filter((r) => r.Level > 0)
    if (!lv.length) continue
    const node = keep(lv)
    if (!node) continue
    const name = clean(t(lv[0].Name))
    seen.set(name, (seen.get(name) ?? 0) + 1)
    // x / y: the node's column and row in the in-game tree; pre: the nodes it needs first.
    out.push({ id: g, name, tier: seen.get(name), x: lv[0].X, y: lv[0].Y, pre: lv[0].PreTech, ...node })
  }
  // Only keep prerequisites that are in this tree (the rest are outside the Combat tree).
  const ids = new Set(out.map((n) => n.id))
  for (const n of out) n.pre = n.pre.filter((p) => ids.has(p))
  return out
}
const personal = researchNodes('Technology', 2, (lv) => {
  const a = lv[lv.length - 1].Attrs[0]
  if (!a) return null
  const key = attrKey(a.AttrId)
  usedStats.add(key)
  return {
    class: a.HeroCareer === 999 || !a.HeroCareer ? 'All' : CLASS[a.HeroCareer],
    stat: key,
    // Each level row holds the running total, not the step.
    levels: lv.map((r) => r.Attrs[0]?.AttrValue ?? 0),
    icon: artFile(lv[0].Atlas, `research-${techArtName(lv[0].Atlas) || lv[0].Group}`),
  }
})

// ---------- league research ----------
const BATTLE_TYPES = readCfg(src('luaCfg/bin/Attribute.bin')).enums.BattleType
const MODE = { Gve: 'Defeat the Dark Legion', Gvg: 'Guardian Challenge', AllianceBoss: 'Umbral Rift' }
const league = researchNodes('AllianceTechnology', 3, (lv) => {
  const attrs = lv[lv.length - 1].Attrs.filter((a) => a.AttrsType === 'HeroAttr')
  if (!attrs.length) return null
  const first = attrById.get(attrs[0].AttrId)
  const modes = (first?.ConvertBattleType ?? []).map((n) => BATTLE_TYPES[n]).filter((m) => MODE[m])
  if (!modes.length) warnings.push(`league research ${lv[0].Group}: no battle mode for ${first?.Attribute0}`)
  const param = attrs[0].AttrParam
  return {
    class: !param || param === 999 ? 'All' : CLASS[param],
    modes,
    // Every stat of the node converts to its battle stat (e.g. VehicleHeroBattleAttackRatio → AtkBattleRatio).
    stats: attrs.map((a) => {
      const to = attrById.get(attrById.get(a.AttrId)?.ConvertToId)?.Attribute0 || attrKey(a.AttrId)
      usedStats.add(to)
      return { stat: to, levels: lv.map((r) => r.Attrs.find((x) => x.AttrId === a.AttrId)?.AttrValue ?? 0) }
    }),
    icon: artFile(lv[0].Atlas, `league-${techArtName(lv[0].Atlas) || lv[0].Group}`),
  }
})

// ---------- gear ----------
const QUALITY = { White: 'White', WhitePlus: 'White+', Green: 'Green', GreenPlus: 'Green+', Blue: 'Blue', BluePlus: 'Blue+', Purple: 'Purple', PurplePlus: 'Purple+', Orange: 'Orange', OrangePlus: 'Orange+', Red: 'Red', RedPlus: 'Mythic+' }
const equipBase = rows('EquipBase').sort((a, b) => a.LevelMin - b.LevelMin)
const growth = new Map()
for (const r of rows('AttrGrowthNew')) growth.set(r.Id, r)
const attrGroups = byId('AttrGroupNew')
const mainAttr = rows('EquipMainAttr')
const equips = rows('Equip')
const SLOT = { Helmet: 'Helmet', BodySuit: 'Body Armor', Greaves: 'Gloves', Belt: 'Belt', Boots: 'Boots' }
const gearTypes = {}
for (const type of ['HeavyArmor', 'MediumArmor', 'LightArmor']) {
  const sample = equips.find((e) => e.EquipType === type)
  // Named sets look different but share stats; the icon is the same at every quality.
  const sets = []
  for (const helm of equips.filter((e) => e.EquipType === type && e.Part === 'Helmet' && e.Quality === 'RedPlus')) {
    const block = Math.floor((helm.Id - 1) / 50)
    const icons = {}
    for (const part of Object.keys(SLOT)) {
      const piece = equips.find((e) => Math.floor((e.Id - 1) / 50) === block && e.Part === part && e.Quality === 'RedPlus')
      icons[part] = piece ? artFile(piece.Icon, `gear/${(artUI.get(piece.Icon)?.Name || piece.Id).toString().toLowerCase().replace(/[^a-z0-9_]+/g, '-')}`) : null
    }
    sets.push({ name: clean(t(helm.Name)).replace(/\s*-?\s*Helmet$/, ''), icons })
  }
  const slots = {}
  for (const part of Object.keys(SLOT)) {
    const byLevel = new Map()
    for (const m of mainAttr.filter((x) => x.EquipType === type && x.Part === part)) {
      const g = attrGroups.get(m.AttrGroup)?.AttrGrowth
      const base = equipBase.find((b) => b.Quality === m.Quality)
      if (!g || !base) continue
      for (let lv = base.LevelMin; lv <= base.LevelMax; lv++) {
        const r = growth.get(g * 1000 + lv)
        if (r) byLevel.set(lv, r.Attribute)
      }
    }
    const keys = [...new Set([...byLevel.values()].flatMap((list) => list.map((a) => attrKey(a.AttrId))))]
    keys.forEach((k) => usedStats.add(k))
    const levels = [...byLevel.keys()].sort((a, b) => a - b)
    // Levels 1..400 are continuous; 500 (Mythic+) stands alone.
    const run = levels.filter((l) => l <= 400)
    if (run.length !== 400 || run[0] !== 1) warnings.push(`gear ${type} ${part}: levels not 1..400 (${run.length})`)
    slots[part] = {
      name: SLOT[part],
      stats: Object.fromEntries(keys.map((k) => [k, encodeSeries(run.map((l) => byLevel.get(l).find((a) => attrKey(a.AttrId) === k)?.AttrValue ?? 0))])),
      top: Object.fromEntries((byLevel.get(500) ?? []).map((a) => [attrKey(a.AttrId), a.AttrValue])),
    }
  }
  gearTypes[type] = {
    name: { HeavyArmor: 'Heavy', MediumArmor: 'Medium', LightArmor: 'Light' }[type],
    classes: sample.MatchOccupation.map((c) => CLASS[c]),
    sets,
    slots,
  }
}
const gear = {
  qualities: equipBase.map((b) => ({ key: b.Quality, name: QUALITY[b.Quality] ?? b.Quality, min: b.LevelMin, max: b.LevelMax, factionBonus: b.MatchTagBenifit / 100 })),
  types: gearTypes,
}

// ---------- Apokolips ----------
const apok = rows('VehiclesApokolips').sort((a, b) => a.Level - b.Level)
const apokKeys = [...new Set(apok.flatMap((r) => r.Attr.map((a) => attrKey(a.AttrId))))]
apokKeys.forEach((k) => usedStats.add(k))
const apokolips = {
  max: apok[apok.length - 1].Level,
  // Shown in game as tier (level ÷ 1000, I–X) and the tens digit (CastleVehicleHelper.GetApokolipsLevelIndex).
  flat: Object.fromEntries(apokKeys.map((k) => [k, encodeSeries(apok.map((r) => r.Attr.find((a) => attrKey(a.AttrId) === k)?.AttrValue ?? 0))])),
  milestones: apok.filter((r) => r.AttrGroup).map((r) => ({ level: r.Level, stats: stats((attrGroups.get(r.AttrGroup)?.Attribute ?? []).map((a) => [a.AttrId, a.AttrValue])) })),
}

// ---------- Firepit Afterburners ----------
const comps = rows('VehicleComponent').sort((a, b) => a.Level - b.Level)
const partsTable = rows('VehiclesPart')
const PART_NAME = { Weapon: 'Weapon', Cockpit: 'Cockpit', Booster: 'Thruster', Wing: 'Wings', Engine: 'Engine', FuelSystem: 'Fuel System' }
const parts = [1, 2, 3, 4, 5, 6].map((n) => {
  const iconId = comps[0][`PartIcon${n}`]
  const p = partsTable.find((x) => x.Icon === iconId)
  const key = attrKey(comps.find((c) => c[`PartAttr${n}`]?.[0])?.[`PartAttr${n}`]?.[0])
  usedStats.add(key)
  return {
    name: PART_NAME[p?.Part] ?? p?.Part ?? `Part ${n}`,
    stat: key,
    levels: encodeSeries(comps.map((c) => c[`PartAttr${n}`]?.[1] ?? 0)),
    icon: artFile(iconId, `part-${(p?.Part || n).toString().toLowerCase()}`),
  }
})
const modify = rows('VehiclesModify').sort((a, b) => a.Level - b.Level)
const modKeys = [...new Set(modify.flatMap((r) => r.Attr.map((a) => attrKey(a.AttrId))))]
modKeys.forEach((k) => usedStats.add(k))
// A part's ring colour by level (purple → yellow → red), as [first level, colour].
const partQuality = []
for (const c of comps) if (partQuality[partQuality.length - 1]?.[1] !== c.LevelQuliaty) partQuality.push([c.Level, c.LevelQuliaty])
const afterburners = {
  maxPartLevel: comps[comps.length - 1].Level,
  partQuality,
  parts,
  maxCount: modify[modify.length - 1].Level,
  milestones: Object.fromEntries(modKeys.map((k) => [k, encodeSeries(modify.map((r) => r.Attr.find((a) => attrKey(a.AttrId) === k)?.AttrValue ?? 0))])),
}

// ---------- ships ----------
const starsTable = byId('VehiclesStar')
const heroSkills = byId('HeroSkill')
const fillNums = (tpl, row) => clean(tpl).replace(/\{(\d+)\}/g, (m, i) => row[`Num${Number(i) + 1}`] || m)
const QUAL = { Blue: 'Rare', Purple: 'Epic', Orange: 'Legendary', Red: 'Mythic' }
const ships = rows('Vehicles').filter((v) => v.Show && v.InitStar).sort((a, b) => b.Order - a.Order).map((v) => {
  const steps = []
  for (let s = starsTable.get(v.InitStar); s; s = s.NextStar ? starsTable.get(s.NextStar) : null) steps.push(s)
  return {
    id: v.Id,
    name: clean(t(v.Name)),
    quality: QUAL[v.Quality] ?? v.Quality,
    icon: artFile(v.ShowPicture, `ship-${v.Id}`),
    stars: steps.map((s) => {
      const sk = heroSkills.get(s.Skills)
      return {
        stats: stats([s.Attr]),
        skill: sk ? { name: clean(t(sk.Name)), text: fillNums(t(sk.Desc), sk) } : null,
      }
    }),
  }
})

// ---------- VIP ----------
const vipBuffs = byId('VipBuff')
const vip = rows('VipSystem').sort((a, b) => a.Id - b.Id).map((v) => ({
  level: v.Id,
  points: v.TargetVipPoint,
  stats: stats(v.VipBuff.map((id) => vipBuffs.get(id)).filter((b) => b?.Type === 'Attr' && b.GroupType === 'Hero').map((b) => [b.Attr.AttrId, b.Attr.AttrValue])),
}))

// ---------- room skins ----------
const rooms = rows('AppearanceDecorate').filter((d) => d.AddAttrGroupNewID).map((d) => ({
  id: `room-${d.Id}`,
  name: clean(t(d.DecorateName)),
  room: clean(t(`base_building_${String(d.Note).toLowerCase().replace(/\d+$/, '')}_name`)) || d.Note.replace(/\d+$/, '').replace(/([a-z])([A-Z])/g, '$1 $2'),
  owned: d.AddAttrMethod === 'Have',
  icon: artFile(d.DecorateUI, `room-${d.Id}`),
  stats: stats((attrGroups.get(d.AddAttrGroupNewID)?.Attribute ?? []).map((a) => [a.AttrId, a.AttrValue])),
}))

// ---------- UI art for the hangar and gear pickers ----------
const UI_ART = [
  'icon_vehicle_apokolips', 'img_vehicle_apokolips_lv_bar',
  'img_vehicle_refit_bg_purple', 'img_vehicle_refit_bg_yellow', 'img_vehicle_refit_bg_red',
  'img_hero_equip_preview_head', 'img_hero_equip_preview_chest', 'img_hero_equip_preview_arm', 'img_hero_equip_preview_belt', 'img_hero_equip_preview_leg',
]
// These sprites are loaded by name in the Lua, so they have no ArtResourceUI row: copy by file name.
for (const n of UI_ART) {
  const from = images.get(n.toLowerCase())
  const dest = path.join(ROOT, ART_DIR, 'ui', `${n}.png`)
  if (!from) { if (!fs.existsSync(dest)) missingArt.push(`ui ${n}`); continue }
  if (!fs.existsSync(dest) || hash(dest) !== hash(from)) artCopies.push([dest, from])
}

// ---------- write ----------
const statDict = Object.fromEntries([...usedStats].filter(Boolean).sort().map((k) => [k, statInfo(k)]))
const out = {
  modes: MODE,
  stats: statDict,
  factions,
  champions,
  research: personal,
  league,
  gear,
  apokolips,
  afterburners,
  ships,
  vip,
  rooms,
}
// Indented for readable diffs, but arrays of numbers stay on one line.
const json = JSON.stringify(out, null, 1).replace(/\[\s*(-?[\d.]+(?:,\s*-?[\d.]+)*)\s*\]/g, (m, inner) => `[${inner.replace(/\s+/g, '')}]`) + '\n'
const before = fs.existsSync(DATA_FILE) ? fs.readFileSync(DATA_FILE, 'utf8') : ''
const changed = before !== json

line(`Champions: ${Object.keys(champions).length} (${Object.values(champions).filter((c) => c.globalSkill).length} with a Global Skill)`)
line(`Personal research: ${personal.length} combat nodes · League research: ${league.length} combat nodes`)
line(`Gear: ${Object.keys(gearTypes).length} armor weights × ${Object.keys(SLOT).length} slots · ${gear.qualities.length} qualities`)
line(`Apokolips: levels 0–${apokolips.max}, ${apokolips.milestones.length} milestones · Afterburners: ${parts.length} parts to Lv ${afterburners.maxPartLevel}, milestones to ${afterburners.maxCount}`)
line(`Ships: ${ships.map((s) => s.name).join(', ')}`)
line(`VIP: ${vip.filter((v) => v.stats.length).length} levels with champion stats · Room skins: ${rooms.map((r) => r.name).join(', ')}`)
line(`Size: ${(json.length / 1024).toFixed(1)} KB`)
if (missingArt.length) line(`Art not found in the newest rip: ${missingArt.join(', ')}`)
for (const w of [...new Set(warnings)]) line(`WARNING ${w}`)

if (!WRITE) {
  line(`Would write ${path.relative(ROOT, DATA_FILE)}${changed ? '' : ' (unchanged)'}${artCopies.length ? ` and ${artCopies.length} image(s) in ${ART_DIR}` : ''}. Re-run with --write.`)
  process.exit(0)
}
if (changed) fs.writeFileSync(DATA_FILE, json)
for (const [dest] of artCopies) fs.mkdirSync(path.dirname(dest), { recursive: true })
for (const [dest, from] of artCopies) fs.copyFileSync(from, dest)
line(`Wrote ${changed ? path.relative(ROOT, DATA_FILE) : 'no data changes'}${artCopies.length ? ` and ${artCopies.length} image(s) in ${ART_DIR}` : ''}. Commit afterwards.`)
