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
  let total = ball.runs
  if (ball.isWide) total += 1
  if (ball.isNoBall) total += 1
  total += ball.byes
  total += ball.legByes
  return total
}

export async function POST(req: Request) {
  const body = await req.json()
  const { inningsId } = body as { inningsId: string }

  if (!inningsId) {
    return NextResponse.json({ error: "inningsId required" }, { status: 400 })
  }

  const innings = await prisma.inning.findUnique({ where: { id: inningsId } })
  if (!innings) {
    return NextResponse.json({ error: "Innings not found" }, { status: 404 })
  }

  const ballsData: BallEvent[] = JSON.parse(innings.ballsData || "[]")
  if (ballsData.length === 0) {
    return NextResponse.json({ error: "No balls to undo" }, { status: 400 })
  }

  const lastBall = ballsData[ballsData.length - 1]
  const remaining = ballsData.slice(0, -1)

  const legal = isLegalDelivery(lastBall)
  const runs = totalRuns(lastBall)
  const extraRuns = (lastBall.isWide ? 1 : 0) + (lastBall.isNoBall ? 1 : 0) + lastBall.byes + lastBall.legByes

  const updated = await prisma.inning.update({
    where: { id: inningsId },
    data: {
      ballsData: JSON.stringify(remaining),
      runs: Math.max(0, innings.runs - runs),
      balls: legal ? Math.max(0, innings.balls - 1) : innings.balls,
      wickets: lastBall.wicket ? Math.max(0, innings.wickets - 1) : innings.wickets,
      extras: Math.max(0, innings.extras - extraRuns),
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
