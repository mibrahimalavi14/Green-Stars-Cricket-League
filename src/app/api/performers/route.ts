import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const players = await prisma.player.findMany({
    include: { team: { select: { name: true, shortName: true } } },
    orderBy: { runs: "desc" },
  })

  const batsmen = players
    .filter(p => p.runs > 0 || p.matchesPlayed > 0)
    .map(p => ({
      id: p.id,
      name: p.name,
      team: p.team.shortName,
      runs: p.runs,
      ballsFaced: p.ballsFaced,
      fours: p.fours,
      sixes: p.sixes,
      threes: p.threes,
      dotBalls: p.dotBalls,
      fifties: p.fifties,
      hundreds: p.hundreds,
      matches: p.matchesPlayed,
      notOuts: p.notOuts,
      highestScore: p.highestScoreNotOut ? `${p.highestScore}*` : p.highestScore,
      highestScoreNotOut: p.highestScoreNotOut,
      ducks: p.ducks,
      strikeRate: p.ballsFaced > 0 ? Math.round((p.runs / p.ballsFaced) * 100) : 0,
      average: p.dismissals > 0 ? (p.runs / p.dismissals).toFixed(1) : "-",
      dotBallPct: p.ballsFaced === 0 ? "0" : ((p.dotBalls / p.ballsFaced) * 100).toFixed(1),
      boundaryPct: p.runs === 0 ? "0" : (((p.fours * 4 + p.sixes * 6) / p.runs) * 100).toFixed(1),
    }))
    .sort((a, b) => b.runs - a.runs)

  const bowlers = players
    .filter(p => p.wickets > 0 || p.ballsBowled > 0)
    .map(p => ({
      id: p.id,
      name: p.name,
      team: p.team.shortName,
      wickets: p.wickets,
      ballsBowled: p.ballsBowled,
      runsConceded: p.runsConceded,
      maidens: p.maidens,
      wides: p.wides,
      noBalls: p.noBalls,
      fiveWickets: p.fiveWickets,
      fourWickets: p.fourWickets,
      hattricks: p.hattricks,
      matches: p.matchesPlayed,
      overs: Math.floor(p.ballsBowled / 6) + "." + (p.ballsBowled % 6),
      average: p.wickets > 0 ? (p.runsConceded / p.wickets).toFixed(1) : "-",
      economy: p.ballsBowled > 0 ? ((p.runsConceded / p.ballsBowled) * 6).toFixed(1) : "-",
      bestBowling: `${p.bestBowlingWickets}/${p.bestBowlingRuns}${p.bestBowlingBalls > 0 ? ` (${Math.floor(p.bestBowlingBalls / 6)}.${p.bestBowlingBalls % 6})` : ""}`,
    }))
    .sort((a, b) => b.wickets - a.wickets)

  const fielders = players
    .filter(p => p.catches > 0 || p.stumpings > 0 || p.runOuts > 0 || p.timesBowled > 0 || p.timesLbw > 0)
    .map(p => ({
      id: p.id,
      name: p.name,
      team: p.team.shortName,
      catches: p.catches,
      stumpings: p.stumpings,
      runOuts: p.runOuts,
      timesBowled: p.timesBowled,
      timesLbw: p.timesLbw,
      total: p.catches + p.stumpings + p.runOuts,
    }))
    .sort((a, b) => b.total - a.total)

  return NextResponse.json({ batsmen: batsmen.slice(0, 30), bowlers: bowlers.slice(0, 30), fielders: fielders.slice(0, 30) })
}
