import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { WORKSPACE_OFFICIAL } from "@/lib/workspace"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const seasonId = searchParams.get("seasonId")
  const email = searchParams.get("email")?.trim().toLowerCase()

  const season = seasonId
    ? await prisma.season.findFirst({ where: { id: seasonId, workspaceId: WORKSPACE_OFFICIAL } })
    : await prisma.season.findFirst({ where: { isActive: true, workspaceId: WORKSPACE_OFFICIAL } })

  if (!season) return NextResponse.json({ season: null, ready: false, questions: [], attempt: null })

  const totalMatches = await prisma.match.count({ where: { seasonId: season.id } })
  const completedMatches = await prisma.match.count({ where: { seasonId: season.id, status: "completed" } })
  const ready = totalMatches > 0 && completedMatches === totalMatches

  const quiz = await prisma.seasonQuiz.findMany({
    where: { seasonId: season.id, active: true },
    orderBy: { position: "asc" },
    select: { id: true, question: true, options: true, position: true, pointValue: true },
  })

  let attempt: { score: number; total: number; createdAt?: string } | null = null
  if (email && quiz.length > 0) {
    const quizIds = quiz.map(q => q.id)
    const scores = await prisma.seasonQuizAttempt.groupBy({
      by: ["seasonQuizId"],
      where: { seasonQuizId: { in: quizIds }, email },
      _sum: { score: true },
      _count: { id: true },
      _max: { createdAt: true },
    })
    if (scores.length > 0) {
      attempt = {
        score: scores.reduce((a, s) => a + (s._sum.score || 0), 0),
        total: scores.reduce((a, s) => a + (s._count.id || 0), 0) * 10,
        createdAt: scores.reduce((a, s) => (s._max.createdAt && (!a || s._max.createdAt > a) ? s._max.createdAt : a), null as Date | null)?.toISOString(),
      }
    }
  }

  return NextResponse.json({
    season: { id: season.id, name: season.name, year: season.year, isActive: season.isActive, winnerId: season.winnerId },
    ready,
    locked: season.seasonQuizLocked,
    questions: quiz.map(q => ({
      id: q.id,
      question: q.question,
      options: (() => { try { return JSON.parse(q.options) } catch { return [] } })(),
      position: q.position,
      pointValue: q.pointValue,
    })),
    attempt,
  })
}
