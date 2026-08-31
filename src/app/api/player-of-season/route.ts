import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
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
  runOuts: number
  stumpings: number
  innings: number
  impact: number
}

const MIN_INNINGS = 3

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const seasonId = searchParams.get("seasonId")

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

  const perfs = await prisma.playerMatch.findMany({
    where: { match: { seasonId: season.id, status: "completed" } },
    select: {
      playerId: true,
      teamId: true,
      battingRuns: true,
      bowlingWickets: true,
      catches: true,
      runOuts: true,
      stumpings: true,
      player: { select: { name: true, role: true, photo: true, teamId: true, team: { select: { name: true, shortName: true, logo: true } } } },
    },
  })

  const aggMap = new Map<string, { runs: number; wickets: number; catches: number; runOuts: number; stumpings: number; innings: number }>()
  for (const p of perfs) {
    const a = aggMap.get(p.playerId) || { runs: 0, wickets: 0, catches: 0, runOuts: 0, stumpings: 0, innings: 0 }
    a.runs += p.battingRuns
    a.wickets += p.bowlingWickets
    a.catches += p.catches
    a.runOuts += p.runOuts
    a.stumpings += p.stumpings
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
      runOuts: a.runOuts,
      stumpings: a.stumpings,
      innings: a.innings,
      impact: a.runs + a.wickets * 20 + a.catches * 10 + a.runOuts * 10 + a.stumpings * 10,
    })
  }

  nominees.sort((a, b) => b.impact - a.impact)

  const winners = nominees.filter(n => n.innings >= MIN_INNINGS)

  return NextResponse.json({
    season: { id: season.id, name: season.name, year: season.year },
    nominees,
    winners,
    minInnings: MIN_INNINGS,
  })
}
