import { NextResponse } from "next/server"
import { computeAllRecords } from "@/lib/records"
import { prisma } from "@/lib/prisma"

export const revalidate = 60

export async function GET() {
  const { teamRecords, playerRecords } = await computeAllRecords()

  const season = await prisma.season.findFirst({ where: { isActive: true } })

  return NextResponse.json({
    season: season ? { id: season.id, name: season.name, year: season.year } : null,
    teamRecords,
    playerRecords,
  })
}
