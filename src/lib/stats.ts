import { prisma } from "./prisma"

export function parseScore(score: string) {
  const parts = score.split("/")
  const runs = parseInt(parts[0]) || 0
  const wickets = parts[1] ? parseInt(parts[1]) || 0 : 0
  return { runs, wickets }
}

export function ballsToOvers(balls: number) {
  const overs = Math.floor(balls / 6)
  const extraBalls = balls % 6
  return overs + extraBalls / 10
}

export async function recalcPointsTable(seasonId: string) {
  const teams = await prisma.team.findMany({ where: { seasonId } })
  const matches = await prisma.match.findMany({
    where: { seasonId, status: "completed" },
    select: { team1Id: true, team2Id: true, team1Score: true, team2Score: true, result: true },
  })

  const stats: Record<string, { played: number; won: number; lost: number; tied: number; nr: number; forRuns: number; forBalls: number; againstRuns: number; againstBalls: number }> = {}

  for (const team of teams) {
    stats[team.id] = { played: 0, won: 0, lost: 0, tied: 0, nr: 0, forRuns: 0, forBalls: 0, againstRuns: 0, againstBalls: 0 }
  }

  for (const m of matches) {
    const s1 = parseScore(m.team1Score)
    const s2 = parseScore(m.team2Score)
    const result = m.result.toLowerCase()

    if (stats[m.team1Id]) {
      stats[m.team1Id].played++
      stats[m.team1Id].forRuns += s1.runs
      stats[m.team1Id].forBalls += s1.wickets + s1.runs
      stats[m.team1Id].againstRuns += s2.runs
      stats[m.team1Id].againstBalls += s2.wickets + s2.runs
    }
    if (stats[m.team2Id]) {
      stats[m.team2Id].played++
      stats[m.team2Id].forRuns += s2.runs
      stats[m.team2Id].forBalls += s2.wickets + s2.runs
      stats[m.team2Id].againstRuns += s1.runs
      stats[m.team2Id].againstBalls += s1.wickets + s1.runs
    }

    if (result.includes("tied")) {
      if (stats[m.team1Id]) stats[m.team1Id].tied++
      if (stats[m.team2Id]) stats[m.team2Id].tied++
    } else if (result === "no result" || result.includes("abandon")) {
      if (stats[m.team1Id]) stats[m.team1Id].nr++
      if (stats[m.team2Id]) stats[m.team2Id].nr++
    } else {
      const team1Lower = teams.find(t => t.id === m.team1Id)?.name.toLowerCase() || ""
      const team2Lower = teams.find(t => t.id === m.team2Id)?.name.toLowerCase() || ""
      if (result.includes(team1Lower)) {
        if (stats[m.team1Id]) stats[m.team1Id].won++
        if (stats[m.team2Id]) stats[m.team2Id].lost++
      } else if (result.includes(team2Lower)) {
        if (stats[m.team2Id]) stats[m.team2Id].won++
        if (stats[m.team1Id]) stats[m.team1Id].lost++
      }
    }
  }

  return teams.map(team => {
    const s = stats[team.id] || { played: 0, won: 0, lost: 0, tied: 0, nr: 0, forRuns: 0, forBalls: 0, againstRuns: 0, againstBalls: 0 }
    const forOvers = ballsToOvers(s.forBalls)
    const againstOvers = ballsToOvers(s.againstBalls)
    const nrr = forOvers > 0 && againstOvers > 0
      ? ((s.forRuns / forOvers) - (s.againstRuns / againstOvers))
      : 0

    return {
      id: team.id,
      name: team.shortName,
      color: team.color,
      played: s.played,
      won: s.won,
      lost: s.lost,
      tied: s.tied,
      nr: s.nr,
      points: s.won * 2 + s.tied * 1 + s.nr * 1,
      nrr,
      forRuns: s.forRuns,
      forBalls: s.forBalls,
      againstRuns: s.againstRuns,
      againstBalls: s.againstBalls,
    }
  }).sort((a, b) => b.points - a.points || b.nrr - a.nrr)
}

export async function recalcPlayerStats() {
  const players = await prisma.player.findMany()
  const performances = await prisma.playerMatch.groupBy({
    by: ["playerId"],
    _sum: {
      battingRuns: true,
      ballsFaced: true,
      fours: true,
      sixes: true,
      ones: true,
      twos: true,
      bowlingWickets: true,
      bowlingRuns: true,
      ballsBowled: true,
      catches: true,
      stumpings: true,
      runOuts: true,
    },
    _count: { id: true },
  })

  const perfMap = new Map(performances.map(p => [p.playerId, p]))

  for (const player of players) {
    const p = perfMap.get(player.id)
    if (!p) continue

    const runs = p._sum.battingRuns || 0
    const ballsFaced = p._sum.ballsFaced || 0
    const fours = p._sum.fours || 0
    const sixes = p._sum.sixes || 0
    const ones = p._sum.ones || 0
    const twos = p._sum.twos || 0
    const wickets = p._sum.bowlingWickets || 0
    const runsConceded = p._sum.bowlingRuns || 0
    const ballsBowled = p._sum.ballsBowled || 0
    const matchesPlayed = p._count.id
    const catches = p._sum.catches || 0
    const stumpings = p._sum.stumpings || 0
    const runOuts = p._sum.runOuts || 0

    const individualMatches = await prisma.playerMatch.findMany({
      where: { playerId: player.id },
      select: { battingRuns: true },
    })
    const fifties = individualMatches.filter(m => m.battingRuns >= 50 && m.battingRuns < 100).length
    const hundreds = individualMatches.filter(m => m.battingRuns >= 100).length

    await prisma.player.update({
      where: { id: player.id },
      data: { runs, ballsFaced, fours, sixes, ones, twos, fifties, hundreds, wickets, runsConceded, ballsBowled, matchesPlayed, catches, stumpings, runOuts },
    })
  }
}
