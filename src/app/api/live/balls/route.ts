import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"

interface BallEvent {
  runs: number
  extras: string | null
  wicket: string | null
  bowler: string
  striker: string
  nonStriker: string
  wicketBatsman: string | null
  wicketFielder: string | null
  isWide: boolean
  isNoBall: boolean
  byes: number
  legByes: number
}

function isLegalDelivery(ball: BallEvent): boolean {
  return !ball.isWide && !ball.isNoBall
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || ""

  const body = await req.json()
  const { matchId, battingTeamId, ball } = body as {
    matchId: string
    battingTeamId: string
    ball: BallEvent
  }

  if (!matchId || !battingTeamId || !ball) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const match = await prisma.match.findUnique({ where: { id: matchId }, select: { status: true } })
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })
  if (match.status === "completed") {
    return NextResponse.json({ error: "Match is completed. Cannot add balls." }, { status: 400 })
  }

  const result = await prisma.$transaction(async (tx) => {
    let innings = await tx.inning.findUnique({
      where: { matchId_teamId: { matchId, teamId: battingTeamId } },
    })

    if (!innings) {
      innings = await tx.inning.create({
        data: { matchId, teamId: battingTeamId },
      })
    }

    const ballsData: BallEvent[] = JSON.parse(innings.ballsData || "[]")

    const batters = new Set<string>()
    const dismissed = new Set<string>()
    for (const b of ballsData) {
      batters.add(b.striker)
      if (b.nonStriker) batters.add(b.nonStriker)
      if (b.wicket) {
        dismissed.add(b.wicketBatsman || b.striker)
      }
    }
    batters.add(ball.striker)
    if (ball.nonStriker) batters.add(ball.nonStriker)

    if (batters.size > 11) throw new Error("Cannot exceed 11 batters")
    if (dismissed.has(ball.striker)) throw new Error("Dismissed batsman cannot bat again")

    const legalBefore = ballsData.filter(b => !b.isWide && !b.isNoBall).length
    const ballsInCurrentOver = legalBefore % 6
    if (isLegalDelivery(ball) && ballsInCurrentOver >= 6) throw new Error("Over already complete (6 legal balls)")

    const bowlerLegalBalls = ballsData.filter(b => b.bowler === ball.bowler && !b.isWide && !b.isNoBall).length
    if (isLegalDelivery(ball) && bowlerLegalBalls >= 12) throw new Error("Bowler cannot bowl more than 2 overs")

    ballsData.push(ball)
    const newBallsData = JSON.stringify(ballsData)

    const legal = isLegalDelivery(ball)
    const runs = ball.runs
    const newBalls = legal ? innings.balls + 1 : innings.balls
    const newRuns = innings.runs + runs
    const newWickets = ball.wicket ? innings.wickets + 1 : innings.wickets
    const extraRuns = (ball.isWide ? 1 : 0) + (ball.isNoBall ? 1 : 0) + ball.byes + ball.legByes
    const newExtras = innings.extras + extraRuns

    const updated = await tx.inning.update({
      where: { id: innings.id },
      data: {
        ballsData: newBallsData,
        runs: newRuns,
        balls: newBalls,
        wickets: newWickets,
        extras: newExtras,
      },
    })

    return updated
  }, { maxWait: 5000, timeout: 10000 })

  logAudit({ action: "ball_added", entity: "match", entityId: matchId, details: JSON.stringify({ battingTeamId, ball: { runs: ball.runs, wicket: ball.wicket, isWide: ball.isWide, isNoBall: ball.isNoBall } }), ip })

  return NextResponse.json({
    success: true,
    innings: {
      ...result,
      ballsData: JSON.parse(result.ballsData),
    },
  })
}
