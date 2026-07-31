import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"
import { leaguePenaltySchema } from "@/lib/validation"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const seasonId = searchParams.get("seasonId")
    const teamId = searchParams.get("teamId")

    const where: any = {}
    if (seasonId) where.seasonId = seasonId
    if (teamId) where.teamId = teamId

    const penalties = await prisma.leaguePenalty.findMany({
      where,
      include: {
        season: { select: { id: true, name: true, year: true } },
        team: { select: { id: true, name: true, shortName: true, logo: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const matchIds = penalties.filter(p => p.matchId).map(p => p.matchId)
    const matches = matchIds.length ? await prisma.match.findMany({ where: { id: { in: matchIds } }, select: { id: true, matchNo: true, team1: { select: { shortName: true } }, team2: { select: { shortName: true } } } }) : []
    const matchMap = new Map(matches.map(m => [m.id, m]))

    return NextResponse.json(penalties.map(p => ({ ...p, match: p.matchId ? matchMap.get(p.matchId) || null : null })))
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await isAdminAuthenticated()
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = leaguePenaltySchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { seasonId, teamId, matchId, type, points, description } = parsed.data
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

    const penalty = await prisma.leaguePenalty.create({
      data: { seasonId, teamId, matchId: matchId || "", type, points, description: description || "" },
    })

    logAudit({ action: "create_penalty", entity: "team", entityId: teamId, details: JSON.stringify({ type, points, matchId, description }), ip })

    return NextResponse.json(penalty)
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

    await prisma.leaguePenalty.delete({ where: { id } })
    logAudit({ action: "delete_penalty", entity: "penalty", entityId: id, ip })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
