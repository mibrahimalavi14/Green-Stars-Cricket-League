import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"
import { playerTransferSchema } from "@/lib/validation"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const playerId = searchParams.get("playerId")
    const seasonId = searchParams.get("seasonId")

    const where: any = {}
    if (playerId) where.playerId = playerId
    if (seasonId) where.seasonId = seasonId

    const transfers = await prisma.playerTransfer.findMany({
      where,
      include: {
        player: { select: { id: true, name: true, photo: true } },
        season: { select: { id: true, name: true, year: true } },
      },
      orderBy: [{ transferDate: "desc" }, { createdAt: "desc" }],
    })

    const teamIds = new Set<string>()
    for (const t of transfers) {
      if (t.fromTeamId) teamIds.add(t.fromTeamId)
      teamIds.add(t.toTeamId)
    }
    const teams = await prisma.team.findMany({ where: { id: { in: [...teamIds] } }, select: { id: true, name: true, shortName: true } })
    const teamMap = new Map(teams.map(t => [t.id, t]))

    return NextResponse.json(transfers.map(t => ({ ...t, fromTeam: t.fromTeamId ? teamMap.get(t.fromTeamId) || null : null, toTeam: teamMap.get(t.toTeamId) || null })))
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await isAdminAuthenticated()
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = playerTransferSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { playerId, seasonId, fromTeamId, toTeamId, transferDate, reason } = parsed.data
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

    const transfer = await prisma.playerTransfer.create({
      data: {
        playerId,
        seasonId,
        fromTeamId: fromTeamId || "",
        toTeamId,
        transferDate: transferDate ? new Date(transferDate) : new Date(),
        reason: reason || "",
      },
    })

    await prisma.player.update({ where: { id: playerId }, data: { teamId: toTeamId } })

    logAudit({ action: "create_transfer", entity: "player", entityId: playerId, details: JSON.stringify({ fromTeamId, toTeamId, seasonId, reason }), ip })

    return NextResponse.json(transfer)
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

    await prisma.playerTransfer.delete({ where: { id } })
    logAudit({ action: "delete_transfer", entity: "transfer", entityId: id, ip })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
