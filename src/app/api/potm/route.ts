import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { trackEvent } from "@/lib/analytics"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { potmVoteSchema } from "@/lib/validation"

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

  const players = performances.map(p => ({
    ...p.player,
    performance: {
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
    },
    votes: votesMap[p.playerId] || 0,
  }))

  let userVote = null
  if (email) {
    const existing = await prisma.potmVote.findUnique({
      where: { matchId_email: { matchId, email } },
      include: { player: true },
    })
    if (existing) {
      userVote = { playerId: existing.playerId, playerName: existing.player.name }
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

    return NextResponse.json({ success: true, vote })
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "You have already voted for this match" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to submit vote" }, { status: 500 })
  }
}
