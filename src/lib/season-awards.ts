import { prisma } from "./prisma"
import { recalcPointsTable } from "./stats"
import { computeFairPlayTable } from "./fair-play"

export interface SeasonAwardWinner {
  category: string
  playerId?: string
  teamId?: string
  value: string
  note?: string
}

interface Agg {
  playerId: string
  name: string
  teamId: string
  runs: number
  balls: number
  innings: number
  dismissals: number
  wickets: number
  runsConceded: number
  ballsBowled: number
  catches: number
  stumpings: number
  runOuts: number
  firstHalf: number
  secondHalf: number
}

function sr(runs: number, balls: number): number {
  return balls > 0 ? (runs / balls) * 100 : 0
}

function econ(runsConceded: number, ballsBowled: number): number {
  const overs = ballsBowled / 6
  return overs > 0 ? runsConceded / overs : Infinity
}

export async function computeSeasonAwardWinners(seasonId: string): Promise<SeasonAwardWinner[]> {
  const [season, teams, perfs, pointsTable] = await Promise.all([
    prisma.season.findUnique({ where: { id: seasonId } }),
    prisma.team.findMany({ where: { seasonId } }),
    prisma.playerMatch.findMany({
      where: { match: { seasonId, status: "completed" } },
      include: {
        player: { select: { name: true } },
        match: { select: { matchNo: true, date: true } },
      },
    }),
    recalcPointsTable(seasonId),
  ])

  if (!season) return []

  const teamById = new Map(teams.map(t => [t.id, t]))

  const aggMap = new Map<string, Agg>()
  const totalMatches = new Set(perfs.map(p => p.matchId)).size
  const halfBoundary = totalMatches / 2

  for (const p of perfs) {
    const a = aggMap.get(p.playerId) || {
      playerId: p.playerId,
      name: p.player?.name || "Unknown",
      teamId: p.teamId,
      runs: 0,
      balls: 0,
      innings: 0,
      dismissals: 0,
      wickets: 0,
      runsConceded: 0,
      ballsBowled: 0,
      catches: 0,
      stumpings: 0,
      runOuts: 0,
      firstHalf: 0,
      secondHalf: 0,
    }
    a.runs += p.battingRuns
    a.balls += p.ballsFaced
    a.innings++
    if (p.isOut) a.dismissals++
    a.wickets += p.bowlingWickets
    a.runsConceded += p.bowlingRuns
    a.ballsBowled += p.ballsBowled
    a.catches += p.catches
    a.stumpings += p.stumpings
    a.runOuts += p.runOuts
    const impact = p.battingRuns + p.bowlingWickets * 20
    if ((p.match?.matchNo || 0) <= halfBoundary) a.firstHalf += impact
    else a.secondHalf += impact
    aggMap.set(p.playerId, a)
  }

  const aggs = [...aggMap.values()]

  const winners: SeasonAwardWinner[] = []

  const championId = season.winnerId || pointsTable[0]?.id || ""
  const runnerUpId = season.runnerUpId || pointsTable[1]?.id || ""

  if (championId && teamById.has(championId)) {
    winners.push({ category: "champion", teamId: championId, value: "Season Champion" })
  }
  if (runnerUpId && teamById.has(runnerUpId)) {
    winners.push({ category: "runner_up", teamId: runnerUpId, value: "Runners-up" })
  }

  const byRuns = [...aggs].sort((a, b) => b.runs - a.runs || a.balls - b.balls)
  const orangeCap = byRuns.find(a => a.runs > 0)
  if (orangeCap) {
    winners.push({ category: "orange_cap", playerId: orangeCap.playerId, value: `${orangeCap.runs} runs in ${orangeCap.innings} inns` })
  }

  const byWickets = [...aggs].sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)
  const purpleCap = byWickets.find(a => a.wickets > 0)
  if (purpleCap) {
    winners.push({ category: "purple_cap", playerId: purpleCap.playerId, value: `${purpleCap.wickets} wickets in ${purpleCap.innings} inns` })
  }

  const impact = (a: Agg) => a.runs + a.wickets * 20 + a.catches * 10 + a.runOuts * 10 + a.stumpings * 10
  const mvp = [...aggs].filter(a => a.innings >= 3).sort((a, b) => impact(b) - impact(a))[0]
  if (mvp) {
    winners.push({ category: "mvp", playerId: mvp.playerId, value: `${impact(mvp)} impact points` })
  }

  const bestBatter = [...aggs].filter(a => a.runs >= 50).sort((a, b) => sr(b.runs, b.balls) - sr(a.runs, a.balls))[0]
  if (bestBatter) {
    winners.push({ category: "best_batter", playerId: bestBatter.playerId, value: `${bestBatter.runs} runs @ ${sr(bestBatter.runs, bestBatter.balls).toFixed(1)} SR` })
  }

  const bestBowler = [...aggs].filter(a => a.ballsBowled >= 36).sort((a, b) => econ(a.runsConceded, a.ballsBowled) - econ(b.runsConceded, b.ballsBowled))[0]
  if (bestBowler) {
    const e = econ(bestBowler.runsConceded, bestBowler.ballsBowled)
    winners.push({ category: "best_bowler", playerId: bestBowler.playerId, value: `${bestBowler.wickets} wkts @ ${Number.isFinite(e) ? e.toFixed(2) : "∞"} econ` })
  }

  const fielderScore = (a: Agg) => a.catches * 2 + a.stumpings * 3 + a.runOuts
  const bestFielder = [...aggs].filter(a => fielderScore(a) > 0).sort((a, b) => fielderScore(b) - fielderScore(a))[0]
  if (bestFielder) {
    winners.push({
      category: "best_fielder",
      playerId: bestFielder.playerId,
      value: `${bestFielder.catches} catches, ${bestFielder.stumpings} stumpings, ${bestFielder.runOuts} run-outs`,
    })
  }

  const improved = [...aggs]
    .filter(a => a.innings >= 4 && a.secondHalf > a.firstHalf && (a.secondHalf - a.firstHalf) >= 20)
    .sort((a, b) => (b.secondHalf - b.firstHalf) - (a.secondHalf - a.firstHalf))[0]
  if (improved) {
    winners.push({ category: "most_improved", playerId: improved.playerId, value: `+${improved.secondHalf - improved.firstHalf} impact in the second half` })
  }

  if (teams.length > 0) {
    const fp = await computeFairPlayTable(seasonId)
    if (fp.length > 0) {
      const top = fp[0]
      winners.push({ category: "fair_play", teamId: top.id, value: `${top.fairPlayPoints} Fair Play points` })
    }
  }

  return winners
}

