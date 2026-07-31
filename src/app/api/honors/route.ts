import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"
import { teamHonorSchema } from "@/lib/validation"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get("teamId")
    const seasonId = searchParams.get("seasonId")

    const where: any = {}
    if (teamId) where.teamId = teamId
    if (seasonId) where.seasonId = seasonId

    const honors = await prisma.teamHonor.findMany({
      where,
      include: {
        season: { select: { id: true, name: true, year: true } },
        team: { select: { id: true, name: true, shortName: true, logo: true, color: true } },
      },
      orderBy: [{ createdAt: "asc" }],
    })

    return NextResponse.json(honors)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await isAdminAuthenticated()
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = teamHonorSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { seasonId, teamId, title, note } = parsed.data
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

    const honor = await prisma.teamHonor.create({
      data: { seasonId, teamId, title, note: note || "" },
    })

    logAudit({ action: "create_team_honor", entity: "team", entityId: teamId, details: JSON.stringify({ seasonId, title }), ip })

    return NextResponse.json(honor)
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

    await prisma.teamHonor.delete({ where: { id } })
    logAudit({ action: "delete_team_honor", entity: "honor", entityId: id, ip })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
