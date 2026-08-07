import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { trackEvent } from "@/lib/analytics"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { playerOfSeasonVoteSchema } from "@/lib/validation"
import { WORKSPACE_OFFICIAL } from "@/lib/workspace"

interface Nominee {
  id: string
  name: string
  role: string
  photo: string
  teamId: string
  teamName: string
  teamShortName: string
  teamLogo: string
  runs: number
  wickets: number
  catches: number
  innings: number
  impact: number
  votes: number
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const seasonId = searchParams.get("seasonId")
  const email = searchParams.get("email")

  let season
  if (seasonId) {
    season = await prisma.season.findFirst({
      where: { id: seasonId, workspaceId: WORKSPACE_OFFICIAL },
      include: { teams: true },
    })
  } else {
    season = await prisma.season.findFirst({
      where: { workspaceId: WORKSPACE_OFFICIAL, isActive: true },
      include: { teams: true },
      orderBy: { year: "desc" },
    })
  }

  if (!season) return NextResponse.json({ error: "Season not found" }, { status: 404 })

  const [perfs, votes] = await Promise.all([
    prisma.playerMatch.findMany({
      where: { match: { seasonId: season.id, status: "completed" } },
      select: {
        playerId: true,
        teamId: true,
        battingRuns: true,
        bowlingWickets: true,
        catches: true,
        player: { select: { name: true, role: true, photo: true, teamId: true, team: { select: { name: true, shortName: true, logo: true } } } },
      },
    }),
    prisma.playerOfSeasonVote.groupBy({
      by: ["playerId"],
      where: { seasonId: season.id },
      _count: { id: true },
    }),
  ])
  const votesMap: Record<string, number> = {}
  for (const v of votes) votesMap[v.playerId] = v._count.id

  const aggMap = new Map<string, { runs: number; wickets: number; catches: number; innings: number }>()
  for (const p of perfs) {
    const a = aggMap.get(p.playerId) || { runs: 0, wickets: 0, catches: 0, innings: 0 }
    a.runs += p.battingRuns
    a.wickets += p.bowlingWickets
    a.catches += p.catches
    a.innings++
    aggMap.set(p.playerId, a)
  }

  const seen = new Set<string>()
  const nominees: Nominee[] = []
  for (const p of perfs) {
    if (seen.has(p.playerId)) continue
    seen.add(p.playerId)
    const a = aggMap.get(p.playerId)!
    nominees.push({
      id: p.playerId,
      name: p.player.name,
      role: p.player.role,
      photo: p.player.photo,
      teamId: p.player.teamId,
      teamName: p.player.team?.name || "",
      teamShortName: p.player.team?.shortName || "",
      teamLogo: p.player.team?.logo || "",
      runs: a.runs,
      wickets: a.wickets,
      catches: a.catches,
      innings: a.innings,
      impact: a.runs + a.wickets * 20 + a.catches * 10,
      votes: votesMap[p.playerId] || 0,
    })
  }

  nominees.sort((a, b) => b.votes - a.votes || b.impact - a.impact)
  const totalVotes = Object.values(votesMap).reduce((a, b) => a + b, 0)

  let userVote = null
  if (email) {
    const existing = await prisma.playerOfSeasonVote.findUnique({
      where: { seasonId_email: { seasonId: season.id, email } },
      include: { player: true },
    })
    if (existing) userVote = { playerId: existing.playerId, playerName: existing.player.name }
  }

  return NextResponse.json({
    season: { id: season.id, name: season.name, year: season.year },
    nominees,
    totalVotes,
    userVote,
  })
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    const rl = rateLimit(`player_of_season:${ip}`, RATE_LIMITS.PLAYER_OF_SEASON_VOTE)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many votes. Try again later." }, { status: 429 })
    }

    const body = await req.json()
    const parsed = playerOfSeasonVoteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { seasonId, playerId, email } = parsed.data
    const { name } = body

    const season = await prisma.season.findFirst({
      where: { id: seasonId, workspaceId: WORKSPACE_OFFICIAL },
      include: { teams: true },
    })
    if (!season) return NextResponse.json({ error: "Season not found" }, { status: 404 })

    const player = await prisma.player.findFirst({
      where: { id: playerId, team: { seasonId } },
      select: { id: true },
    })
    if (!player) return NextResponse.json({ error: "Player not found in this season" }, { status: 404 })

    const existing = await prisma.playerOfSeasonVote.findUnique({
      where: { seasonId_email: { seasonId, email } },
    })
    if (existing) {
      return NextResponse.json({ error: "You have already voted for this season" }, { status: 409 })
    }

    const vote = await prisma.playerOfSeasonVote.create({
      data: { seasonId, playerId, email, name: name || "Anonymous" },
    })

    trackEvent("player_of_season_vote", { seasonId, playerId })

    return NextResponse.json({ success: true, vote })
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "You have already voted for this season" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to submit vote" }, { status: 500 })
  }
}
