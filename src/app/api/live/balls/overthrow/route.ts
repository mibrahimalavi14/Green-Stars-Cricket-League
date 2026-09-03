import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"
import { trackEvent } from "@/lib/analytics"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { isLegalDelivery, type BallEvent } from "@/lib/scoring"

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const ip = getClientIp(req)
  const rl = rateLimit(`ball:${ip}`, RATE_LIMITS.BALL_SUBMIT)
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 })

  const body = await req.json()
  const { matchId, battingTeamId, runs } = body as { matchId: string; battingTeamId: string; runs: number }

  if (!matchId || !battingTeamId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }
  const extra = Number.isInteger(runs) ? runs : 0
  if (extra < 1 || extra > 4) {
    return NextResponse.json({ error: "Overthrows must be 1-4" }, { status: 400 })
  }

  const match = await prisma.match.findUnique({ where: { id: matchId }, select: { status: true, seasonId: true } })
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })
  if (match.status === "completed") {
    return NextResponse.json({ error: "Match is completed. Cannot add overthrows." }, { status: 400 })
  }

  const { assertSeasonUnlocked } = await import("@/lib/season-guard")
  const lockErr = await assertSeasonUnlocked(match.seasonId)
  if (lockErr) return NextResponse.json({ error: lockErr }, { status: 423 })

  const result = await prisma.$transaction(async (tx) => {
    const innings = await tx.inning.findUnique({
      where: { matchId_teamId: { matchId, teamId: battingTeamId } },
    })
    if (!innings) throw new Error("Innings not found")

    const ballsData: BallEvent[] = JSON.parse(innings.ballsData || "[]")
    if (ballsData.length === 0) throw new Error("No balls to add overthrows to")

    const last = ballsData[ballsData.length - 1]
    if (!isLegalDelivery(last)) throw new Error("Overthrows can only be added to a legal delivery")

    last.overthrows = (last.overthrows || 0) + extra
    ballsData[ballsData.length - 1] = last

    const updated = await tx.inning.update({
      where: { id: innings.id },
      data: {
        ballsData: JSON.stringify(ballsData),
        runs: innings.runs + extra,
      },
    })

    return { updated, last }
  }, { maxWait: 5000, timeout: 10000 })

  logAudit({ action: "overthrows_added", entity: "match", entityId: matchId, details: JSON.stringify({ battingTeamId, runs: extra }), ip })
  trackEvent("overthrows_added", { matchId, runs: extra }, ip)

  return NextResponse.json({
    success: true,
    innings: {
      ...result.updated,
      ballsData: JSON.parse(result.updated.ballsData),
    },
  })
}
