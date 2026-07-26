import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { recalcPointsTable } from "@/lib/stats"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const seasonId = searchParams.get("seasonId")
    const type = searchParams.get("type") || "points"

    if (!seasonId) return NextResponse.json({ error: "seasonId required" }, { status: 400 })

    if (type === "points") {
      const table = await recalcPointsTable(seasonId)
      const header = "Position,Team,Short Name,Played,Won,Lost,Tied,No Result,Points,NRR,Runs For,Balls For,Runs Against,Balls Against"
      const rows = table.map((t, i) => `${i + 1},"${t.name}","${t.shortName}",${t.played},${t.won},${t.lost},${t.tied},${t.nr},${t.points},${t.nrr.toFixed(3)},${t.forRuns},${t.forBalls},${t.againstRuns},${t.againstBalls}`)
      return new NextResponse([header, ...rows].join("\n"), {
        headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="points-table-${seasonId}.csv"` },
      })
    }

    if (type === "players") {
      const players = await prisma.player.findMany({
        where: { team: { seasonId } },
        include: { team: { select: { name: true, shortName: true } } },
      })
      const header = "Player,Team,Role,Matches,Runs,Balls Faced,Average,Strike Rate,Wickets,Bowling Balls,Bowling Average,Economy,Best Bowling"
      const rows = players.map(p => {
        const avg = p.dismissals > 0 ? (p.runs / p.dismissals).toFixed(2) : "N/A"
        const sr = p.ballsFaced > 0 ? ((p.runs / p.ballsFaced) * 100).toFixed(2) : "N/A"
        const bowlAvg = p.wickets > 0 ? (p.runsConceded / p.wickets).toFixed(2) : "N/A"
        const eco = p.ballsBowled > 0 ? ((p.runsConceded / p.ballsBowled) * 6).toFixed(2) : "N/A"
        const bestBowl = p.bestBowlingWickets > 0 ? `${p.bestBowlingWickets}/${p.bestBowlingRuns}` : ""
        return `"${p.name}","${p.team?.shortName || ""}","${p.role}",${p.matchesPlayed},${p.runs},${p.ballsFaced},${avg},${sr},${p.wickets},${p.ballsBowled},${bowlAvg},${eco},"${bestBowl}"`
      })
      return new NextResponse([header, ...rows].join("\n"), {
        headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="player-stats-${seasonId}.csv"` },
      })
    }

    if (type === "matches") {
      const matches = await prisma.match.findMany({
        where: { seasonId },
        orderBy: { matchNo: "asc" },
        include: { team1: { select: { name: true, shortName: true } }, team2: { select: { name: true, shortName: true } }, innings: true },
      })
      const header = "Match No,Date,Team 1,Team 2,Status,Winner,Result,T1 Score,T2 Score,Venue,Man of Match"
      const rows = matches.map(m => {
        const inn1 = m.innings.find(i => i.teamId === m.team1Id)
        const inn2 = m.innings.find(i => i.teamId === m.team2Id)
        const t1Score = inn1 ? `${inn1.runs + inn1.extras}/${inn1.wickets} (${Math.floor(inn1.balls / 6)}.${inn1.balls % 6})` : "-"
        const t2Score = inn2 ? `${inn2.runs + inn2.extras}/${inn2.wickets} (${Math.floor(inn2.balls / 6)}.${inn2.balls % 6})` : "-"
        return `${m.matchNo},"${m.date?.toISOString().split("T")[0] || ""}","${m.team1.shortName}","${m.team2.shortName}","${m.status}","${m.winnerTeamId || ""}","${m.result.replace(/"/g, '""')}","${t1Score}","${t2Score}","${m.venue || ""}","${m.manOfMatch || ""}"`
      })
      return new NextResponse([header, ...rows].join("\n"), {
        headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="matches-${seasonId}.csv"` },
      })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
