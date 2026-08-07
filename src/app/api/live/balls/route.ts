import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"
import { MATCH_CONFIG } from "@/lib/config"
import { trackEvent } from "@/lib/analytics"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"

interface BallEvent {
  id?: string
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

  const ip = getClientIp(req)
  const rl = rateLimit(`ball:${ip}`, RATE_LIMITS.BALL_SUBMIT)
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 })

  const body = await req.json()
  const { matchId, battingTeamId, ball, ballId } = body as {
    matchId: string
    battingTeamId: string
    ball: BallEvent
    ballId?: string
  }

  if (!matchId || !battingTeamId || !ball) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const match = await prisma.match.findUnique({ where: { id: matchId }, select: { status: true, seasonId: true } })
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })
  if (match.status === "completed") {
    return NextResponse.json({ error: "Match is completed. Cannot add balls." }, { status: 400 })
  }

  const { assertSeasonUnlocked } = await import("@/lib/season-guard")
  const lockErr = await assertSeasonUnlocked(match.seasonId)
  if (lockErr) return NextResponse.json({ error: lockErr }, { status: 423 })

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

    if (ballId && ballsData.some((b) => b.id === ballId)) {
      return innings
    }

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
    if (isLegalDelivery(ball) && legalBefore >= MATCH_CONFIG.totalBalls) throw new Error(`Innings complete (${MATCH_CONFIG.totalBalls} legal balls)`)

    const bowlerLegalBalls = ballsData.filter(b => b.bowler === ball.bowler && !b.isWide && !b.isNoBall).length
    if (isLegalDelivery(ball) && bowlerLegalBalls >= MATCH_CONFIG.maxBallsPerBowler) throw new Error(`Bowler cannot bowl more than ${MATCH_CONFIG.maxOversPerBowler} over`)

    ballsData.push(ballId ? { ...ball, id: ballId } : ball)
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

  trackEvent("match_scored", { matchId, runs: ball.runs || 0, wicket: ball.wicket || "" }, ip)

  return NextResponse.json({
    success: true,
    innings: {
      ...result,
      ballsData: JSON.parse(result.ballsData),
    },
  })
}
