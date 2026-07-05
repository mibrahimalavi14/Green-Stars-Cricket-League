import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.json()
  const { matchId, innings } = body

  for (const inn of innings) {
    await prisma.inning.upsert({
      where: { matchId_teamId: { matchId, teamId: inn.teamId } },
      update: { runs: inn.runs, wickets: inn.wickets, balls: inn.balls, extras: inn.extras },
      create: { matchId, teamId: inn.teamId, runs: inn.runs, wickets: inn.wickets, balls: inn.balls, extras: inn.extras },
    })
  }

  return NextResponse.json({ success: true })
}
