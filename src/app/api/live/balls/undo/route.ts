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
  const { inningsId } = body as { inningsId: string }

  if (!inningsId) {
    return NextResponse.json({ error: "inningsId required" }, { status: 400 })
  }

  const result = await prisma.$transaction(async (tx) => {
    const innings = await tx.inning.findUnique({ where: { id: inningsId } })
    if (!innings) throw new Error("Innings not found")

    const match = await tx.match.findUnique({ where: { id: innings.matchId }, select: { status: true } })
    if (!match) throw new Error("Match not found")
    if (match.status === "completed") throw new Error("Match is completed. Cannot undo balls.")

    const ballsData: BallEvent[] = JSON.parse(innings.ballsData || "[]")
    if (ballsData.length === 0) throw new Error("No balls to undo")

    const lastBall = ballsData[ballsData.length - 1]
    const remaining = ballsData.slice(0, -1)

    const legal = isLegalDelivery(lastBall)
    const runs = lastBall.runs
    const extraRuns = (lastBall.isWide ? 1 : 0) + (lastBall.isNoBall ? 1 : 0) + lastBall.byes + lastBall.legByes

    const updated = await tx.inning.update({
      where: { id: inningsId },
      data: {
        ballsData: JSON.stringify(remaining),
        runs: Math.max(0, innings.runs - runs),
        balls: legal ? Math.max(0, innings.balls - 1) : innings.balls,
        wickets: lastBall.wicket ? Math.max(0, innings.wickets - 1) : innings.wickets,
        extras: Math.max(0, innings.extras - extraRuns),
      },
    })

    return { updated, lastBall }
  }, { maxWait: 5000, timeout: 10000 })

  logAudit({ action: "ball_undone", entity: "match", entityId: result.lastBall.bowler, details: JSON.stringify({ inningsId, undone: { runs: result.lastBall.runs, wicket: result.lastBall.wicket } }), ip })

  return NextResponse.json({
    success: true,
    innings: {
      ...result.updated,
      ballsData: JSON.parse(result.updated.ballsData),
    },
  })
}
