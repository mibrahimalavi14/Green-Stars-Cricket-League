import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.match.updateMany({
    where: { status: "upcoming", date: { lte: new Date() } },
    data: { status: "live" },
  })
  const { recalcPlayerStats } = await import("@/lib/stats")
  await recalcPlayerStats()
  const matches = await prisma.match.findMany({
    include: { team1: true, team2: true, season: true, innings: true, performances: { include: { player: true } } },
    orderBy: { date: "asc" },
  })
  return NextResponse.json(matches)
}

export async function POST(req: Request) {
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
  const body = await req.json()
  const { id, ...data } = body
  const match = await prisma.match.update({ where: { id }, data })

  if (data.status === "completed") {
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
  const { id } = await req.json()
  const match = await prisma.match.findUnique({ where: { id }, select: { status: true, seasonId: true } })
  await prisma.playerMatch.deleteMany({ where: { matchId: id } })
  await prisma.match.delete({ where: { id } })
  if (match?.status === "completed") {
    const { recalcPointsTable, recalcPlayerStats } = await import("@/lib/stats")
    await recalcPointsTable(match.seasonId)
    await recalcPlayerStats()
  }
  return NextResponse.json({ success: true })
}
