import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"
import { seasonAwardSchema } from "@/lib/validation"

const CATEGORY_LABELS: Record<string, string> = {
  orange_cap: "Orange Cap",
  purple_cap: "Purple Cap",
  mvp: "MVP",
  best_batter: "Best Batter",
  best_bowler: "Best Bowler",
  emerging_player: "Emerging Player",
  fair_play: "Fair Play",
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const seasonId = searchParams.get("seasonId")

    const where: any = {}
    if (seasonId) where.seasonId = seasonId

    const awards = await prisma.seasonAward.findMany({
      where,
      include: {
        season: { select: { id: true, name: true, year: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    const playerIds = awards.filter(a => a.playerId).map(a => a.playerId)
    const teamIds = awards.filter(a => a.teamId).map(a => a.teamId)
    const [players, teams] = await Promise.all([
      playerIds.length ? prisma.player.findMany({ where: { id: { in: playerIds } }, select: { id: true, name: true, photo: true } }) : Promise.resolve([]),
      teamIds.length ? prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true, shortName: true, logo: true, color: true } }) : Promise.resolve([]),
    ])
    const playerMap = new Map(players.map(p => [p.id, p]))
    const teamMap = new Map(teams.map(t => [t.id, t]))

    return NextResponse.json(awards.map(a => ({
      ...a,
      categoryLabel: CATEGORY_LABELS[a.category] || a.category,
      player: a.playerId ? playerMap.get(a.playerId) || null : null,
      team: a.teamId ? teamMap.get(a.teamId) || null : null,
    })))
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await isAdminAuthenticated()
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = seasonAwardSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { seasonId, category, playerId, teamId, note } = parsed.data
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

    const existing = await prisma.seasonAward.findUnique({ where: { seasonId_category: { seasonId, category } } })

    let award
    if (existing) {
      award = await prisma.seasonAward.update({
        where: { id: existing.id },
        data: { playerId: playerId || "", teamId: teamId || "", note: note || "" },
      })
    } else {
      award = await prisma.seasonAward.create({
        data: { seasonId, category, playerId: playerId || "", teamId: teamId || "", note: note || "" },
      })
    }

    logAudit({ action: "upsert_season_award", entity: "season", entityId: seasonId, details: JSON.stringify({ category, playerId, teamId }), ip })

    return NextResponse.json(award)
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

    await prisma.seasonAward.delete({ where: { id } })
    logAudit({ action: "delete_season_award", entity: "award", entityId: id, ip })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
