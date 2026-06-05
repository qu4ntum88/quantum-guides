import type { GfHero } from '../components/GfHeroBox'

export type StarRequirement = {
  description: string
  canEvaluate: boolean
  evaluate?: (team: GfHero[]) => boolean
  autoFill?: boolean
}

export type StageData = {
  stageNumber: number
  isBoss: boolean
  requirements: [StarRequirement, StarRequirement, StarRequirement]
}

export type ChapterData = {
  faction: string
  factionKey: string
  chapterNumber: number
  stages: StageData[]
}

// ── Evaluator helpers ─────────────────────────────────────────────────────────

function countArch(team: GfHero[], arch: string) {
  return team.filter(h => h.archetype?.toLowerCase() === arch.toLowerCase()).length
}
function countAff(team: GfHero[], aff: string) {
  return team.filter(h => h.affinity?.toLowerCase() === aff.toLowerCase()).length
}
function countFac(team: GfHero[], fac: string) {
  return team.filter(h => h.faction?.toLowerCase() === fac.toLowerCase()).length
}
function countAlleg(team: GfHero[], alleg: string) {
  return team.filter(h => h.allegiance?.toLowerCase() === alleg.toLowerCase()).length
}
function countFacs(team: GfHero[], facs: string[]) {
  return team.filter(h => h.faction && facs.some(f => h.faction!.toLowerCase() === f.toLowerCase())).length
}
function countRar(team: GfHero[], rarity: string) {
  return team.filter(h => h.rarity?.toLowerCase() === rarity.toLowerCase()).length
}
function countAffArch(team: GfHero[], aff: string, arch: string) {
  return team.filter(
    h => h.affinity?.toLowerCase() === aff.toLowerCase() && h.archetype?.toLowerCase() === arch.toLowerCase()
  ).length
}
function onlyAff(team: GfHero[], aff: string) {
  return team.length > 0 && team.every(h => h.affinity?.toLowerCase() === aff.toLowerCase())
}
function onlyAlleg(team: GfHero[], alleg: string) {
  return team.length > 0 && team.every(h => h.allegiance?.toLowerCase() === alleg.toLowerCase())
}
function onlyArch(team: GfHero[], arch: string) {
  return team.length > 0 && team.every(h => h.archetype?.toLowerCase() === arch.toLowerCase())
}
function onlyFac(team: GfHero[], fac: string) {
  return team.length > 0 && team.every(h => h.faction?.toLowerCase() === fac.toLowerCase())
}
function noArch(team: GfHero[], arch: string) {
  return team.every(h => h.archetype?.toLowerCase() !== arch.toLowerCase())
}
function oneOfEachAff(team: GfHero[]) {
  return ['cunning', 'eternal', 'strength', 'wisdom'].every(a =>
    team.some(h => h.affinity?.toLowerCase() === a)
  )
}
function hasRarities(team: GfHero[], rarities: string[]) {
  return rarities.every(r => team.some(h => h.rarity?.toLowerCase() === r.toLowerCase()))
}
function hasName(team: GfHero[], partial: string) {
  return team.some(h => h.name.toLowerCase().includes(partial.toLowerCase()))
}
function allSameArch(team: GfHero[]) {
  if (team.length === 0) return false
  const first = team[0].archetype?.toLowerCase()
  return first != null && team.every(h => h.archetype?.toLowerCase() === first)
}
function maxOnePerArch(team: GfHero[]) {
  const archs = ['brawler', 'defender', 'disruptor', 'invoker', 'slayer']
  return archs.every(a => team.filter(h => h.archetype?.toLowerCase() === a).length <= 1)
}

// ── Requirement factory helpers ───────────────────────────────────────────────

function gameplay(description: string): StarRequirement {
  return { description, canEvaluate: false }
}
function comp(description: string, evaluate: (team: GfHero[]) => boolean): StarRequirement {
  return { description, canEvaluate: true, evaluate }
}

