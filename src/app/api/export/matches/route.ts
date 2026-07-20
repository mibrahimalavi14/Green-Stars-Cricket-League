import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const matches = await prisma.match.findMany({
    include: { team1: true, team2: true, season: true },
    orderBy: { date: "desc" },
  })

  const headers = ["Match No", "Date", "Season", "Team 1", "Team 2", "Venue", "Status", "Result", "Toss Winner", "Toss Decision", "Team 1 Score", "Team 2 Score", "MOTM"]
  const rows = matches.map(m => [
    m.matchNo, m.date.toISOString().split("T")[0], m.season?.name || "",
    m.team1?.name || "", m.team2?.name || "", m.venue, m.status,
    m.result, m.tossWinner, m.tossDecision, m.team1Score, m.team2Score, m.manOfMatch,
  ])

  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=matches.csv" },
  })
}
