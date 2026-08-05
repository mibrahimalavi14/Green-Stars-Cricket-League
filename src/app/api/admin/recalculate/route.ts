import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"

export async function POST(req: Request) {
  try {
    const auth = await isAdminAuthenticated()
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { action, seasonId, matchId } = body as { action?: string; seasonId?: string; matchId?: string }
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

    if (action === "recalc_match" && matchId) {
      const { recalcPlayerStats } = await import("@/lib/stats")
      const { saveSeasonSnapshot } = await import("@/lib/snapshots")
      const match = await prisma.match.findUnique({ where: { id: matchId } })
      if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })

      await recalcPlayerStats(match.seasonId || undefined)
      if (match.status === "completed" && match.seasonId) {
        await saveSeasonSnapshot(match.seasonId, matchId)
      }
      logAudit({ action: "recalc_match", entity: "match", entityId: matchId, details: JSON.stringify({ seasonId: match.seasonId }), ip })
      return NextResponse.json({ success: true, message: "Match stats recalculated" })
    }

    if (action === "recalc_season" && seasonId) {
      const { recalcPointsTable, recalcPlayerStats } = await import("@/lib/stats")
      await recalcPointsTable(seasonId)
      await recalcPlayerStats(seasonId)

      const matches = await prisma.match.findMany({ where: { seasonId, status: "completed" }, select: { id: true } })
      const { saveSeasonSnapshot } = await import("@/lib/snapshots")
      for (const m of matches) {
        await saveSeasonSnapshot(seasonId, m.id)
      }
      logAudit({ action: "recalc_season", entity: "season", entityId: seasonId, details: JSON.stringify({ matches: matches.length }), ip })
      return NextResponse.json({ success: true, message: `Season recalculated (${matches.length} matches)` })
    }

    if (action === "recalc_all") {
      const { recalcEverything } = await import("@/lib/snapshots")
      const result = await recalcEverything()
      logAudit({ action: "recalc_all", entity: "system", details: JSON.stringify(result), ip })
      return NextResponse.json({ success: true, message: `All seasons recalculated (${result.seasonsReprocessed} seasons)` })
    }

    if (action === "restore_match" && matchId) {
      const match = await prisma.match.findUnique({ where: { id: matchId }, select: { seasonId: true } })
      if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })

      const { recalcPlayerStats, recalcPointsTable } = await import("@/lib/stats")
      await recalcPointsTable(match.seasonId)
      await recalcPlayerStats(match.seasonId)
      logAudit({ action: "restore_match", entity: "match", entityId: matchId, ip })
      return NextResponse.json({ success: true, message: "Match restored" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 })
  }
}
