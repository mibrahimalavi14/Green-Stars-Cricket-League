import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const team1Id = searchParams.get("team1Id")
  const team2Id = searchParams.get("team2Id")

  if (!team1Id || !team2Id) {
    return NextResponse.json({ error: "Both team1Id and team2Id required" }, { status: 400 })
  }

  const [team1, team2] = await Promise.all([
    prisma.team.findUnique({ where: { id: team1Id } }),
    prisma.team.findUnique({ where: { id: team2Id } }),
  ])

  if (!team1 || !team2) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 })
  }

  const matches = await prisma.match.findMany({
    where: {
      status: "completed",
      OR: [
        { team1Id, team2Id },
        { team1Id: team2Id, team2Id: team1Id },
      ],
    },
    include: { team1: true, team2: true },
    orderBy: { date: "asc" },
  })

  let team1Wins = 0
  let team2Wins = 0
  let team1Highest = 0
  let team2Highest = 0

  for (const match of matches) {
    const t1IsTeam1 = match.team1Id === team1Id

    const t1Runs = parseInt(match.team1Score) || 0
    const t2Runs = parseInt(match.team2Score) || 0

    const myRuns = t1IsTeam1 ? t1Runs : t2Runs
    const oppRuns = t1IsTeam1 ? t2Runs : t1Runs

    if (myRuns > team1Highest) team1Highest = myRuns
    if (oppRuns > team2Highest) team2Highest = oppRuns

    if (match.result.includes(team1.name) || match.result.includes(team1.shortName)) {
      team1Wins++
    } else if (match.result.includes(team2.name) || match.result.includes(team2.shortName)) {
      team2Wins++
    }
  }

  return NextResponse.json({
    team1,
    team2,
    matches,
    team1Wins,
    team2Wins,
    totalMatches: matches.length,
    team1Highest,
    team2Highest,
  })
}
