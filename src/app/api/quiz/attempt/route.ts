import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { trackEvent } from "@/lib/analytics"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { quizAttemptSchema } from "@/lib/validation"

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = rateLimit(`quiz:${ip}`, RATE_LIMITS.QUIZ_ATTEMPT)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 })
  }

  const body = await req.json()
  const parsed = quizAttemptSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { quizId, name, selectedAnswer } = parsed.data

  const existing = await prisma.quizAttempt.findUnique({
    where: { quizId_name: { quizId, name } },
  })
  if (existing) {
    return NextResponse.json({ error: "You have already attempted this quiz" }, { status: 409 })
  }

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } })
  if (!quiz || !quiz.active) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
  }

  const correct = selectedAnswer === quiz.correctAnswer

  await prisma.quizAttempt.create({
    data: {
      quizId,
      name,
      selectedAnswer,
      correct,
    },
  })

  trackEvent("quiz_attempted", { quizId, correct: correct ? "yes" : "no" })

  return NextResponse.json({
    correct,
    correctAnswer: quiz.correctAnswer,
    points: correct ? quiz.pointValue : 0,
  })
}
