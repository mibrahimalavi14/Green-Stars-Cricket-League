import { NextResponse } from "next/server"
import { computeAllRecords } from "@/lib/records"
import { prisma } from "@/lib/prisma"
import { WORKSPACE_OFFICIAL } from "@/lib/workspace"

export const revalidate = 60

export async function GET() {
  const { teamRecords, playerRecords } = await computeAllRecords(WORKSPACE_OFFICIAL)

  const season = await prisma.season.findFirst({ where: { isActive: true, workspaceId: WORKSPACE_OFFICIAL } })

  return NextResponse.json({
    season: season ? { id: season.id, name: season.name, year: season.year } : null,
    teamRecords,
    playerRecords,
  })
}
