import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get("matchId")

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 })
  }

  const match = await prisma.match.findFirst({
    where: { id: matchId, status: "completed" },
    include: {
      team1: true,
      team2: true,
      season: true,
      performances: { include: { player: true } },
    },
  })

  if (!match) {
    return NextResponse.json({ error: "Match not found or not completed" }, { status: 404 })
  }

  if (!match.manOfMatch) {
    return NextResponse.json({ match, winner: null })
  }

  const winnerPerf = match.performances.find(p => p.playerId === match.manOfMatch)

  return NextResponse.json({
    match,
    winner: winnerPerf
      ? {
          playerId: winnerPerf.playerId,
          name: winnerPerf.player.name,
          role: winnerPerf.player.role,
          team: winnerPerf.teamId === match.team1Id ? match.team1.name : match.team2.name,
          teamShortName: winnerPerf.teamId === match.team1Id ? match.team1.shortName : match.team2.shortName,
          stats: {
            battingRuns: winnerPerf.battingRuns,
            ballsFaced: winnerPerf.ballsFaced,
            fours: winnerPerf.fours,
            sixes: winnerPerf.sixes,
            bowlingWickets: winnerPerf.bowlingWickets,
            bowlingRuns: winnerPerf.bowlingRuns,
            ballsBowled: winnerPerf.ballsBowled,
            catches: winnerPerf.catches,
            runOuts: winnerPerf.runOuts,
            stumpings: winnerPerf.stumpings,
          },
        }
      : null,
  })
}
