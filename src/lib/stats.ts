import { prisma } from "./prisma"

export function ballsToOvers(balls: number) {
  return balls / 6
}

export async function recalcPointsTable(seasonId: string) {
  const teams = await prisma.team.findMany({ where: { seasonId } })
  const matches = await prisma.match.findMany({
    where: { seasonId, status: "completed" },
    include: { innings: true, team1: true, team2: true },
  })

  const stats: Record<string, { played: number; won: number; lost: number; tied: number; nr: number; forRuns: number; forBalls: number; againstRuns: number; againstBalls: number }> = {}

  for (const team of teams) {
    stats[team.id] = { played: 0, won: 0, lost: 0, tied: 0, nr: 0, forRuns: 0, forBalls: 0, againstRuns: 0, againstBalls: 0 }
  }

  for (const m of matches) {
    if (stats[m.team1Id]) stats[m.team1Id].played++
    if (stats[m.team2Id]) stats[m.team2Id].played++

    const result = m.result.toLowerCase()
    if (result.includes("tied")) {
      if (stats[m.team1Id]) stats[m.team1Id].tied++
      if (stats[m.team2Id]) stats[m.team2Id].tied++
    } else if (result === "no result" || result.includes("abandon")) {
      if (stats[m.team1Id]) stats[m.team1Id].nr++
      if (stats[m.team2Id]) stats[m.team2Id].nr++
    } else {
      const t1Match = result.includes((m.team1?.name || "").toLowerCase()) || result.includes((m.team1?.shortName || "").toLowerCase())
      const t2Match = result.includes((m.team2?.name || "").toLowerCase()) || result.includes((m.team2?.shortName || "").toLowerCase())
      if (t1Match && !t2Match) {
        if (stats[m.team1Id]) stats[m.team1Id].won++
        if (stats[m.team2Id]) stats[m.team2Id].lost++
      } else if (t2Match && !t1Match) {
        if (stats[m.team2Id]) stats[m.team2Id].won++
        if (stats[m.team1Id]) stats[m.team1Id].lost++
      }
    }

    const team1Inning = m.innings.find(inng => inng.teamId === m.team1Id)
    const team2Inning = m.innings.find(inng => inng.teamId === m.team2Id)

    if (team1Inning && stats[m.team1Id]) {
      stats[m.team1Id].forRuns += team1Inning.runs + team1Inning.extras
      stats[m.team1Id].forBalls += team1Inning.balls
    }
    if (team2Inning && stats[m.team1Id]) {
      stats[m.team1Id].againstRuns += team2Inning.runs + team2Inning.extras
      stats[m.team1Id].againstBalls += team2Inning.balls
    }
    if (team2Inning && stats[m.team2Id]) {
      stats[m.team2Id].forRuns += team2Inning.runs + team2Inning.extras
      stats[m.team2Id].forBalls += team2Inning.balls
    }
    if (team1Inning && stats[m.team2Id]) {
      stats[m.team2Id].againstRuns += team1Inning.runs + team1Inning.extras
      stats[m.team2Id].againstBalls += team1Inning.balls
    }
  }

  return teams.map(team => {
    const s = stats[team.id] || { played: 0, won: 0, lost: 0, tied: 0, nr: 0, forRuns: 0, forBalls: 0, againstRuns: 0, againstBalls: 0 }
    const forOvers = s.forBalls / 6
    const againstOvers = s.againstBalls / 6
    const nrr = forOvers > 0 && againstOvers > 0
      ? ((s.forRuns / forOvers) - (s.againstRuns / againstOvers))
      : forOvers > 0
        ? s.forRuns / forOvers
        : 0

    return {
      id: team.id,
      name: team.name,
      shortName: team.shortName,
      logo: team.logo,
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
  const [players, allMatches, performances] = await Promise.all([
    prisma.player.findMany(),
    prisma.playerMatch.findMany({
      select: {
        playerId: true,
        battingRuns: true, ballsFaced: true, isOut: true,
        bowlingWickets: true, bowlingRuns: true,
        dismissalType: true, secondDismissalType: true,
        threes: true, dotBalls: true, maidens: true, wides: true, noBalls: true, hattricks: true,
      },
    }),
    prisma.playerMatch.groupBy({
      by: ["playerId"],
      _sum: {
        battingRuns: true, ballsFaced: true, fours: true, sixes: true,
        ones: true, twos: true, bowlingWickets: true, bowlingRuns: true,
        ballsBowled: true, maidens: true, wides: true, noBalls: true,
        threes: true, dotBalls: true, hattricks: true,
        catches: true, stumpings: true, runOuts: true,
      },
      _count: { id: true },
    }),
  ])

  const perfMap = new Map(performances.map(p => [p.playerId, p]))
  const matchesByPlayer = new Map<string, typeof allMatches>()
  for (const m of allMatches) {
    if (!matchesByPlayer.has(m.playerId)) matchesByPlayer.set(m.playerId, [])
    matchesByPlayer.get(m.playerId)!.push(m)
  }

  const updates: Promise<any>[] = []
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

    const im = matchesByPlayer.get(player.id) || []
    const fifties = im.filter(m => m.battingRuns >= 50 && m.battingRuns < 100).length
    const hundreds = im.filter(m => m.battingRuns >= 100).length
    const notOuts = im.filter(m => m.ballsFaced > 0 && !m.isOut).length
    const ducks = im.filter(m => m.battingRuns === 0 && m.isOut).length
    const highestScore = im.length > 0 ? Math.max(...im.map(m => m.battingRuns)) : 0
    const fiveWickets = im.filter(m => m.bowlingWickets >= 5).length
    const fourWickets = im.filter(m => m.bowlingWickets >= 4).length
    const timesBowled = im.filter(m => m.dismissalType === "bowled" || m.secondDismissalType === "bowled").length
    const timesCaught = im.filter(m => m.dismissalType === "caught" || m.secondDismissalType === "caught").length
    const timesLbw = im.filter(m => m.dismissalType === "lbw" || m.secondDismissalType === "lbw").length
    const timesStumped = im.filter(m => m.dismissalType === "stumped" || m.secondDismissalType === "stumped").length
    const timesRunOut = im.filter(m => m.dismissalType === "runout" || m.secondDismissalType === "runout").length
    const threes = im.reduce((a, m) => a + (m.threes || 0), 0)
    const dotBalls = im.reduce((a, m) => a + (m.dotBalls || 0), 0)
    const hattricks = im.reduce((a, m) => a + (m.hattricks || 0), 0)
    const maidens = im.reduce((a, m) => a + (m.maidens || 0), 0)
    const wides = im.reduce((a, m) => a + (m.wides || 0), 0)
    const noBalls = im.reduce((a, m) => a + (m.noBalls || 0), 0)

    let bestWkts = 0, bestRuns = Infinity
    for (const m of im) {
      if (m.bowlingWickets > bestWkts || (m.bowlingWickets === bestWkts && m.bowlingRuns < bestRuns)) {
        bestWkts = m.bowlingWickets
        bestRuns = m.bowlingRuns
      }
    }
    const bestBowlingWickets = bestWkts
    const bestBowlingRuns = bestRuns === Infinity ? 0 : bestRuns

    updates.push(prisma.player.update({
      where: { id: player.id },
      data: {
          runs, ballsFaced, fours, sixes, ones, twos,
          threes, dotBalls, highestScore,
          fifties, hundreds, notOuts, ducks,
        wickets, runsConceded, ballsBowled, maidens, wides, noBalls,
        fiveWickets, fourWickets, hattricks,
        matchesPlayed, bestBowlingWickets, bestBowlingRuns,
        catches, stumpings, runOuts,
        timesBowled, timesCaught, timesLbw, timesStumped, timesRunOut,
      },
    }))
  }

  await prisma.$transaction(updates as any)
}
