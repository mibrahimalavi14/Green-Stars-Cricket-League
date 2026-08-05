import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"

export async function PATCH(req: Request) {
  try {
    const auth = await isAdminAuthenticated()
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { seasonId, teamId, warnings, behavior, sportsmanship, reason } = body

    if (!seasonId || !teamId) return NextResponse.json({ error: "seasonId and teamId are required" }, { status: 400 })

    const season = await prisma.season.findUnique({ where: { id: seasonId } })
    if (!season) return NextResponse.json({ error: "Season not found" }, { status: 404 })
    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 })

    const { assertSeasonUnlocked } = await import("@/lib/season-guard")
    const lockErr = await assertSeasonUnlocked(seasonId)
    if (lockErr) return NextResponse.json({ error: lockErr }, { status: 423 })

    const w = Math.max(0, Math.min(100, Math.floor(Number(warnings) || 0)))
    const b = Math.max(0, Math.min(100, Math.floor(Number(behavior) || 0)))
    const s = Math.max(0, Math.min(10, Math.floor(Number(sportsmanship) || 0)))

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

    const existing = await prisma.fairPlayRecord.findUnique({ where: { seasonId_teamId: { seasonId, teamId } } })

    await prisma.fairPlayRecord.upsert({
      where: { seasonId_teamId: { seasonId, teamId } },
      create: { seasonId, teamId, warnings: w, behavior: b, sportsmanship: s },
      update: { warnings: w, behavior: b, sportsmanship: s },
    })

    logAudit({
      action: "fair_play_update",
      entity: "team",
      entityId: teamId,
      details: JSON.stringify({
        season: season.name,
        old: existing ? { warnings: existing.warnings, behavior: existing.behavior, sportsmanship: existing.sportsmanship } : null,
        new: { warnings: w, behavior: b, sportsmanship: s },
        reason: (reason || "").slice(0, 500),
      }),
      ip,
    })

    return NextResponse.json({ success: true, warnings: w, behavior: b, sportsmanship: s })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
