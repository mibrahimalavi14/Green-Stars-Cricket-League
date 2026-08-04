import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"
import { regenerateSeasonQuiz } from "@/lib/season-quiz"

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const seasonId = searchParams.get("seasonId")

  const questions = await prisma.seasonQuiz.findMany({
    where: seasonId ? { seasonId } : {},
    include: { season: true },
    orderBy: [{ seasonId: "asc" }, { position: "asc" }],
  })

  return NextResponse.json(questions)
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const seasonId = body?.seasonId

  const season = await prisma.season.findUnique({ where: { id: seasonId } })
  if (!season) return NextResponse.json({ error: "Season not found" }, { status: 404 })

  const { count } = await regenerateSeasonQuiz(seasonId)

  logAudit({
    action: "season_quiz_generated",
    entity: "season",
    entityId: seasonId,
    details: JSON.stringify({ count, season: season.name }),
  })

  return NextResponse.json({ success: true, count })
}
