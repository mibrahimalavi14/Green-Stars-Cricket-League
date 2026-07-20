import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")

  const season = await prisma.season.findFirst({ where: { isActive: true } })
  if (!season) return NextResponse.json({ teams: [], season: null, prediction: null })

  const teams = await prisma.team.findMany({
    where: { seasonId: season.id },
    select: { id: true, name: true, shortName: true, logo: true },
    orderBy: { name: "asc" },
  })

  let prediction = null
  if (email) {
    prediction = await prisma.seasonPrediction.findUnique({
      where: { email_seasonId: { email, seasonId: season.id } },
    })
  }

  return NextResponse.json({
    season: { id: season.id, name: season.name, year: season.year },
    teams,
    prediction,
  })
}

export async function POST(req: Request) {
  const { email, name, predictedTeamId } = await req.json()

  if (!email || !predictedTeamId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const season = await prisma.season.findFirst({ where: { isActive: true } })
  if (!season) return NextResponse.json({ error: "No active season" }, { status: 404 })
  if (season.scheduleAnnounced) {
    return NextResponse.json({ error: "Predictions locked" }, { status: 403 })
  }

  const team = await prisma.team.findFirst({
    where: { id: predictedTeamId, seasonId: season.id },
  })
  if (!team) return NextResponse.json({ error: "Invalid team" }, { status: 400 })

  const prediction = await prisma.seasonPrediction.upsert({
    where: { email_seasonId: { email, seasonId: season.id } },
    update: { predictedTeamId, name },
    create: { email, name, seasonId: season.id, predictedTeamId },
  })

  return NextResponse.json(prediction)
}
