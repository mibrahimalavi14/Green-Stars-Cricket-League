import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { WORKSPACE_OFFICIAL } from "@/lib/workspace"

export async function GET() {
  const players = await prisma.player.findMany({
    where: { team: { season: { workspaceId: WORKSPACE_OFFICIAL } } },
    include: { team: { select: { name: true, shortName: true } } },
    orderBy: { runs: "desc" },
  })

  const headers = ["Name", "Team", "Role", "Batting Style", "Bowling Style", "Matches", "Runs", "Balls Faced", "Fours", "Sixes", "50s", "100s", "Wickets", "Balls Bowled", "Runs Conceded", "Catches", "Stumpings", "Run Outs"]
  const rows = players.map(p => [
    p.name, p.team?.name || "", p.role, p.battingStyle, p.bowlingStyle,
    p.matchesPlayed, p.runs, p.ballsFaced, p.fours, p.sixes,
    p.fifties, p.hundreds, p.wickets, p.ballsBowled, p.runsConceded,
    p.catches, p.stumpings, p.runOuts,
  ])

  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=players.csv" },
  })
}
