import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { trackEvent } from "@/lib/analytics"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")

  const season = await prisma.season.findFirst({ where: { isActive: true } })
  if (!season) return NextResponse.json({ teams: [], season: null, prediction: null, teamVotes: [], predictions: [] })

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

  const allPredictions = await prisma.seasonPrediction.findMany({
    where: { seasonId: season.id },
    orderBy: { createdAt: "desc" },
  })

  const teamVotes = teams.map(t => ({
    teamId: t.id,
    teamName: t.name,
    shortName: t.shortName,
    count: allPredictions.filter(p => p.predictedTeamId === t.id).length,
  }))

  const predictionsList = allPredictions.map(p => ({
    name: p.name,
    teamName: teams.find(t => t.id === p.predictedTeamId)?.name || "Unknown",
    createdAt: p.createdAt.toISOString(),
  }))

  return NextResponse.json({
    season: { id: season.id, name: season.name, year: season.year },
    teams,
    prediction,
    teamVotes,
    predictions: predictionsList,
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

  const existing = await prisma.seasonPrediction.findUnique({
    where: { email_seasonId: { email, seasonId: season.id } },
  })

  if (existing) {
    return NextResponse.json({ error: "This email has already voted" }, { status: 403 })
  }

  const pred = await prisma.seasonPrediction.create({
    data: { email, name, seasonId: season.id, predictedTeamId },
  })

  trackEvent("prediction_submitted", { teamId: predictedTeamId })

  return NextResponse.json(pred)
}
