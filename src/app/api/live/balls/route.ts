import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

function totalRuns(ball: BallEvent): number {
  return ball.runs
}

export async function POST(req: Request) {
  const body = await req.json()
  const { matchId, battingTeamId, ball } = body as {
    matchId: string
    battingTeamId: string
    ball: BallEvent
  }

  if (!matchId || !battingTeamId || !ball) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  let innings = await prisma.inning.findUnique({
    where: { matchId_teamId: { matchId, teamId: battingTeamId } },
  })

  if (!innings) {
    innings = await prisma.inning.create({
      data: { matchId, teamId: battingTeamId },
    })
  }

  const ballsData: BallEvent[] = JSON.parse(innings.ballsData || "[]")
  ballsData.push(ball)
  const newBallsData = JSON.stringify(ballsData)

  const legal = isLegalDelivery(ball)
  const runs = totalRuns(ball)
  const newBalls = legal ? innings.balls + 1 : innings.balls
  const newRuns = innings.runs + runs
  const newWickets = ball.wicket ? innings.wickets + 1 : innings.wickets
  const extraRuns = (ball.isWide ? 1 : 0) + (ball.isNoBall ? 1 : 0) + ball.byes + ball.legByes
  const newExtras = innings.extras + extraRuns

  const updated = await prisma.inning.update({
    where: { id: innings.id },
    data: {
      ballsData: newBallsData,
      runs: newRuns,
      balls: newBalls,
      wickets: newWickets,
      extras: newExtras,
    },
  })

  return NextResponse.json({
    success: true,
    innings: {
      ...updated,
      ballsData: JSON.parse(updated.ballsData),
    },
  })
}
