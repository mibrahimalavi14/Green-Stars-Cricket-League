import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const seasonId = searchParams.get("seasonId")

  if (!seasonId) return NextResponse.json({ error: "Missing seasonId" }, { status: 400 })

  const questions = await prisma.seasonQuiz.findMany({
    where: { seasonId, active: true },
    select: { id: true },
  })
  if (questions.length === 0) return NextResponse.json([])

  const quizIds = questions.map(q => q.id)
  const attempts = await prisma.seasonQuizAttempt.findMany({
    where: { seasonQuizId: { in: quizIds } },
    select: { email: true, name: true, score: true, createdAt: true },
  })

  const byEmail = new Map<string, { name: string; score: number; lastAttempt: Date }>()
  for (const a of attempts) {
    const existing = byEmail.get(a.email)
    if (existing) {
      existing.score += a.score
      if (a.createdAt > existing.lastAttempt) existing.lastAttempt = a.createdAt
    } else {
      byEmail.set(a.email, { name: a.name, score: a.score, lastAttempt: a.createdAt })
    }
  }

  return NextResponse.json(
    [...byEmail.values()]
      .sort((a, b) => b.score - a.score || a.lastAttempt.getTime() - b.lastAttempt.getTime())
      .slice(0, 50)
  )
}
