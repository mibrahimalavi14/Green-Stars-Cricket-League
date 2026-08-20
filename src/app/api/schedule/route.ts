import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentWorkspaceId } from "@/lib/workspace"

export const dynamic = "force-dynamic"

export async function GET() {
  const workspaceId = await getCurrentWorkspaceId()
  const season = await prisma.season.findFirst({ where: { isActive: true, workspaceId } })
  if (!season) return NextResponse.json({ season: null, scheduleImage: null, formatImage: null })

  return NextResponse.json({
    season: { id: season.id, name: season.name, year: season.year },
    scheduleImage: season.scheduleImage || null,
    formatImage: season.formatImage || null,
  })
}
