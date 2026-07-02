import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const predictions = await prisma.prediction.findMany({
    include: { user: { select: { name: true, image: true } }, match: { include: { team1: true, team2: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(predictions)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matchId, teamId } = await req.json()

  const season = await prisma.season.findFirst({ where: { isActive: true } })
  if (season?.scheduleAnnounced) return NextResponse.json({ error: "Predictions locked" }, { status: 403 })

  const existing = await prisma.prediction.findFirst({
    where: { userId: session.user.id, matchId },
  })

  if (existing) {
    const pred = await prisma.prediction.update({
      where: { id: existing.id },
      data: { predictedTeamId: teamId },
    })
    return NextResponse.json(pred)
  }

  const pred = await prisma.prediction.create({
    data: { userId: session.user.id, matchId, predictedTeamId: teamId },
  })
  return NextResponse.json(pred)
}
