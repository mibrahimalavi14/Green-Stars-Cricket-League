import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { trackEvent } from "@/lib/analytics"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { predictionSchema } from "@/lib/validation"
import { WORKSPACE_OFFICIAL } from "@/lib/workspace"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")

  const season = await prisma.season.findFirst({ where: { isActive: true, workspaceId: WORKSPACE_OFFICIAL } })
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
  const ip = getClientIp(req)
  const rl = rateLimit(`prediction:${ip}`, RATE_LIMITS.PREDICTION)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 })
  }

  const body = await req.json()
  const parsed = predictionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { email, predictedTeamId } = parsed.data
  const { name } = body

  const season = await prisma.season.findFirst({ where: { isActive: true, workspaceId: WORKSPACE_OFFICIAL } })
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
