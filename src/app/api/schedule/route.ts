import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentWorkspaceId } from "@/lib/workspace"

export const dynamic = "force-dynamic"

export async function GET() {
  const workspaceId = await getCurrentWorkspaceId()
  const season = await prisma.season.findFirst({ where: { isActive: true, workspaceId } })
  if (!season) return NextResponse.json({ season: null, fixtures: [], formatText: null, scheduleImage: null })

  const fixtures = await prisma.seasonFixture.findMany({
    where: { seasonId: season.id },
    orderBy: { matchNumber: "asc" },
  })

  return NextResponse.json({
    season: { id: season.id, name: season.name, year: season.year },
    formatText: season.formatText || null,
    scheduleImage: season.scheduleImage || null,
    fixtures: fixtures.map(f => ({
      id: f.id,
      matchNumber: f.matchNumber,
      team1Name: f.team1Name,
      team2Name: f.team2Name,
      dateTime: f.dateTime?.toISOString() || null,
      venue: f.venue || null,
      result: f.result || null,
      status: f.status,
    })),
  })
}
