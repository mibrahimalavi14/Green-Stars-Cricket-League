import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get("matchId")

  const where = matchId ? { matchId } : {}
  const members = await prisma.squadMember.findMany({
    where,
    include: { player: { select: { name: true, role: true, photo: true } } },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(members)
}

export async function POST(req: Request) {
  const { matchId, playerId, teamId, role } = await req.json()
  if (!matchId || !playerId) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const existing = await prisma.squadMember.findUnique({ where: { matchId_playerId: { matchId, playerId } } })
  if (existing) {
    const m = await prisma.squadMember.update({ where: { id: existing.id }, data: { role: role || "playing" } })
    return NextResponse.json(m)
  }

  const m = await prisma.squadMember.create({ data: { matchId, playerId, teamId: teamId || "", role: role || "playing" } })
  return NextResponse.json(m)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
  await prisma.squadMember.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