const CLEAR: StarRequirement  = { description: 'Clear the stage',          canEvaluate: false, autoFill: true }
const TURNS20: StarRequirement = { description: 'Win in 20 turns or less', canEvaluate: false, autoFill: true }

// ── Story Mode ────────────────────────────────────────────────────────────────
// Stages 1-9 all share the same 3 requirements per chapter.
// Stage 10 (boss) shares stars 1-2 but has a different star 3.

function storyChapter(
  faction: string,
  factionKey: string,
  chapterNumber: number,
  regularR3: StarRequirement,
  bossR3: StarRequirement,
): ChapterData {
  const regularStages: StageData[] = Array.from({ length: 9 }, (_, i) => ({
    stageNumber: i + 1,
    isBoss: false,
    requirements: [CLEAR, TURNS20, regularR3] as [StarRequirement, StarRequirement, StarRequirement],
  }))
  const bossStage: StageData = {
    stageNumber: 10,
    isBoss: true,
    requirements: [CLEAR, TURNS20, bossR3],
  }
  return { faction, factionKey, chapterNumber, stages: [...regularStages, bossStage] }
}

export const STORY_CHAPTERS: ChapterData[] = [
  storyChapter('Avalon',   'AVALON',   1,
    comp('Win with 1+ Strength hero',          t => countAff(t, 'strength') >= 1),
    comp('Win with 2 Tian or Vyraj heroes',    t => countFacs(t, ['tian', 'vyraj']) >= 2),
  ),
  storyChapter('Asgard',   'ASGARD',   2,
    comp('Win with 2+ Slayers or Brawlers',    t => (countArch(t, 'slayer') + countArch(t, 'brawler')) >= 2),
    comp('Win with 2 Olympus or Omeyocan heroes', t => countFacs(t, ['olympus', 'omeyocan']) >= 2),
  ),
  storyChapter('Vyraj',    'VYRAJ',    3,
    comp('Win with only Chaos heroes',         t => onlyAlleg(t, 'chaos')),
    comp('Win with 2 Avalon or Izumo heroes',  t => countFacs(t, ['avalon', 'izumo']) >= 2),
  ),
  storyChapter('Olympus',  'OLYMPUS',  4,
    comp('Win with no Slayers',                t => noArch(t, 'slayer')),
    comp('Win with 2 Asgard or Ekur heroes',   t => countFacs(t, ['asgard', 'ekur']) >= 2),
  ),
  storyChapter('Aaru',     'AARU',     5,
    comp('Win with 1 hero of each affinity',   t => oneOfEachAff(t)),
    comp('Win with 2 Tian or Omeyocan heroes', t => countFacs(t, ['tian', 'omeyocan']) >= 2),
  ),
  storyChapter('Izumo',    'IZUMO',    6,
    comp('Win with 2+ Invokers',               t => countArch(t, 'invoker') >= 2),
    comp('Win with 2 Ekur or Vyraj heroes',    t => countFacs(t, ['ekur', 'vyraj']) >= 2),
  ),
  storyChapter('Omeyocan', 'OMEYOCAN', 7,
    comp('Win with 2+ Slayers',                t => countArch(t, 'slayer') >= 2),
    comp('Win with 2 Asgard or Aaru heroes',   t => countFacs(t, ['asgard', 'aaru']) >= 2),
  ),
  storyChapter('Tian',     'TIAN',     8,
    comp('Win with Order only heroes',         t => onlyAlleg(t, 'order')),
    comp('Win with 2 Avalon or Aaru heroes',   t => countFacs(t, ['avalon', 'aaru']) >= 2),
  ),
  storyChapter('Ekur',     'EKUR',     9,
    comp('Win with 2+ Disruptors',             t => countArch(t, 'disruptor') >= 2),
    comp('Win with 2 Avalon or Aaru heroes',   t => countFacs(t, ['avalon', 'aaru']) >= 2),
  ),
]

// ── Adventure Mode ────────────────────────────────────────────────────────────

