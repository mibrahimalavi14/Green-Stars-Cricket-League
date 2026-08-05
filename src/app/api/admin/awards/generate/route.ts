import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"
import { autoGenerateSeasonAwards } from "@/lib/season-awards"

export async function POST(req: Request) {
  try {
    const auth = await isAdminAuthenticated()
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const seasonId = body?.seasonId
    if (!seasonId) return NextResponse.json({ error: "seasonId is required" }, { status: 400 })

    const season = await prisma.season.findUnique({ where: { id: seasonId } })
    if (!season) return NextResponse.json({ error: "Season not found" }, { status: 404 })

    const { assertSeasonUnlocked } = await import("@/lib/season-guard")
    const lockErr = await assertSeasonUnlocked(seasonId)
    if (lockErr) return NextResponse.json({ error: lockErr }, { status: 423 })

    const { count } = await autoGenerateSeasonAwards(seasonId)

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    logAudit({
      action: "season_awards_generated",
      entity: "season",
      entityId: seasonId,
      details: JSON.stringify({ count, season: season.name }),
      ip,
    })

    return NextResponse.json({ success: true, count })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
