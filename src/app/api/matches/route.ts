import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"

export async function GET() {
  await prisma.match.updateMany({
    where: { status: "upcoming", date: { lte: new Date() } },
    data: { status: "live" },
  })
  const matches = await prisma.match.findMany({
    include: { team1: true, team2: true, season: true, innings: true, performances: { include: { player: true } } },
    orderBy: { date: "asc" },
  })
  return NextResponse.json(matches)
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const seasonId = body.seasonId
  let matchNo = body.matchNo
  if (seasonId && !matchNo) {
    const last = await prisma.match.findFirst({
      where: { seasonId },
      orderBy: { matchNo: "desc" },
      select: { matchNo: true },
    })
    matchNo = (last?.matchNo ?? 0) + 1
  }
  const match = await prisma.match.create({
    data: { ...body, matchNo, date: new Date(body.date) },
  })
  return NextResponse.json(match)
}

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || ""
  const body = await req.json()
  const { id, ...data } = body
  const match = await prisma.match.update({ where: { id }, data })

  logAudit({ action: "match_updated", entity: "match", entityId: id, details: JSON.stringify(Object.keys(data)), ip })

  if (data.status === "completed") {
    logAudit({ action: "match_completed", entity: "match", entityId: id, details: JSON.stringify({ result: data.result, manOfMatch: data.manOfMatch }), ip })
    const fullMatch = await prisma.match.findUnique({
      where: { id },
      select: { seasonId: true },
    })
    if (fullMatch) {
      const { recalcPointsTable, recalcPlayerStats } = await import("@/lib/stats")
      await recalcPointsTable(fullMatch.seasonId)
      await recalcPlayerStats()
    }
  }

  return NextResponse.json(match)
}

export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || ""
  const { id } = await req.json()
  const match = await prisma.match.findUnique({ where: { id }, select: { status: true, seasonId: true, team1Id: true, team2Id: true } })
  await prisma.playerMatch.deleteMany({ where: { matchId: id } })
  await prisma.match.delete({ where: { id } })

  logAudit({ action: "match_deleted", entity: "match", entityId: id, details: JSON.stringify({ wasStatus: match?.status }), ip })

  if (match?.status === "completed") {
    const { recalcPointsTable, recalcPlayerStats } = await import("@/lib/stats")
    await recalcPointsTable(match.seasonId)
    await recalcPlayerStats()
  }
  return NextResponse.json({ success: true })
}
