import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { trackEvent } from "@/lib/analytics"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { potmVoteSchema } from "@/lib/validation"
import { verifyVerifiedEmailToken } from "@/lib/verified-email"
import { notifyAdmin } from "@/lib/email"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get("matchId")
  const email = searchParams.get("email")

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 })
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { team1: true, team2: true, season: true },
  })

  if (!match || match.status !== "completed") {
    return NextResponse.json({ error: "Match not found or not completed" }, { status: 404 })
  }

  const performances = await prisma.playerMatch.findMany({
    where: { matchId },
    include: { player: true },
  })

  const votes = await prisma.potmVote.groupBy({
    by: ["playerId"],
    where: { matchId },
    _count: { id: true },
  })

  const votesMap: Record<string, number> = {}
  for (const v of votes) {
    votesMap[v.playerId] = v._count.id
  }

  const players = performances
    .map(p => {
      const performance = {
        battingRuns: p.battingRuns,
        ballsFaced: p.ballsFaced,
        fours: p.fours,
        sixes: p.sixes,
        bowlingWickets: p.bowlingWickets,
        bowlingRuns: p.bowlingRuns,
        ballsBowled: p.ballsBowled,
        catches: p.catches,
        stumpings: p.stumpings,
        runOuts: p.runOuts,
      }
      const srBonus = performance.ballsFaced > 0 ? Math.round((performance.battingRuns / performance.ballsFaced) * 10) : 0
      const hasStats =
        performance.battingRuns > 0 ||
        performance.ballsBowled > 0 ||
        performance.catches > 0 ||
        performance.stumpings > 0 ||
        performance.runOuts > 0
      const score =
        performance.battingRuns +
        performance.bowlingWickets * 20 +
        (performance.catches + performance.stumpings + performance.runOuts) * 10 +
        srBonus
      return {
        ...p.player,
        performance,
        votes: votesMap[p.playerId] || 0,
        score,
        hasStats,
      }
    })
    .sort((a, b) => b.score - a.score || b.votes - a.votes)

  let userVote = null
  if (email) {
    const existing = await prisma.potmVote.findUnique({
      where: { matchId_email: { matchId, email } },
      include: { player: true },
    })
    if (existing) {
      userVote = { playerId: existing.playerId, playerName: existing.player.name, createdAt: existing.createdAt.toISOString() }
    }
  }

  const totalVotes = Object.values(votesMap).reduce((a, b) => a + b, 0)

  return NextResponse.json({ match, players, totalVotes, userVote })
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    const rl = rateLimit(`potm:${ip}`, RATE_LIMITS.POTM_VOTE)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many votes. Try again later." }, { status: 429 })
    }

    const body = await req.json()
    const parsed = potmVoteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { matchId, playerId, email } = parsed.data
    const { name } = body

    const verifiedEmail = verifyVerifiedEmailToken(parsed.data.verifiedToken)
    if (!verifiedEmail || verifiedEmail !== email.toLowerCase()) {
      return NextResponse.json({ error: "Email not verified. Please verify your email first." }, { status: 401 })
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match || match.status !== "completed") {
      return NextResponse.json({ error: "Match not found or not completed" }, { status: 404 })
    }

    const existing = await prisma.potmVote.findUnique({
      where: { matchId_email: { matchId, email } },
    })
    if (existing) {
      return NextResponse.json({ error: "You have already voted for this match" }, { status: 409 })
    }

    const vote = await prisma.potmVote.create({
      data: {
        matchId,
        playerId,
        email,
        name: name || "Anonymous",
      },
    })

    trackEvent("potm_vote", { matchId, playerId })

    Promise.all([
      prisma.player.findUnique({ where: { id: playerId }, select: { name: true } }),
      prisma.match.findUnique({ where: { id: matchId }, select: { matchNo: true } }),
    ]).then(([player, match]) =>
      notifyAdmin({
        title: "New Player of the Match Vote",
        rows: [
          { label: "Name", value: name || "Anonymous" },
          { label: "Email", value: email },
          { label: "Player", value: player?.name || playerId },
          { label: "Match", value: match?.matchNo ? `Match ${match.matchNo}` : matchId },
        ],
      })
    )

    return NextResponse.json({ success: true, vote })
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "You have already voted for this match" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to submit vote" }, { status: 500 })
  }
}
