import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { WORKSPACE_OFFICIAL } from "@/lib/workspace"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const seasonId = searchParams.get("seasonId")
    const matchId = searchParams.get("matchId")

    if (!seasonId) {
      return NextResponse.json({ error: "seasonId required" }, { status: 400 })
    }

    const season = await prisma.season.findFirst({ where: { id: seasonId, workspaceId: WORKSPACE_OFFICIAL } })
    if (!season) return NextResponse.json({ error: "Season not found" }, { status: 404 })

    if (matchId) {
      const snapshot = await prisma.seasonSnapshot.findUnique({
        where: { seasonId_matchId: { seasonId, matchId } },
      })
      return NextResponse.json(snapshot)
    }

    const snapshots = await prisma.seasonSnapshot.findMany({
      where: { seasonId },
      orderBy: { matchNo: "asc" },
    })

    return NextResponse.json(snapshots)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 })
  }
}
