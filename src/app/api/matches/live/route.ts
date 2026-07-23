import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const match = await prisma.match.findFirst({
    where: { status: "live" },
    include: { team1: true, team2: true, innings: true },
  })

  if (!match) return NextResponse.json(null)

  const [team1Players, team2Players] = await Promise.all([
    prisma.player.findMany({ where: { teamId: match.team1Id }, select: { id: true, name: true } }),
    prisma.player.findMany({ where: { teamId: match.team2Id }, select: { id: true, name: true } }),
  ])

  return NextResponse.json({ ...match, team1Players, team2Players })
}
