import { prisma } from "./prisma"
import { recalcPointsTable } from "./stats"
import { MATCH_CONFIG } from "./config"

export interface SeasonQuizQuestion {
  question: string
  options: string[]
  correctAnswer: string
  position: number
  pointValue: number
}

interface TeamInfo {
  id: string
  name: string
  shortName: string
  color: string
}

interface Facts {
  teams: TeamInfo[]
  champion: TeamInfo | null
  runnerUp: TeamInfo | null
  topRunScorer: { name: string; teamName: string; runs: number } | null
  topWicketTaker: { name: string; teamName: string; wickets: number } | null
  mostSixes: { name: string; teamName: string; sixes: number } | null
  mostFours: { name: string; teamName: string; fours: number } | null
  highestIndividual: { name: string; teamName: string; runs: number; notOut: boolean } | null
  bestBowling: { name: string; teamName: string; wickets: number; runs: number } | null
  highestTeamTotal: { teamName: string; runs: number; wickets: number; overs: string } | null
  lowestTeamTotal: { teamName: string; runs: number; wickets: number; overs: string } | null
  biggestWinRuns: { teamName: string; margin: number; label: string } | null
  biggestWinWickets: { teamName: string; margin: number; label: string } | null
  mostPotm: { name: string; teamName: string; count: number } | null
  mostFifties: { name: string; teamName: string; count: number } | null
  mostHundreds: { name: string; teamName: string; count: number } | null
  mostCatches: { name: string; teamName: string; count: number } | null
  mostStumpings: { name: string; teamName: string; count: number } | null
  totalMatches: number
  totalRuns: number
  totalSixes: number
  totalFours: number
  totalWickets: number
  totalBalls: number
  totalFifties: number
  totalHundreds: number
  superOverCount: number
  highestScoringMatch: { label: string; runs: number } | null
  mostWinsTeam: TeamInfo | null
  mostLossesTeam: TeamInfo | null
  fastestFifty: { name: string; teamName: string; balls: number } | null
  firstMatchWinner: TeamInfo | null
  lastMatchWinner: TeamInfo | null
  mostRunsTeam: TeamInfo | null
  mostSixesInnings: { name: string; teamName: string; sixes: number } | null
  mostRunsInnings: { name: string; teamName: string; runs: number; balls: number } | null
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeOptions(correct: string, wrongPool: string[], count = 3): string[] {
  const pool = shuffle(wrongPool.filter(o => o !== correct))
  const distractors = pool.slice(0, count)
  return shuffle([correct, ...distractors])
}

function makeNumberOptions(correct: number, altNumbers: number[], count = 3): string[] {
  const correctStr = String(correct)
  const pool = shuffle(altNumbers.filter(n => n !== correct).map(String))
  const distractors = pool.slice(0, count)
  return shuffle([correctStr, ...distractors])
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export async function computeSeasonFacts(seasonId: string): Promise<Facts> {
  const [season, teams, matches] = await Promise.all([
    prisma.season.findUnique({ where: { id: seasonId }, include: { teams: true } }),
    prisma.team.findMany({ where: { seasonId } }),
    prisma.match.findMany({
      where: { seasonId, status: "completed" },
      include: {
        team1: true,
        team2: true,
        innings: true,
        performances: { include: { player: true } },
        superOvers: true,
      },
      orderBy: { date: "asc" },
    }),
  ])

  if (!season) throw new Error("Season not found")

  const teamInfo = (t: { id: string; name: string; shortName: string; color?: string }): TeamInfo => ({
    id: t.id,
    name: t.name,
    shortName: t.shortName,
    color: t.color || "",
  })

  const teamsInfo: TeamInfo[] = teams.map(teamInfo)
  const teamNameById = new Map<string, string>(teams.map(t => [t.id, t.name]))

  const pointsTable = await recalcPointsTable(seasonId)

  let champion: TeamInfo | null = null
  let runnerUp: TeamInfo | null = null
  if (season.winnerId) {
    champion = teamsInfo.find(t => t.id === season.winnerId) || null
  } else if (pointsTable.length > 0) {
    champion = teamsInfo.find(t => t.id === pointsTable[0].id) || null
  }
  if (pointsTable.length > 1) {
    runnerUp = teamsInfo.find(t => t.id === pointsTable[1].id) || null
  }

  const winCounts: Record<string, number> = {}
  const lossCounts: Record<string, number> = {}
  const runAgg: Record<string, { name: string; teamName: string; runs: number; balls: number; fours: number; sixes: number; fifties: number; hundreds: number; highest: number; highestNotOut: boolean; notOuts: number; dismissals: number }> = {}
  const bowlAgg: Record<string, { name: string; teamName: string; wickets: number; runs: number; balls: number; maidens: number; fiveWickets: number }> = {}
  const catchesAgg: Record<string, { name: string; teamName: string; count: number }> = {}
  const stumpAgg: Record<string, { name: string; teamName: string; count: number }> = {}
  const potmAgg: Record<string, { name: string; teamName: string; count: number }> = {}
  let fastestFifty: { name: string; teamName: string; balls: number } | null = null

  let totalRuns = 0
  let totalSixes = 0
  let totalFours = 0
  let totalWickets = 0
  let totalBalls = 0
  let totalFifties = 0
  let totalHundreds = 0
  let superOverCount = matches.filter(m => m.superOvers.length > 0).length

  let highestTeamTotal: Facts["highestTeamTotal"] = null
  let lowestTeamTotal: Facts["lowestTeamTotal"] = null
  let biggestWinRuns: Facts["biggestWinRuns"] = null
  let biggestWinWickets: Facts["biggestWinWickets"] = null
  let highestScoringMatch: Facts["highestScoringMatch"] = null
  let mostSixesInnings: Facts["mostSixesInnings"] = null
  let mostRunsInnings: Facts["mostRunsInnings"] = null
  const teamRunTotals: Record<string, number> = {}
  const teamShortById = new Map<string, string>(teams.map(t => [t.id, t.shortName]))

  const firstMatch = matches[0]
  const lastMatch = matches[matches.length - 1]

  for (const m of matches) {
    const t1 = teamInfo(m.team1)
    const t2 = teamInfo(m.team2)
    const label = `${t1.shortName} vs ${t2.shortName}`

    if (m.winnerTeamId === t1.id) {
      winCounts[t1.id] = (winCounts[t1.id] || 0) + 1
      lossCounts[t2.id] = (lossCounts[t2.id] || 0) + 1
    } else if (m.winnerTeamId === t2.id) {
      winCounts[t2.id] = (winCounts[t2.id] || 0) + 1
      lossCounts[t1.id] = (lossCounts[t1.id] || 0) + 1
    }

    const inns = m.innings
    let matchRuns = 0
    for (const inn of inns) {
      const teamName = teamNameById.get(inn.teamId) || inn.teamId
      const tRuns = inn.runs + inn.extras
      const overs = `${Math.floor(inn.balls / 6)}.${inn.balls % 6}`
      totalRuns += tRuns
      totalBalls += inn.balls
      totalWickets += inn.wickets
      teamRunTotals[inn.teamId] = (teamRunTotals[inn.teamId] || 0) + tRuns

      const rec = { teamName, runs: tRuns, wickets: inn.wickets, overs }
      if (!highestTeamTotal || tRuns > highestTeamTotal.runs) highestTeamTotal = { ...rec }
      if (inn.balls >= 12 && (!lowestTeamTotal || tRuns < lowestTeamTotal.runs)) lowestTeamTotal = { ...rec }
      matchRuns += tRuns
    }

    if (inns.length === 2) {
      const [i1, i2] = inns
      const total = (i1.runs + i1.extras) + (i2.runs + i2.extras)
      if (!highestScoringMatch || total > highestScoringMatch.runs) {
        highestScoringMatch = { label, runs: total }
      }

      const diff = (i1.runs + i1.extras) - (i2.runs + i2.extras)
      if (m.winnerTeamId === i1.teamId && diff > 0 && (!biggestWinRuns || diff > biggestWinRuns.margin)) {
        biggestWinRuns = { teamName: teamNameById.get(i1.teamId) || "", margin: diff, label: `Won by ${diff} run${diff !== 1 ? "s" : ""}` }
      }
      if (m.winnerTeamId === i2.teamId && diff < 0) {
        const wkts = MATCH_CONFIG.wicketsPerInnings - i2.wickets
        if (!biggestWinWickets || wkts > biggestWinWickets.margin) {
          biggestWinWickets = { teamName: teamNameById.get(i2.teamId) || "", margin: wkts, label: `Won by ${wkts} wicket${wkts !== 1 ? "s" : ""}` }
        }
      }
    }

    for (const p of m.performances) {
      const pName = p.player?.name || "Unknown"
      const teamName = teamNameById.get(p.teamId) || p.teamId

      if (p.battingRuns >= 50 && p.ballsFaced > 0) {
        if (!fastestFifty || p.ballsFaced < fastestFifty.balls) {
          fastestFifty = { name: pName, teamName, balls: p.ballsFaced }
        }
      }

      const b = runAgg[p.playerId] || (runAgg[p.playerId] = { name: pName, teamName, runs: 0, balls: 0, fours: 0, sixes: 0, fifties: 0, hundreds: 0, highest: 0, highestNotOut: false, notOuts: 0, dismissals: 0 })
      b.runs += p.battingRuns
      b.balls += p.ballsFaced
      b.fours += p.fours
      b.sixes += p.sixes
      if (p.battingRuns >= 50 && p.battingRuns < 100) b.fifties++
      if (p.battingRuns >= 100) b.hundreds++
      if (p.battingRuns > b.highest) {
        b.highest = p.battingRuns
        b.highestNotOut = !p.isOut
      }
      if (!p.isOut) b.notOuts++
      else b.dismissals++
      totalFours += p.fours
      totalSixes += p.sixes

      if (p.battingRuns >= 50 && p.battingRuns < 100) totalFifties++
      if (p.battingRuns >= 100) totalHundreds++
      if (!mostSixesInnings || p.sixes > mostSixesInnings.sixes) {
        mostSixesInnings = { name: pName, teamName, sixes: p.sixes }
      }
      if (!mostRunsInnings || p.battingRuns > mostRunsInnings.runs) {
        mostRunsInnings = { name: pName, teamName, runs: p.battingRuns, balls: p.ballsFaced }
      }

      const bw = bowlAgg[p.playerId] || (bowlAgg[p.playerId] = { name: pName, teamName, wickets: 0, runs: 0, balls: 0, maidens: 0, fiveWickets: 0 })
      bw.wickets += p.bowlingWickets
      bw.runs += p.bowlingRuns
      bw.balls += p.ballsBowled
      bw.maidens += p.maidens
      if (p.bowlingWickets >= 5) bw.fiveWickets++

      if (p.catches > 0) {
        const c = catchesAgg[p.playerId] || (catchesAgg[p.playerId] = { name: pName, teamName, count: 0 })
        c.count += p.catches
      }
      if (p.stumpings > 0) {
        const s = stumpAgg[p.playerId] || (stumpAgg[p.playerId] = { name: pName, teamName, count: 0 })
        s.count += p.stumpings
      }
    }

    if (m.manOfMatch) {
      const motmPerf = m.performances.find(p => p.playerId === m.manOfMatch)
      if (motmPerf) {
        const tm = teamNameById.get(motmPerf.teamId) || motmPerf.teamId
        const rec = potmAgg[m.manOfMatch] || (potmAgg[m.manOfMatch] = { name: motmPerf.player?.name || "Unknown", teamName: tm, count: 0 })
        rec.count++
      }
    }
  }

  const byRuns = Object.values(runAgg).sort((a, b) => b.runs - a.runs || b.sixes - a.sixes)
  const byWickets = Object.values(bowlAgg).sort((a, b) => b.wickets - a.wickets || a.runs - b.runs)
  const bySixes = Object.values(runAgg).sort((a, b) => b.sixes - a.sixes)
  const byFours = Object.values(runAgg).sort((a, b) => b.fours - a.fours)
  const byFifties = Object.values(runAgg).sort((a, b) => b.fifties - a.fifties)
  const byHundreds = Object.values(runAgg).sort((a, b) => b.hundreds - a.hundreds)
  const byCatches = Object.values(catchesAgg).sort((a, b) => b.count - a.count)
  const byStumps = Object.values(stumpAgg).sort((a, b) => b.count - a.count)
  const byPotm = Object.values(potmAgg).sort((a, b) => b.count - a.count)

  const bestBowlingByWickets = [...Object.values(bowlAgg)].sort((a, b) => b.wickets - a.wickets || a.runs - b.runs)[0]

  const topRun = byRuns[0] || null
  const topWkt = byWickets[0] || null
  const topSix = bySixes[0] || null
  const topFour = byFours[0] || null
  const topFifty = byFifties[0] || null
  const topHundred = byHundreds[0] || null
  const topCatch = byCatches[0] || null
  const topStump = byStumps[0] || null
  const topPotm = byPotm[0] || null

  const mostWinsId = Object.entries(winCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const mostLossesId = Object.entries(lossCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

  const firstName = firstMatch?.winnerTeamId ? teamInfo({ id: firstMatch.winnerTeamId, name: teamNameById.get(firstMatch.winnerTeamId) || "", shortName: teamShortById.get(firstMatch.winnerTeamId) || "", color: "" }) : null
  const lastName = lastMatch?.winnerTeamId ? teamInfo({ id: lastMatch.winnerTeamId, name: teamNameById.get(lastMatch.winnerTeamId) || "", shortName: teamShortById.get(lastMatch.winnerTeamId) || "", color: "" }) : null

  const mostRunsTeamId = Object.entries(teamRunTotals).sort((a, b) => b[1] - a[1])[0]?.[0]

  return {
    teams: teamsInfo,
    champion,
    runnerUp,
    topRunScorer: topRun ? { name: topRun.name, teamName: topRun.teamName, runs: topRun.runs } : null,
    topWicketTaker: topWkt ? { name: topWkt.name, teamName: topWkt.teamName, wickets: topWkt.wickets } : null,
    mostSixes: topSix && topSix.sixes > 0 ? { name: topSix.name, teamName: topSix.teamName, sixes: topSix.sixes } : null,
    mostFours: topFour && topFour.fours > 0 ? { name: topFour.name, teamName: topFour.teamName, fours: topFour.fours } : null,
    highestIndividual: topRun && topRun.runs > 0 ? { name: topRun.name, teamName: topRun.teamName, runs: topRun.highest, notOut: topRun.highestNotOut } : null,
    bestBowling: bestBowlingByWickets && bestBowlingByWickets.wickets > 0 ? { name: bestBowlingByWickets.name, teamName: bestBowlingByWickets.teamName, wickets: bestBowlingByWickets.wickets, runs: bestBowlingByWickets.runs } : null,
    highestTeamTotal,
    lowestTeamTotal,
    biggestWinRuns,
    biggestWinWickets,
    mostPotm: topPotm ? { name: topPotm.name, teamName: topPotm.teamName, count: topPotm.count } : null,
    mostFifties: topFifty && topFifty.fifties > 0 ? { name: topFifty.name, teamName: topFifty.teamName, count: topFifty.fifties } : null,
    mostHundreds: topHundred && topHundred.hundreds > 0 ? { name: topHundred.name, teamName: topHundred.teamName, count: topHundred.hundreds } : null,
    mostCatches: topCatch && topCatch.count > 0 ? { name: topCatch.name, teamName: topCatch.teamName, count: topCatch.count } : null,
    mostStumpings: topStump && topStump.count > 0 ? { name: topStump.name, teamName: topStump.teamName, count: topStump.count } : null,
    totalMatches: matches.length,
    totalRuns,
    totalSixes,
    totalFours,
    totalWickets,
    totalBalls,
    totalFifties,
    totalHundreds,
    superOverCount,
    highestScoringMatch,
    mostWinsTeam: mostWinsId ? teamsInfo.find(t => t.id === mostWinsId) || null : null,
    mostLossesTeam: mostLossesId ? teamsInfo.find(t => t.id === mostLossesId) || null : null,
    fastestFifty: fastestFifty || null,
    firstMatchWinner: firstName,
    lastMatchWinner: lastName,
    mostRunsTeam: mostRunsTeamId ? teamsInfo.find(t => t.id === mostRunsTeamId) || null : null,
    mostSixesInnings: mostSixesInnings && mostSixesInnings.sixes > 0 ? mostSixesInnings : null,
    mostRunsInnings: mostRunsInnings && mostRunsInnings.runs > 0 ? mostRunsInnings : null,
  }
}

export async function generateSeasonQuizQuestions(seasonId: string): Promise<SeasonQuizQuestion[]> {
  const facts = await computeSeasonFacts(seasonId)
  const questions: Omit<SeasonQuizQuestion, "position" | "pointValue">[] = []
  const teamNames = facts.teams.map(t => t.shortName)
  const teamFullNames = facts.teams.map(t => t.name)
  const playerPool = new Set<string>()

  function addPlayerToPool(name?: string | null) {
    if (name && name !== "Unknown") playerPool.add(name)
  }

  addPlayerToPool(facts.topRunScorer?.name)
  addPlayerToPool(facts.topWicketTaker?.name)
  addPlayerToPool(facts.mostSixes?.name)
  addPlayerToPool(facts.mostFours?.name)
  addPlayerToPool(facts.highestIndividual?.name)
  addPlayerToPool(facts.bestBowling?.name)
  addPlayerToPool(facts.mostPotm?.name)
  addPlayerToPool(facts.mostFifties?.name)
  addPlayerToPool(facts.mostHundreds?.name)
  addPlayerToPool(facts.mostCatches?.name)
  addPlayerToPool(facts.mostStumpings?.name)
  addPlayerToPool(facts.fastestFifty?.name)
  addPlayerToPool(facts.mostSixesInnings?.name)
  addPlayerToPool(facts.mostRunsInnings?.name)

  function playerOptions(correct: string): string[] {
    return makeOptions(correct, [...playerPool])
  }

  function teamOptions(correct: string): string[] {
    return makeOptions(correct, teamFullNames.length >= 4 ? teamFullNames : teamNames)
  }

  // 1. Champion
  if (facts.champion) {
    questions.push({
      question: `Who won the ${facts.teams.length} team season?`,
      options: teamOptions(facts.champion.name),
      correctAnswer: facts.champion.name,
    })
  }

  // 2. Runners-up
  if (facts.runnerUp) {
    questions.push({
      question: "Who finished as the runners-up?",
      options: teamOptions(facts.runnerUp.name),
      correctAnswer: facts.runnerUp.name,
    })
  }

  // 3. Total matches
  if (facts.totalMatches > 0) {
    const alts = [facts.totalMatches - 1, facts.totalMatches + 1, facts.totalMatches + 2, facts.totalMatches - 2].filter(n => n >= 0)
    questions.push({
      question: `How many matches were played in the season?`,
      options: makeNumberOptions(facts.totalMatches, alts),
      correctAnswer: String(facts.totalMatches),
    })
  }

  // 4. Top run scorer
  if (facts.topRunScorer && facts.topRunScorer.runs > 0) {
    questions.push({
      question: `Who scored the most runs this season?`,
      options: playerOptions(facts.topRunScorer.name),
      correctAnswer: facts.topRunScorer.name,
    })
  }

  // 5. Top run scorer team
  if (facts.topRunScorer && facts.topRunScorer.runs > 0) {
    questions.push({
      question: `Which team did the top run scorer (${facts.topRunScorer.name}) play for?`,
      options: teamOptions(facts.topRunScorer.teamName),
      correctAnswer: facts.topRunScorer.teamName,
    })
  }

  // 6. Top run count
  if (facts.topRunScorer && facts.topRunScorer.runs > 0) {
    const alts = [facts.topRunScorer.runs - 5, facts.topRunScorer.runs + 10, facts.topRunScorer.runs + 25, facts.topRunScorer.runs - 10].filter(n => n > 0)
    questions.push({
      question: `How many runs did the top scorer (${facts.topRunScorer.name}) finish with?`,
      options: makeNumberOptions(facts.topRunScorer.runs, alts),
      correctAnswer: String(facts.topRunScorer.runs),
    })
  }

  // 7. Highest individual score
  if (facts.highestIndividual && facts.highestIndividual.runs > 0) {
    questions.push({
      question: `Who hit the highest individual score of ${facts.highestIndividual.runs}${facts.highestIndividual.notOut ? "*" : ""}?`,
      options: playerOptions(facts.highestIndividual.name),
      correctAnswer: facts.highestIndividual.name,
    })
  }

  // 8. Highest team total
  if (facts.highestTeamTotal) {
    questions.push({
      question: "Which team posted the highest total of the season?",
      options: teamOptions(facts.highestTeamTotal.teamName),
      correctAnswer: facts.highestTeamTotal.teamName,
    })
  }

  // 9. Highest team total value
  if (facts.highestTeamTotal) {
    const alts = [facts.highestTeamTotal.runs - 2, facts.highestTeamTotal.runs + 3, facts.highestTeamTotal.runs + 6, facts.highestTeamTotal.runs - 5].filter(n => n > 0)
    questions.push({
      question: `What was the highest team total of the season (${facts.highestTeamTotal.teamName})?`,
      options: makeNumberOptions(facts.highestTeamTotal.runs, alts),
      correctAnswer: String(facts.highestTeamTotal.runs),
    })
  }

  // 10. Lowest team total
  if (facts.lowestTeamTotal && facts.lowestTeamTotal.teamName !== facts.highestTeamTotal?.teamName) {
    questions.push({
      question: "Which team scored the lowest total of the season?",
      options: teamOptions(facts.lowestTeamTotal.teamName),
      correctAnswer: facts.lowestTeamTotal.teamName,
    })
  }

  // 11. Top wicket taker
  if (facts.topWicketTaker && facts.topWicketTaker.wickets > 0) {
    questions.push({
      question: "Who took the most wickets this season?",
      options: playerOptions(facts.topWicketTaker.name),
      correctAnswer: facts.topWicketTaker.name,
    })
  }

  // 12. Top wicket count
  if (facts.topWicketTaker && facts.topWicketTaker.wickets > 0) {
    const alts = [facts.topWicketTaker.wickets - 1, facts.topWicketTaker.wickets + 1, facts.topWicketTaker.wickets + 2, facts.topWicketTaker.wickets - 2].filter(n => n >= 0)
    questions.push({
      question: `How many wickets did the top wicket-taker (${facts.topWicketTaker.name}) take?`,
      options: makeNumberOptions(facts.topWicketTaker.wickets, alts),
      correctAnswer: String(facts.topWicketTaker.wickets),
    })
  }

  // 13. Best bowling figures
  if (facts.bestBowling) {
    questions.push({
      question: `Who had the best bowling figures of ${facts.bestBowling.wickets}/${facts.bestBowling.runs}?`,
      options: playerOptions(facts.bestBowling.name),
      correctAnswer: facts.bestBowling.name,
    })
  }

  // 14. Most sixes
  if (facts.mostSixes) {
    questions.push({
      question: "Who hit the most sixes this season?",
      options: playerOptions(facts.mostSixes.name),
      correctAnswer: facts.mostSixes.name,
    })
  }

  // 15. Most sixes count
  if (facts.mostSixes && facts.mostSixes.sixes > 0) {
    const alts = [facts.mostSixes.sixes - 1, facts.mostSixes.sixes + 1, facts.mostSixes.sixes + 2, facts.mostSixes.sixes - 2].filter(n => n >= 0)
    questions.push({
      question: `How many sixes did the leading six-hitter (${facts.mostSixes.name}) hit?`,
      options: makeNumberOptions(facts.mostSixes.sixes, alts),
      correctAnswer: String(facts.mostSixes.sixes),
    })
  }

  // 16. Most fours
  if (facts.mostFours && facts.mostFours.fours > 0) {
    questions.push({
      question: "Who struck the most fours this season?",
      options: playerOptions(facts.mostFours.name),
      correctAnswer: facts.mostFours.name,
    })
  }

  // 17. Most POTM awards
  if (facts.mostPotm) {
    questions.push({
      question: `Who won the most Player of the Match awards (${facts.mostPotm.count})?`,
      options: playerOptions(facts.mostPotm.name),
      correctAnswer: facts.mostPotm.name,
    })
  }

  // 18. Most fifties
  if (facts.mostFifties) {
    questions.push({
      question: `Who scored the most half-centuries (${facts.mostFifties.count}) this season?`,
      options: playerOptions(facts.mostFifties.name),
      correctAnswer: facts.mostFifties.name,
    })
  }

  // 19. Most hundreds
  if (facts.mostHundreds) {
    questions.push({
      question: `Who scored the most centuries (${facts.mostHundreds.count}) this season?`,
      options: playerOptions(facts.mostHundreds.name),
      correctAnswer: facts.mostHundreds.name,
    })
  }

  // 20. Most catches
  if (facts.mostCatches) {
    questions.push({
      question: `Who took the most catches (${facts.mostCatches.count}) this season?`,
      options: playerOptions(facts.mostCatches.name),
      correctAnswer: facts.mostCatches.name,
    })
  }

  // 21. Most stumpings
  if (facts.mostStumpings) {
    questions.push({
      question: `Who effected the most stumpings (${facts.mostStumpings.count}) this season?`,
      options: playerOptions(facts.mostStumpings.name),
      correctAnswer: facts.mostStumpings.name,
    })
  }

  // 22. Fastest fifty
  if (facts.fastestFifty) {
    questions.push({
      question: `Who scored the fastest fifty (off ${facts.fastestFifty.balls} balls)?`,
      options: playerOptions(facts.fastestFifty.name),
      correctAnswer: facts.fastestFifty.name,
    })
  }

  // 23. Total sixes
  if (facts.totalSixes > 0) {
    const alts = [facts.totalSixes - 2, facts.totalSixes + 3, facts.totalSixes + 5, facts.totalSixes - 1].filter(n => n >= 0)
    questions.push({
      question: "How many sixes were hit in the entire season?",
      options: makeNumberOptions(facts.totalSixes, alts),
      correctAnswer: String(facts.totalSixes),
    })
  }

  // 24. Total fours
  if (facts.totalFours > 0) {
    const alts = [facts.totalFours - 3, facts.totalFours + 4, facts.totalFours + 8, facts.totalFours - 2].filter(n => n >= 0)
    questions.push({
      question: "How many fours were hit in the entire season?",
      options: makeNumberOptions(facts.totalFours, alts),
      correctAnswer: String(facts.totalFours),
    })
  }

  // 25. Total runs
  if (facts.totalRuns > 0) {
    const alts = [facts.totalRuns - 20, facts.totalRuns + 30, facts.totalRuns + 50, facts.totalRuns - 10].filter(n => n >= 0)
    questions.push({
      question: "Roughly how many runs were scored in total this season?",
      options: makeNumberOptions(facts.totalRuns, alts),
      correctAnswer: String(facts.totalRuns),
    })
  }

  // 26. Total wickets
  if (facts.totalWickets > 0) {
    const alts = [facts.totalWickets - 2, facts.totalWickets + 3, facts.totalWickets + 5, facts.totalWickets - 1].filter(n => n >= 0)
    questions.push({
      question: "How many wickets fell across the season?",
      options: makeNumberOptions(facts.totalWickets, alts),
      correctAnswer: String(facts.totalWickets),
    })
  }

  // 27. Super overs
  if (facts.superOverCount > 0) {
    const alts = [facts.superOverCount + 1, facts.superOverCount + 2, facts.superOverCount - 1, facts.superOverCount + 3].filter(n => n >= 0)
    questions.push({
      question: "How many matches were decided by a Super Over?",
      options: makeNumberOptions(facts.superOverCount, alts),
      correctAnswer: String(facts.superOverCount),
    })
  }

  // 28. Biggest win by runs
  if (facts.biggestWinRuns) {
    questions.push({
      question: `Which team had the biggest win by runs (${facts.biggestWinRuns.label})?`,
      options: teamOptions(facts.biggestWinRuns.teamName),
      correctAnswer: facts.biggestWinRuns.teamName,
    })
  }

  // 29. Biggest win by wickets
  if (facts.biggestWinWickets) {
    questions.push({
      question: `Which team had the biggest win by wickets (${facts.biggestWinWickets.label})?`,
      options: teamOptions(facts.biggestWinWickets.teamName),
      correctAnswer: facts.biggestWinWickets.teamName,
    })
  }

  // 30. Highest scoring match teams
  if (facts.highestScoringMatch) {
    const pairPool = new Set<string>()
    for (let i = 0; i < teamNames.length; i++) {
      for (let j = i + 1; j < teamNames.length; j++) {
        pairPool.add(`${teamNames[i]} vs ${teamNames[j]}`)
        pairPool.add(`${teamNames[j]} vs ${teamNames[i]}`)
      }
    }
    questions.push({
      question: `Which match had the highest combined score (${facts.highestScoringMatch.runs} runs)?`,
      options: makeOptions(facts.highestScoringMatch.label, [...pairPool]),
      correctAnswer: facts.highestScoringMatch.label,
    })
  }

  // 31. Most wins
  if (facts.mostWinsTeam) {
    questions.push({
      question: "Which team recorded the most wins this season?",
      options: teamOptions(facts.mostWinsTeam.name),
      correctAnswer: facts.mostWinsTeam.name,
    })
  }

  // 32. Most losses
  if (facts.mostLossesTeam) {
    questions.push({
      question: "Which team lost the most matches this season?",
      options: teamOptions(facts.mostLossesTeam.name),
      correctAnswer: facts.mostLossesTeam.name,
    })
  }

  // 33. First match winner
  if (facts.firstMatchWinner) {
    questions.push({
      question: `Who won the opening match of the season (${ordinal(1)} match)?`,
      options: teamOptions(facts.firstMatchWinner.name),
      correctAnswer: facts.firstMatchWinner.name,
    })
  }

  // 34. Last match winner
  if (facts.lastMatchWinner) {
    questions.push({
      question: `Who won the ${ordinal(facts.totalMatches)} and final match of the season?`,
      options: teamOptions(facts.lastMatchWinner.name),
      correctAnswer: facts.lastMatchWinner.name,
    })
  }

  // 35. Number of teams
  if (facts.teams.length > 0) {
    const alts = [facts.teams.length - 1, facts.teams.length + 1, facts.teams.length + 2, facts.teams.length - 2].filter(n => n >= 2)
    questions.push({
      question: "How many teams competed in the season?",
      options: makeNumberOptions(facts.teams.length, alts),
      correctAnswer: String(facts.teams.length),
    })
  }

  // 36. Total balls
  if (facts.totalBalls > 0) {
    const alts = [facts.totalBalls - 6, facts.totalBalls + 6, facts.totalBalls + 12, facts.totalBalls - 12].filter(n => n >= 0)
    questions.push({
      question: "Approximately how many balls were bowled in the season?",
      options: makeNumberOptions(facts.totalBalls, alts),
      correctAnswer: String(facts.totalBalls),
    })
  }

  // 37. Most runs by a team
  if (facts.mostRunsTeam && facts.totalMatches > 1) {
    questions.push({
      question: "Which team scored the most runs overall this season?",
      options: teamOptions(facts.mostRunsTeam.name),
      correctAnswer: facts.mostRunsTeam.name,
    })
  }

  // 38. Most runs in a single innings
  if (facts.mostRunsInnings) {
    questions.push({
      question: `Who scored the most runs in a single innings (${facts.mostRunsInnings.runs} off ${facts.mostRunsInnings.balls})?`,
      options: playerOptions(facts.mostRunsInnings.name),
      correctAnswer: facts.mostRunsInnings.name,
    })
  }

  // 39. Most sixes in a single innings
  if (facts.mostSixesInnings) {
    questions.push({
      question: `Who hit the most sixes in a single innings (${facts.mostSixesInnings.sixes})?`,
      options: playerOptions(facts.mostSixesInnings.name),
      correctAnswer: facts.mostSixesInnings.name,
    })
  }

  // 40. Total half-centuries
  if (facts.totalFifties > 0) {
    const alts = [facts.totalFifties - 1, facts.totalFifties + 1, facts.totalFifties + 2, facts.totalFifties - 2].filter(n => n >= 0)
    questions.push({
      question: "How many half-centuries were scored across the season?",
      options: makeNumberOptions(facts.totalFifties, alts),
      correctAnswer: String(facts.totalFifties),
    })
  }

  // 41. Total centuries
  if (facts.totalHundreds > 0) {
    const alts = [facts.totalHundreds + 1, facts.totalHundreds + 2, facts.totalHundreds - 1, facts.totalHundreds + 3].filter(n => n >= 0)
    questions.push({
      question: "How many centuries were scored across the season?",
      options: makeNumberOptions(facts.totalHundreds, alts),
      correctAnswer: String(facts.totalHundreds),
    })
  }

  const deduped: Omit<SeasonQuizQuestion, "position" | "pointValue">[] = []
  const seen = new Set<string>()
  for (const q of questions) {
    if (seen.has(q.question)) continue
    seen.add(q.question)
    if (!q.options.includes(q.correctAnswer)) continue
    deduped.push(q)
  }

  return deduped
    .slice(0, 40)
    .map((q, i) => ({ ...q, position: i + 1, pointValue: 10 }))
}

export async function regenerateSeasonQuiz(seasonId: string): Promise<{ count: number }> {
  await prisma.seasonQuizAttempt.deleteMany({
    where: { seasonQuiz: { seasonId } },
  })
  await prisma.seasonQuiz.deleteMany({ where: { seasonId } })

  const questions = await generateSeasonQuizQuestions(seasonId)
  if (questions.length > 0) {
    await prisma.seasonQuiz.createMany({
      data: questions.map(q => ({
        seasonId,
        question: q.question,
        options: JSON.stringify(q.options),
        correctAnswer: q.correctAnswer,
        position: q.position,
        pointValue: q.pointValue,
      })),
    })
  }
  return { count: questions.length }
}

export async function maybeAutoGenerateSeasonQuiz(seasonId: string): Promise<{ count: number; autoGenerated: boolean }> {
  const [totalMatches, completedMatches, existing] = await Promise.all([
    prisma.match.count({ where: { seasonId } }),
    prisma.match.count({ where: { seasonId, status: "completed" } }),
    prisma.seasonQuiz.count({ where: { seasonId } }),
  ])

  if (existing > 0 || totalMatches === 0 || completedMatches !== totalMatches) {
    return { count: existing, autoGenerated: false }
  }

  const { count } = await regenerateSeasonQuiz(seasonId)
  return { count, autoGenerated: true }
}
