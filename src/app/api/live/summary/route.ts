import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get("matchId")
  if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 })

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { team1: true, team2: true, innings: true },
  })

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })

  const innings = match.innings.map((inn) => ({
    ...inn,
    ballsData: JSON.parse(inn.ballsData || "[]"),
  }))

  const team1Players = await prisma.player.findMany({
    where: { teamId: match.team1Id },
    select: { id: true, name: true, role: true },
  })

  const team2Players = await prisma.player.findMany({
    where: { teamId: match.team2Id },
    select: { id: true, name: true, role: true },
  })

  return NextResponse.json({
    match: {
      id: match.id,
      team1: match.team1,
      team2: match.team2,
      team1Score: match.team1Score,
      team2Score: match.team2Score,
      status: match.status,
      result: match.result,
      venue: match.venue,
      date: match.date,
      tossWinner: match.tossWinner,
      tossDecision: match.tossDecision,
      inningsBreak: match.inningsBreak,
      customHighlights: match.customHighlights || "",
    },
    innings,
    team1Players,
    team2Players,
  })
}
