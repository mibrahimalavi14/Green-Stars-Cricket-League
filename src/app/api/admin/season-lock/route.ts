import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"

export async function PATCH(req: Request) {
  try {
    const auth = await isAdminAuthenticated()
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { seasonId, isLocked, reason } = body
    if (!seasonId) return NextResponse.json({ error: "seasonId is required" }, { status: 400 })

    const season = await prisma.season.findUnique({ where: { id: seasonId } })
    if (!season) return NextResponse.json({ error: "Season not found" }, { status: 404 })

    const locked = !!isLocked
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

    await prisma.season.update({
      where: { id: seasonId },
      data: {
        isLocked: locked,
        lockedReason: locked ? (reason || "").slice(0, 500) : "",
        lockedAt: locked ? new Date() : null,
      },
    })

    logAudit({
      action: locked ? "season_locked" : "season_unlocked",
      entity: "season",
      entityId: seasonId,
      details: JSON.stringify({ season: season.name, reason: (reason || "").slice(0, 500) }),
      ip,
    })

    return NextResponse.json({ success: true, isLocked: locked })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
