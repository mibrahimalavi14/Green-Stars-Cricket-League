import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { computeFairPlayTable } from "@/lib/fair-play"
import { WORKSPACE_OFFICIAL } from "@/lib/workspace"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const seasonId = searchParams.get("seasonId")

  const season = seasonId
    ? await prisma.season.findFirst({ where: { id: seasonId, workspaceId: WORKSPACE_OFFICIAL } })
    : await prisma.season.findFirst({ where: { isActive: true, workspaceId: WORKSPACE_OFFICIAL } })

  if (!season) return NextResponse.json({ season: null, teams: [] })

  const teams = await computeFairPlayTable(season.id)

  return NextResponse.json({
    season: { id: season.id, name: season.name, year: season.year },
    teams,
  })
}
