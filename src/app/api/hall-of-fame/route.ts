import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const seasons = await prisma.season.findMany({
    orderBy: { year: "desc" },
  })

  const data = await Promise.all(seasons.map(async (s) => {
    let winner = null, runnerUp = null
    if (s.winnerId) {
      winner = await prisma.team.findUnique({ where: { id: s.winnerId }, select: { name: true, shortName: true, logo: true, color: true } })
      const matches = await prisma.match.findMany({
        where: { seasonId: s.id, status: "completed", result: { not: "" } },
        orderBy: { date: "desc" },
        take: 1,
      })
    }
    const matchCount = await prisma.match.count({ where: { seasonId: s.id } })
    const teamCount = await prisma.team.count({ where: { seasonId: s.id } })

    return {
      id: s.id,
      name: s.name,
      year: s.year,
      isActive: s.isActive,
      winner: winner ? { name: winner.name, shortName: winner.shortName, logo: winner.logo, color: winner.color } : null,
      matchCount,
      teamCount,
    }
  }))

  return NextResponse.json(data)
}