export const ADVENTURE_CHAPTERS: ChapterData[] = [
  // 1. Avalon — Star 2: Only Wisdom heroes
  {
    faction: 'Avalon', factionKey: 'AVALON', chapterNumber: 1,
    stages: [
      { stageNumber: 1,  isBoss: false, requirements: [CLEAR, comp('Only Wisdom affinity heroes',   t => onlyAff(t, 'wisdom')), comp('3 Invokers and 1 Slayer',                                      t => countArch(t, 'invoker') >= 3 && countArch(t, 'slayer') >= 1)] },
      { stageNumber: 2,  isBoss: false, requirements: [CLEAR, comp('Only Wisdom affinity heroes',   t => onlyAff(t, 'wisdom')), gameplay('Place Protect and Radiance 6 times')] },
      { stageNumber: 3,  isBoss: false, requirements: [CLEAR, comp('Only Wisdom affinity heroes',   t => onlyAff(t, 'wisdom')), gameplay('Apply disables 10 times')] },
      { stageNumber: 4,  isBoss: false, requirements: [CLEAR, comp('Only Wisdom affinity heroes',   t => onlyAff(t, 'wisdom')), comp('1 Epic, 1 Rare, 1 Uncommon, 1 Common',                         t => hasRarities(t, ['epic', 'rare', 'uncommon', 'common']))] },
      { stageNumber: 5,  isBoss: false, requirements: [CLEAR, comp('Only Wisdom affinity heroes',   t => onlyAff(t, 'wisdom')), comp('4 Avalon heroes',                                              t => countFac(t, 'avalon') >= 4)] },
      { stageNumber: 6,  isBoss: false, requirements: [CLEAR, comp('Only Wisdom affinity heroes',   t => onlyAff(t, 'wisdom')), gameplay('Apply Hex I or II 12 times')] },
      { stageNumber: 7,  isBoss: false, requirements: [CLEAR, comp('Only Wisdom affinity heroes',   t => onlyAff(t, 'wisdom')), gameplay('Use Core ability 12 times')] },
      { stageNumber: 8,  isBoss: false, requirements: [CLEAR, comp('Only Wisdom affinity heroes',   t => onlyAff(t, 'wisdom')), gameplay('Place Res Up and Res Down 8 times')] },
      { stageNumber: 9,  isBoss: false, requirements: [CLEAR, comp('Only Wisdom affinity heroes',   t => onlyAff(t, 'wisdom')), comp('3 Tian or Vyraj heroes',                                       t => countFacs(t, ['tian', 'vyraj']) >= 3)] },
      { stageNumber: 10, isBoss: true,  requirements: [CLEAR, comp('Only Wisdom affinity heroes',   t => onlyAff(t, 'wisdom')), comp('4 Eternal Slayers (Gogmaggog boss)',                           t => countAffArch(t, 'eternal', 'slayer') >= 4)] },
    ],
  },
  // 2. Asgard — Star 2: All Brawlers
  {
    faction: 'Asgard', factionKey: 'ASGARD', chapterNumber: 2,
    stages: [
      { stageNumber: 1,  isBoss: false, requirements: [CLEAR, comp('All Brawlers',                  t => onlyArch(t, 'brawler')), comp('Only Strength affinity',                                     t => onlyAff(t, 'strength'))] },
      { stageNumber: 2,  isBoss: false, requirements: [CLEAR, comp('All Brawlers',                  t => onlyArch(t, 'brawler')), gameplay('Apply Blaze 10 times')] },
      { stageNumber: 3,  isBoss: false, requirements: [CLEAR, comp('All Brawlers',                  t => onlyArch(t, 'brawler')), gameplay('Use no Core abilities')] },
      { stageNumber: 4,  isBoss: false, requirements: [CLEAR, comp('All Brawlers',                  t => onlyArch(t, 'brawler')), gameplay('Apply no stat debuffs')] },
      { stageNumber: 5,  isBoss: false, requirements: [CLEAR, comp('All Brawlers',                  t => onlyArch(t, 'brawler')), gameplay('Apply ATK Up and Sharpen 16 times')] },
      { stageNumber: 6,  isBoss: false, requirements: [CLEAR, comp('All Brawlers',                  t => onlyArch(t, 'brawler')), comp('4 Asgard heroes',                                            t => countFac(t, 'asgard') >= 4)] },
      { stageNumber: 7,  isBoss: false, requirements: [CLEAR, comp('All Brawlers',                  t => onlyArch(t, 'brawler')), comp('Exactly 4 heroes (+ apply 10 buffs)',                        t => t.length === 4)] },
      { stageNumber: 8,  isBoss: false, requirements: [CLEAR, comp('All Brawlers',                  t => onlyArch(t, 'brawler')), gameplay('Apply 20 debuffs')] },
      { stageNumber: 9,  isBoss: false, requirements: [CLEAR, comp('All Brawlers',                  t => onlyArch(t, 'brawler')), comp('3 Omeyocan or Olympus heroes',                               t => countFacs(t, ['omeyocan', 'olympus']) >= 3)] },
      { stageNumber: 10, isBoss: true,  requirements: [CLEAR, comp('All Brawlers',                  t => onlyArch(t, 'brawler')), gameplay('Use Mend 5 times (Grendel boss)')] },
    ],
  },
  // 3. Vyraj — Star 2: Only Chaos heroes
  {
    faction: 'Vyraj', factionKey: 'VYRAJ', chapterNumber: 3,
    stages: [
      { stageNumber: 1,  isBoss: false, requirements: [CLEAR, comp('Only Chaos heroes',             t => onlyAlleg(t, 'chaos')), gameplay('Clear without applying control effects')] },
      { stageNumber: 2,  isBoss: false, requirements: [CLEAR, comp('Only Chaos heroes',             t => onlyAlleg(t, 'chaos')), gameplay('Apply Acid, Bleed, and Blaze 8 times')] },
      { stageNumber: 3,  isBoss: false, requirements: [CLEAR, comp('Only Chaos heroes',             t => onlyAlleg(t, 'chaos')), gameplay('Apply no healing effects')] },
      { stageNumber: 4,  isBoss: false, requirements: [CLEAR, comp('Only Chaos heroes',             t => onlyAlleg(t, 'chaos')), gameplay('Place Retaliate on allies 6 times')] },
      { stageNumber: 5,  isBoss: false, requirements: [CLEAR, comp('Only Chaos heroes',             t => onlyAlleg(t, 'chaos')), comp('4 Vyraj heroes',                                              t => countFac(t, 'vyraj') >= 4)] },
      { stageNumber: 6,  isBoss: false, requirements: [CLEAR, comp('Only Chaos heroes',             t => onlyAlleg(t, 'chaos')), gameplay('Apply Acid 10 times')] },
      { stageNumber: 7,  isBoss: false, requirements: [CLEAR, comp('Only Chaos heroes',             t => onlyAlleg(t, 'chaos')), comp('Bring only 2 heroes',                                        t => t.length === 2)] },
      { stageNumber: 8,  isBoss: false, requirements: [CLEAR, comp('Only Chaos heroes',             t => onlyAlleg(t, 'chaos')), gameplay('Place Aetherburn and Blaze')] },
      { stageNumber: 9,  isBoss: false, requirements: [CLEAR, comp('Only Chaos heroes',             t => onlyAlleg(t, 'chaos')), comp('3 Avalon or Izumo heroes',                                   t => countFacs(t, ['avalon', 'izumo']) >= 3)] },
      { stageNumber: 10, isBoss: true,  requirements: [CLEAR, comp('Only Chaos heroes',             t => onlyAlleg(t, 'chaos')), gameplay('Place Taunt 10 times (Koshchei boss)')] },
    ],
  },
  // 4. Olympus — Star 2: No Disruptors
  {
    faction: 'Olympus', factionKey: 'OLYMPUS', chapterNumber: 4,
    stages: [
      { stageNumber: 1,  isBoss: false, requirements: [CLEAR, comp('No Disruptors',                 t => noArch(t, 'disruptor')), gameplay('Win in under 40 turns with 4 heroes alive')] },
      { stageNumber: 2,  isBoss: false, requirements: [CLEAR, comp('No Disruptors',                 t => noArch(t, 'disruptor')), gameplay('Heal 20 times')] },
      { stageNumber: 3,  isBoss: false, requirements: [CLEAR, comp('No Disruptors',                 t => noArch(t, 'disruptor')), comp('1 Epic hero, no Legendaries',                                t => countRar(t, 'epic') >= 1 && countRar(t, 'legendary') === 0)] },
      { stageNumber: 4,  isBoss: false, requirements: [CLEAR, comp('No Disruptors',                 t => noArch(t, 'disruptor')), gameplay('All heroes survive (no Phoenix or Immortal effects)')] },
      { stageNumber: 5,  isBoss: false, requirements: [CLEAR, comp('No Disruptors',                 t => noArch(t, 'disruptor')), comp('4 Olympus heroes',                                          t => countFac(t, 'olympus') >= 4)] },
      { stageNumber: 6,  isBoss: false, requirements: [CLEAR, comp('No Disruptors',                 t => noArch(t, 'disruptor')), gameplay('Use no Ultimate abilities')] },
      { stageNumber: 7,  isBoss: false, requirements: [CLEAR, comp('No Disruptors',                 t => noArch(t, 'disruptor')), gameplay('Place Blunt II 5 times')] },
      { stageNumber: 8,  isBoss: false, requirements: [CLEAR, comp('No Disruptors',                 t => noArch(t, 'disruptor')), comp('No more than 2 Legendaries',                                 t => countRar(t, 'legendary') <= 2)] },
      { stageNumber: 9,  isBoss: false, requirements: [CLEAR, comp('No Disruptors',                 t => noArch(t, 'disruptor')), comp('3 Asgard or Ekur heroes',                                   t => countFacs(t, ['asgard', 'ekur']) >= 3)] },
      { stageNumber: 10, isBoss: true,  requirements: [CLEAR, comp('No Disruptors',                 t => noArch(t, 'disruptor')), gameplay('Freeze 10 times (Hades boss)')] },
    ],
  },
  // 5. Aaru — Star 2: 1 hero of each affinity
  {
    faction: 'Aaru', factionKey: 'AARU', chapterNumber: 5,
    stages: [
      { stageNumber: 1,  isBoss: false, requirements: [CLEAR, comp('1 hero of each affinity',       t => oneOfEachAff(t)), gameplay('Apply DEF Up I and DEF Down I 8 times')] },
      { stageNumber: 2,  isBoss: false, requirements: [CLEAR, comp('1 hero of each affinity',       t => oneOfEachAff(t)), comp('2 Disruptors and 2 Slayers',                                       t => countArch(t, 'disruptor') >= 2 && countArch(t, 'slayer') >= 2)] },
      { stageNumber: 3,  isBoss: false, requirements: [CLEAR, comp('1 hero of each affinity',       t => oneOfEachAff(t)), gameplay('Apply no damaging debuffs (no Bleed / Acid / Blaze)')] },
      { stageNumber: 4,  isBoss: false, requirements: [CLEAR, comp('1 hero of each affinity',       t => oneOfEachAff(t)), comp('No more than 1 hero per archetype',                                 t => maxOnePerArch(t))] },
      { stageNumber: 5,  isBoss: false, requirements: [CLEAR, comp('1 hero of each affinity',       t => oneOfEachAff(t)), comp('4 Aaru heroes',                                                    t => countFac(t, 'aaru') >= 4)] },
      { stageNumber: 6,  isBoss: false, requirements: [CLEAR, comp('1 hero of each affinity',       t => oneOfEachAff(t)), comp('2 Rare and 2 Epic heroes',                                         t => countRar(t, 'rare') >= 2 && countRar(t, 'epic') >= 2)] },
      { stageNumber: 7,  isBoss: false, requirements: [CLEAR, comp('1 hero of each affinity',       t => oneOfEachAff(t)), comp('Bring only 3 heroes',                                              t => t.length === 3)] },
      { stageNumber: 8,  isBoss: false, requirements: [CLEAR, comp('1 hero of each affinity',       t => oneOfEachAff(t)), gameplay('Apply 3 Tier II status effects')] },
      { stageNumber: 9,  isBoss: false, requirements: [CLEAR, comp('1 hero of each affinity',       t => oneOfEachAff(t)), comp('3 Tian or Omeyocan heroes',                                        t => countFacs(t, ['tian', 'omeyocan']) >= 3)] },
      { stageNumber: 10, isBoss: true,  requirements: [CLEAR, comp('1 hero of each affinity',       t => oneOfEachAff(t)), gameplay('Apply FTH Up and FTH Down 10 times (Sphinx boss)')] },
    ],
  },
  // 6. Izumo — Star 2: 3 Invokers
  {
    faction: 'Izumo', factionKey: 'IZUMO', chapterNumber: 6,
    stages: [
      { stageNumber: 1,  isBoss: false, requirements: [CLEAR, comp('3+ Invokers',                   t => countArch(t, 'invoker') >= 3), gameplay('Apply Charm 4 times')] },
      { stageNumber: 2,  isBoss: false, requirements: [CLEAR, comp('3+ Invokers',                   t => countArch(t, 'invoker') >= 3), comp('No Eternal heroes',                                    t => t.every(h => h.affinity?.toLowerCase() !== 'eternal'))] },
      { stageNumber: 3,  isBoss: false, requirements: [CLEAR, comp('3+ Invokers',                   t => countArch(t, 'invoker') >= 3), gameplay('Cast fewer than 6 Ultimates')] },
      { stageNumber: 4,  isBoss: false, requirements: [CLEAR, comp('3+ Invokers',                   t => countArch(t, 'invoker') >= 3), gameplay('Apply no stat buffs (known bug)')] },
      { stageNumber: 5,  isBoss: false, requirements: [CLEAR, comp('3+ Invokers',                   t => countArch(t, 'invoker') >= 3), gameplay('Apply no debuffs — up to 5 heroes allowed (known bug)')] },
      { stageNumber: 6,  isBoss: false, requirements: [CLEAR, comp('3+ Invokers',                   t => countArch(t, 'invoker') >= 3), comp('4 Izumo heroes',                                       t => countFac(t, 'izumo') >= 4)] },
      { stageNumber: 7,  isBoss: false, requirements: [CLEAR, comp('3+ Invokers',                   t => countArch(t, 'invoker') >= 3), comp('2 Chaos and 2 Order heroes',                           t => countAlleg(t, 'chaos') >= 2 && countAlleg(t, 'order') >= 2)] },
      { stageNumber: 8,  isBoss: false, requirements: [CLEAR, comp('3+ Invokers',                   t => countArch(t, 'invoker') >= 3), gameplay('Apply Mend or Drain 12 times')] },
      { stageNumber: 9,  isBoss: false, requirements: [CLEAR, comp('3+ Invokers',                   t => countArch(t, 'invoker') >= 3), comp('3 Ekur or Vyraj heroes',                               t => countFacs(t, ['ekur', 'vyraj']) >= 3)] },
      { stageNumber: 10, isBoss: true,  requirements: [CLEAR, comp('3+ Invokers',                   t => countArch(t, 'invoker') >= 3), gameplay('Block debuffs 6 times (Raijin boss)')] },
    ],
  },
  // 7. Omeyocan — Star 2: 3 Slayers
  {
    faction: 'Omeyocan', factionKey: 'OMEYOCAN', chapterNumber: 7,
    stages: [
      { stageNumber: 1,  isBoss: false, requirements: [CLEAR, comp('3+ Slayers',                    t => countArch(t, 'slayer') >= 3), comp('Bring only 1 hero',                                     t => t.length === 1)] },
      { stageNumber: 2,  isBoss: false, requirements: [CLEAR, comp('3+ Slayers',                    t => countArch(t, 'slayer') >= 3), gameplay('Apply 10 Bleeds')] },
      { stageNumber: 3,  isBoss: false, requirements: [CLEAR, comp('3+ Slayers',                    t => countArch(t, 'slayer') >= 3), gameplay('Use more than 5 Ultimates')] },
      { stageNumber: 4,  isBoss: false, requirements: [CLEAR, comp('3+ Slayers',                    t => countArch(t, 'slayer') >= 3), gameplay('Apply no buffs (known bug)')] },
      { stageNumber: 5,  isBoss: false, requirements: [CLEAR, comp('3+ Slayers',                    t => countArch(t, 'slayer') >= 3), comp('4 Omeyocan heroes',                                     t => countFac(t, 'omeyocan') >= 4)] },
      { stageNumber: 6,  isBoss: false, requirements: [CLEAR, comp('3+ Slayers',                    t => countArch(t, 'slayer') >= 3), gameplay('Place Curse 10 times')] },
      { stageNumber: 7,  isBoss: false, requirements: [CLEAR, comp('3+ Slayers',                    t => countArch(t, 'slayer') >= 3), gameplay('Apply only DoT effects (nothing else)')] },
      { stageNumber: 8,  isBoss: false, requirements: [CLEAR, comp('3+ Slayers',                    t => countArch(t, 'slayer') >= 3), gameplay('Place Confuse 6 times')] },
      { stageNumber: 9,  isBoss: false, requirements: [CLEAR, comp('3+ Slayers',                    t => countArch(t, 'slayer') >= 3), comp('3 Aaru or Asgard heroes',                               t => countFacs(t, ['aaru', 'asgard']) >= 3)] },
      { stageNumber: 10, isBoss: true,  requirements: [CLEAR, comp('3+ Slayers',                    t => countArch(t, 'slayer') >= 3), comp('Include Drac or Vampir (Camozotz boss)',                 t => hasName(t, 'drac') || hasName(t, 'vampir'))] },
    ],
  },
  // 8. Tian — Star 2: Order heroes only
  {
    faction: 'Tian', factionKey: 'TIAN', chapterNumber: 8,
    stages: [
      { stageNumber: 1,  isBoss: false, requirements: [CLEAR, comp('Order heroes only',             t => onlyAlleg(t, 'order')), gameplay('Use no Shield or Barrier (known bug)')] },
      { stageNumber: 2,  isBoss: false, requirements: [CLEAR, comp('Order heroes only',             t => onlyAlleg(t, 'order')), comp('All Order heroes',                                            t => onlyAlleg(t, 'order'))] },
      { stageNumber: 3,  isBoss: false, requirements: [CLEAR, comp('Order heroes only',             t => onlyAlleg(t, 'order')), comp('Only Xoc, Ramses, and Guan Yu',                              t => t.length > 0 && t.every(h => ['xoc', 'ramses', 'guan yu'].some(n => h.name.toLowerCase().includes(n))))] },
      { stageNumber: 4,  isBoss: false, requirements: [CLEAR, comp('Order heroes only',             t => onlyAlleg(t, 'order')), comp('Only Eternal affinity heroes',                                t => onlyAff(t, 'eternal'))] },
      { stageNumber: 5,  isBoss: false, requirements: [CLEAR, comp('Order heroes only',             t => onlyAlleg(t, 'order')), comp('Only Tian heroes',                                           t => onlyFac(t, 'tian'))] },
      { stageNumber: 6,  isBoss: false, requirements: [CLEAR, comp('Order heroes only',             t => onlyAlleg(t, 'order')), gameplay('Apply 5 Locks')] },
      { stageNumber: 7,  isBoss: false, requirements: [CLEAR, comp('Order heroes only',             t => onlyAlleg(t, 'order')), comp('Exactly 3 Epic heroes',                                      t => t.length === 3 && t.every(h => h.rarity === 'Epic'))] },
      { stageNumber: 8,  isBoss: false, requirements: [CLEAR, comp('Order heroes only',             t => onlyAlleg(t, 'order')), gameplay('Apply Vanish 6 times')] },
      { stageNumber: 9,  isBoss: false, requirements: [CLEAR, comp('Order heroes only',             t => onlyAlleg(t, 'order')), comp('3 Avalon or Aaru heroes',                                    t => countFacs(t, ['avalon', 'aaru']) >= 3)] },
      { stageNumber: 10, isBoss: true,  requirements: [CLEAR, comp('Order heroes only',             t => onlyAlleg(t, 'order')), comp('2+ Uncommon heroes, no deaths',                             t => countRar(t, 'uncommon') >= 2)] },
    ],
  },
  // 9. Ekur — Star 2: 3 Disruptors
  {
    faction: 'Ekur', factionKey: 'EKUR', chapterNumber: 9,
    stages: [
      { stageNumber: 1,  isBoss: false, requirements: [CLEAR, comp('3+ Disruptors',                 t => countArch(t, 'disruptor') >= 3), comp('All Eternal affinity + 1 Legendary',                t => onlyAff(t, 'eternal') && countRar(t, 'legendary') >= 1)] },
      { stageNumber: 2,  isBoss: false, requirements: [CLEAR, comp('3+ Disruptors',                 t => countArch(t, 'disruptor') >= 3), gameplay('Requirement not yet documented')] },
      { stageNumber: 3,  isBoss: false, requirements: [CLEAR, comp('3+ Disruptors',                 t => countArch(t, 'disruptor') >= 3), comp('Only Defenders',                                    t => onlyArch(t, 'defender'))] },
      { stageNumber: 4,  isBoss: false, requirements: [CLEAR, comp('3+ Disruptors',                 t => countArch(t, 'disruptor') >= 3), comp('Only Cunning affinity',                             t => onlyAff(t, 'cunning'))] },
      { stageNumber: 5,  isBoss: false, requirements: [CLEAR, comp('3+ Disruptors',                 t => countArch(t, 'disruptor') >= 3), comp('4 Ekur heroes',                                     t => countFac(t, 'ekur') >= 4)] },
      { stageNumber: 6,  isBoss: false, requirements: [CLEAR, comp('3+ Disruptors',                 t => countArch(t, 'disruptor') >= 3), gameplay('Apply Barrier 12 times')] },
      { stageNumber: 7,  isBoss: false, requirements: [CLEAR, comp('3+ Disruptors',                 t => countArch(t, 'disruptor') >= 3), comp('All heroes share the same archetype',               t => allSameArch(t))] },
      { stageNumber: 8,  isBoss: false, requirements: [CLEAR, comp('3+ Disruptors',                 t => countArch(t, 'disruptor') >= 3), gameplay('Apply SPD Up and SPD Down 6 times')] },
      { stageNumber: 9,  isBoss: false, requirements: [CLEAR, comp('3+ Disruptors',                 t => countArch(t, 'disruptor') >= 3), comp('3 Olympus or Izumo heroes',                         t => countFacs(t, ['olympus', 'izumo']) >= 3)] },
      { stageNumber: 10, isBoss: true,  requirements: [CLEAR, comp('3+ Disruptors',                 t => countArch(t, 'disruptor') >= 3), comp('Include Gogmaggog and Cait Sith (Marduk boss)',     t => (hasName(t, 'gogma') || hasName(t, 'gogmaggog')) && hasName(t, 'cait sith'))] },
    ],
  },
]
