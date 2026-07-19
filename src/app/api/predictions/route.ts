import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const predictions = await prisma.prediction.findMany({
    include: { match: { include: { team1: true, team2: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(predictions)
}

export async function POST(req: Request) {
  const { matchId, teamId, userId, name, email } = await req.json()

  if (!matchId || !teamId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const season = await prisma.season.findFirst({ where: { isActive: true } })
  if (season?.scheduleAnnounced) {
    return NextResponse.json({ error: "Predictions locked" }, { status: 403 })
  }

  let uid = userId
  if (uid) {
    const existing = await prisma.user.findUnique({ where: { id: uid } })
    if (!existing) {
      await prisma.user.create({
        data: { id: uid, name: name || "Guest", email: email || `${uid}@guest.gscl` },
      })
    }
  } else {
    uid = ""
  }

  const existing = await prisma.prediction.findFirst({
    where: { userId: uid, matchId },
  })

  if (existing) {
    const pred = await prisma.prediction.update({
      where: { id: existing.id },
      data: { predictedTeamId: teamId },
    })
    return NextResponse.json(pred)
  }

  const pred = await prisma.prediction.create({
    data: { userId: uid, matchId, predictedTeamId: teamId },
  })
  return NextResponse.json(pred)
}
