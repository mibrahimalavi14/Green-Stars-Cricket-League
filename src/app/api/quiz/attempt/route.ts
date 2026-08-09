import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { trackEvent } from "@/lib/analytics"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { quizAttemptSchema } from "@/lib/validation"
import { verifyVerifiedEmailToken } from "@/lib/verified-email"
import { notifyAdmin } from "@/lib/email"
import { formatDateTimePKT } from "@/lib/utils"

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

  const { quizId, name, email, selectedAnswer } = parsed.data

  const verifiedEmail = verifyVerifiedEmailToken(parsed.data.verifiedToken)
  if (!verifiedEmail || verifiedEmail !== email.toLowerCase()) {
    return NextResponse.json({ error: "Email not verified. Please verify your email first." }, { status: 401 })
  }

  const existing = await prisma.quizAttempt.findUnique({
    where: { quizId_email: { quizId, email } },
  })
  if (existing) {
    return NextResponse.json({ error: "You have already attempted this quiz" }, { status: 409 })
  }

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } })
  if (!quiz || !quiz.active) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
  }

  const correct = selectedAnswer === quiz.correctAnswer

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId,
      name,
      email,
      selectedAnswer,
      correct,
    },
  })

  trackEvent("quiz_attempted", { quizId, correct: correct ? "yes" : "no" })

  prisma.quiz
    .findUnique({ where: { id: quizId }, select: { question: true } })
    .then((q) =>
      notifyAdmin({
        title: "New Match Quiz Attempt",
        rows: [
          { label: "Name", value: name },
          { label: "Email", value: email },
          { label: "Quiz", value: q?.question.slice(0, 60) || quizId },
          { label: "Result", value: correct ? "Correct" : "Incorrect" },
          { label: "Points", value: String(correct ? quiz.pointValue : 0) },
          { label: "Time", value: formatDateTimePKT(attempt.createdAt) },
        ],
      })
    )

  return NextResponse.json({
    correct,
    correctAnswer: quiz.correctAnswer,
    points: correct ? quiz.pointValue : 0,
  })
}
