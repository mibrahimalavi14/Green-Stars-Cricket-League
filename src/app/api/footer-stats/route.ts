import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const season = await prisma.season.findFirst({ where: { isActive: true } })
  if (!season) return NextResponse.json({ teams: 0, players: 0, matches: 0 })

  const teams = await prisma.team.count({ where: { seasonId: season.id } })
  const players = await prisma.player.count({ where: { team: { seasonId: season.id } } })
  const matches = await prisma.match.count({ where: { seasonId: season.id } })

  return NextResponse.json({
    season: season.name,
    year: season.year,
    teams,
    players,
    matches,
  })
}
