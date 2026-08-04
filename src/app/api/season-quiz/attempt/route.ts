import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = rateLimit(`season_quiz_attempt:${ip}`, RATE_LIMITS.QUIZ_ATTEMPT)
  if (!rl.allowed) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 })

  const body = await req.json()
  const { seasonId, email, name, answers } = body

  if (!seasonId || !email || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const cleanEmail = String(email).trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return NextResponse.json({ error: "Please provide a valid email" }, { status: 400 })
  }

  const questions = await prisma.seasonQuiz.findMany({
    where: { seasonId, active: true, id: { in: answers.map((a: any) => a.questionId) } },
    select: { id: true, correctAnswer: true, pointValue: true },
  })
  if (questions.length === 0) return NextResponse.json({ error: "Quiz not found" }, { status: 404 })

  const questionById = new Map(questions.map(q => [q.id, q]))

  let score = 0
  const results = answers.map((a: any) => {
    const q = questionById.get(a.questionId)
    const correct = !!q && String(a.selectedAnswer) === q.correctAnswer
    if (correct) score += q?.pointValue || 10
    return { questionId: a.questionId, selectedAnswer: String(a.selectedAnswer), correct, correctAnswer: q?.correctAnswer || "" }
  })

  await prisma.$transaction(
    results.map(r => {
      const q = questionById.get(r.questionId)!
      return prisma.seasonQuizAttempt.upsert({
        where: { seasonQuizId_email: { seasonQuizId: r.questionId, email: cleanEmail } },
        create: {
          seasonQuizId: r.questionId,
          email: cleanEmail,
          name: String(name || "Anonymous").slice(0, 80),
          answers: JSON.stringify(r.selectedAnswer),
          score: r.correct ? q.pointValue : 0,
          total: q.pointValue,
        },
        update: {
          answers: JSON.stringify(r.selectedAnswer),
          score: r.correct ? q.pointValue : 0,
        },
      })
    })
  )

  return NextResponse.json({
    score,
    total: questions.reduce((a, q) => a + q.pointValue, 0),
    results,
  })
}
