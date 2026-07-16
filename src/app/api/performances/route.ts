import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.json()
  const { matchId, players } = body

  for (const p of players) {
    await prisma.playerMatch.upsert({
      where: { playerId_matchId: { playerId: p.playerId, matchId } },
      update: {
        battingRuns: p.battingRuns || 0,
        ballsFaced: p.ballsFaced || 0,
        fours: p.fours || 0,
        sixes: p.sixes || 0,
        ones: p.ones || 0,
        twos: p.twos || 0,
        isOut: p.isOut || false,
        dismissalType: p.dismissalType || "",
        dismissedByBowlerId: p.dismissedByBowlerId || "",
        dismissedByFielderId: p.dismissedByFielderId || "",
        bowlingWickets: p.bowlingWickets || 0,
        bowlingRuns: p.bowlingRuns || 0,
        ballsBowled: p.ballsBowled || 0,
        maidens: p.maidens || 0,
        wides: p.wides || 0,
        noBalls: p.noBalls || 0,
        catches: p.catches || 0,
        stumpings: p.stumpings || 0,
        runOuts: p.runOuts || 0,
      },
      create: {
        playerId: p.playerId,
        matchId,
        teamId: p.teamId,
        battingRuns: p.battingRuns || 0,
        ballsFaced: p.ballsFaced || 0,
        fours: p.fours || 0,
        sixes: p.sixes || 0,
        ones: p.ones || 0,
        twos: p.twos || 0,
        isOut: p.isOut || false,
        dismissalType: p.dismissalType || "",
        dismissedByBowlerId: p.dismissedByBowlerId || "",
        dismissedByFielderId: p.dismissedByFielderId || "",
        bowlingWickets: p.bowlingWickets || 0,
        bowlingRuns: p.bowlingRuns || 0,
        ballsBowled: p.ballsBowled || 0,
        maidens: p.maidens || 0,
        wides: p.wides || 0,
        noBalls: p.noBalls || 0,
        catches: p.catches || 0,
        stumpings: p.stumpings || 0,
        runOuts: p.runOuts || 0,
      },
    })
  }

  const match = await prisma.match.findUnique({ where: { id: matchId }, select: { seasonId: true } })
  if (match) {
    const { recalcPointsTable, recalcPlayerStats } = await import("@/lib/stats")
    await recalcPointsTable(match.seasonId)
    await recalcPlayerStats()
  }

  return NextResponse.json({ success: true })
}