export async function autoGenerateSeasonAwards(seasonId: string): Promise<{ count: number }> {
  const winners = await computeSeasonAwardWinners(seasonId)

  for (const w of winners) {
    await prisma.seasonAward.upsert({
      where: { seasonId_category: { seasonId, category: w.category } },
      create: { seasonId, category: w.category, playerId: w.playerId || "", teamId: w.teamId || "", value: w.value, note: w.note || "" },
      update: { playerId: w.playerId || "", teamId: w.teamId || "", value: w.value, note: w.note || "" },
    })
  }

  const season = await prisma.season.findUnique({ where: { id: seasonId } })
  if (season) {
    const winnerTeam = winners.find(w => w.category === "champion")
    const runnerTeam = winners.find(w => w.category === "runner_up")
    await prisma.season.update({
      where: { id: seasonId },
      data: {
        ...(winnerTeam?.teamId && !season.winnerId ? { winnerId: winnerTeam.teamId } : {}),
        ...(runnerTeam?.teamId && !season.runnerUpId ? { runnerUpId: runnerTeam.teamId } : {}),
      },
    })
  }

  return { count: winners.length }
}

export async function maybeAutoGenerateSeasonAwards(seasonId: string): Promise<{ count: number; autoGenerated: boolean }> {
  const [totalMatches, completedMatches, existing] = await Promise.all([
    prisma.match.count({ where: { seasonId } }),
    prisma.match.count({ where: { seasonId, status: "completed" } }),
    prisma.seasonAward.count({ where: { seasonId, category: "champion" } }),
  ])

  if (existing > 0 || totalMatches === 0 || completedMatches !== totalMatches) {
    return { count: existing, autoGenerated: false }
  }

  const { count } = await autoGenerateSeasonAwards(seasonId)
  return { count, autoGenerated: true }
}
