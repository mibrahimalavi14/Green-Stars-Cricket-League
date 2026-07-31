import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const recent = searchParams.get("recent") === "1"

  const match = await prisma.match.findFirst({
    where: { status: "live" },
    include: { team1: true, team2: true, innings: true },
  })

  if (!match && recent) {
    const recentCompleted = await prisma.match.findFirst({
      where: {
        status: "completed",
        updatedAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      },
      orderBy: { updatedAt: "desc" },
      include: { team1: true, team2: true, innings: true },
    })
    if (!recentCompleted) return NextResponse.json(null)
    const [team1Players, team2Players] = await Promise.all([
      prisma.player.findMany({ where: { teamId: recentCompleted.team1Id }, select: { id: true, name: true, jerseyNumber: true } }),
      prisma.player.findMany({ where: { teamId: recentCompleted.team2Id }, select: { id: true, name: true, jerseyNumber: true } }),
    ])
    return NextResponse.json({ ...recentCompleted, team1Players, team2Players })
  }

  if (!match) return NextResponse.json(null)

  const [team1Players, team2Players] = await Promise.all([
    prisma.player.findMany({ where: { teamId: match.team1Id }, select: { id: true, name: true, jerseyNumber: true } }),
    prisma.player.findMany({ where: { teamId: match.team2Id }, select: { id: true, name: true, jerseyNumber: true } }),
  ])

  return NextResponse.json({ ...match, team1Players, team2Players })
}
