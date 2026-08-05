import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"
import { teamCaptaincySchema } from "@/lib/validation"
import { WORKSPACE_OFFICIAL } from "@/lib/workspace"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get("teamId")
    const seasonId = searchParams.get("seasonId")

    const where: any = { season: { workspaceId: WORKSPACE_OFFICIAL } }
    if (teamId) where.teamId = teamId
    if (seasonId) {
      const season = await prisma.season.findFirst({ where: { id: seasonId, workspaceId: WORKSPACE_OFFICIAL } })
      if (!season) return NextResponse.json({ error: "Season not found" }, { status: 404 })
      where.seasonId = seasonId
    }

    const captaincies = await prisma.teamCaptaincy.findMany({
      where,
      include: {
        season: { select: { id: true, name: true, year: true } },
        team: { select: { id: true, name: true, shortName: true, logo: true, color: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    const playerIds = new Set<string>()
    for (const c of captaincies) {
      if (c.captainId) playerIds.add(c.captainId)
      if (c.viceCaptainId) playerIds.add(c.viceCaptainId)
    }
    const players = await prisma.player.findMany({ where: { id: { in: [...playerIds] } }, select: { id: true, name: true, photo: true } })
    const playerMap = new Map(players.map(p => [p.id, p]))

    return NextResponse.json(captaincies.map(c => ({ ...c, captain: playerMap.get(c.captainId) || null, viceCaptain: c.viceCaptainId ? playerMap.get(c.viceCaptainId) || null : null })))
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await isAdminAuthenticated()
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = teamCaptaincySchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { seasonId, teamId, captainId, viceCaptainId } = parsed.data
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

    const { assertSeasonUnlocked } = await import("@/lib/season-guard")
    const lockErr = await assertSeasonUnlocked(seasonId)
    if (lockErr) return NextResponse.json({ error: lockErr }, { status: 423 })

    const existing = await prisma.teamCaptaincy.findUnique({ where: { seasonId_teamId: { seasonId, teamId } } })

    let captaincy
    if (existing) {
      captaincy = await prisma.teamCaptaincy.update({
        where: { id: existing.id },
        data: { captainId, viceCaptainId: viceCaptainId || "" },
      })
    } else {
      captaincy = await prisma.teamCaptaincy.create({
        data: { seasonId, teamId, captainId, viceCaptainId: viceCaptainId || "" },
      })
    }

    await prisma.team.update({ where: { id: teamId }, data: { captainName: (await prisma.player.findUnique({ where: { id: captainId }, select: { name: true } }))?.name || "" } })
    await prisma.player.updateMany({ where: { teamId }, data: { isCaptain: false } })
    await prisma.player.update({ where: { id: captainId }, data: { isCaptain: true } })

    logAudit({ action: "upsert_captaincy", entity: "team", entityId: teamId, details: JSON.stringify({ seasonId, captainId, viceCaptainId }), ip })

    return NextResponse.json(captaincy)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await isAdminAuthenticated()
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

    await prisma.teamCaptaincy.delete({ where: { id } })
    logAudit({ action: "delete_captaincy", entity: "captaincy", entityId: id, ip })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
