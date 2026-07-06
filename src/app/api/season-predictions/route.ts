import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const predictions = await prisma.seasonPrediction.findMany({
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(predictions)
}

export async function POST(req: Request) {
  const { name, email, predictedTeamId, seasonId, googleUserId } = await req.json()
  if (!name || !email || !predictedTeamId || !seasonId) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 })
  }

  const existing = await prisma.seasonPrediction.findUnique({
    where: { email_seasonId: { email, seasonId } },
  })
  if (existing) {
    return NextResponse.json({ error: "You have already submitted a prediction for this season" }, { status: 409 })
  }

  const prediction = await prisma.seasonPrediction.create({
    data: { seasonId, predictedTeamId, name, email, googleUserId },
  })
  return NextResponse.json(prediction)
}
