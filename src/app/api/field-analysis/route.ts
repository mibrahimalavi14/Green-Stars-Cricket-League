import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { WORKSPACE_OFFICIAL } from "@/lib/workspace"

interface BallEvent {
  runs: number
  extras: string | null
  wicket: string | null
  bowler: string
  striker: string
  region: string
  isWide: boolean
  isNoBall: boolean
  byes: number
  legByes: number
}

export async function GET() {
  const matches = await prisma.match.findMany({
    where: { status: "completed", innings: { some: { ballsData: { not: "[]" } } }, season: { workspaceId: WORKSPACE_OFFICIAL } },
    include: {
      innings: true,
      team1: true,
      team2: true,
    },
  })

  const regionStats: Record<string, { balls: number; runs: number; fours: number; sixes: number; wickets: number; dotBalls: number }> = {}

  for (const match of matches) {
    for (const inn of match.innings) {
      const balls: BallEvent[] = JSON.parse(inn.ballsData || "[]")
      for (const ball of balls) {
        const region = ball.region || "Unknown"
        if (!regionStats[region]) {
          regionStats[region] = { balls: 0, runs: 0, fours: 0, sixes: 0, wickets: 0, dotBalls: 0 }
        }
        regionStats[region].balls++
        regionStats[region].runs += ball.runs
        if (ball.runs === 4) regionStats[region].fours++
        if (ball.runs === 6) regionStats[region].sixes++
        if (ball.wicket) regionStats[region].wickets++
        if (ball.runs === 0 && !ball.isWide && !ball.isNoBall && !ball.wicket) regionStats[region].dotBalls++
      }
    }
  }

  const sorted = Object.entries(regionStats)
    .map(([region, stats]) => ({
      region,
      ...stats,
      sr: stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : "0.0",
      avg: stats.wickets > 0 ? (stats.runs / stats.wickets).toFixed(1) : "-",
    }))
    .sort((a, b) => b.runs - a.runs)

  return NextResponse.json({ regions: sorted, totalBalls: sorted.reduce((s, r) => s + r.balls, 0), totalRuns: sorted.reduce((s, r) => s + r.runs, 0) })
}
