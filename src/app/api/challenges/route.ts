import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { trackEvent } from "@/lib/analytics"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { challengeAttemptSchema } from "@/lib/validation"
import { isEmailAuthorized } from "@/lib/session"
import { notifyAdmin } from "@/lib/email"
import { formatDateTimePKT } from "@/lib/utils"
import { pktToday, pktMonday, pktDateKey } from "@/lib/quiz-levels"
import { MATCH_CONFIG } from "@/lib/config"

function serializeChallenge(c: {
  id: string
  type: string
  title: string
  pointValue: number
  timeLimitSeconds: number
  _count?: { questions?: number }
}) {
  return {
    id: c.id,
    type: c.type,
    title: c.title,
    pointValue: c.pointValue,
    timeLimitSeconds: c.timeLimitSeconds,
    questionCount: c._count?.questions ?? 0,
    serving: Math.min(MATCH_CONFIG.challengeQuestionCount, c._count?.questions ?? 0),
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")?.trim() || ""

  const today = pktToday()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const monday = pktMonday()
  const nextMonday = new Date(monday)
  nextMonday.setDate(nextMonday.getDate() + 7)

  const [daily, weekly, attempts] = await Promise.all([
    prisma.challenge.findFirst({
      where: { type: "DAILY", active: true, date: { gte: today, lt: tomorrow } },
      include: { _count: { select: { questions: true } } },
    }),
    prisma.challenge.findMany({
      where: { type: "WEEKLY", active: true, weekStart: { gte: monday, lt: nextMonday } },
      include: { _count: { select: { questions: true } } },
    }),
    email ? prisma.challengeAttempt.findMany({ where: { email } }) : Promise.resolve([]),
  ])

  const attemptMap = new Map(attempts.map(a => [a.challengeId, a]))

  return NextResponse.json({
    daily: daily
      ? {
          ...serializeChallenge(daily),
          attempt: attemptMap.get(daily.id)
            ? {
                score: attemptMap.get(daily.id)!.score,
                total: attemptMap.get(daily.id)!.total,
                pointsEarned: attemptMap.get(daily.id)!.pointsEarned,
                submittedAt: attemptMap.get(daily.id)!.submittedAt?.toISOString() ?? null,
              }
            : null,
        }
      : null,
    weekly: weekly.map(c => ({
      ...serializeChallenge(c),
      attempt: attemptMap.get(c.id)
        ? {
            score: attemptMap.get(c.id)!.score,
            total: attemptMap.get(c.id)!.total,
            pointsEarned: attemptMap.get(c.id)!.pointsEarned,
            submittedAt: attemptMap.get(c.id)!.submittedAt?.toISOString() ?? null,
          }
        : null,
    })),
  })
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = rateLimit(`challenge:${ip}`, RATE_LIMITS.QUIZ_ATTEMPT)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 })
  }

  const body = await req.json()
  const parsed = challengeAttemptSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { challengeId, name, email, answers, verifiedToken } = parsed.data

  if (!isEmailAuthorized(req, verifiedToken, email)) {
    return NextResponse.json({ error: "Email not verified. Please verify your email first." }, { status: 401 })
  }

  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } })
  if (!challenge || !challenge.active) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
  }

  if (challenge.type === "DAILY") {
    if (!challenge.date || pktDateKey(challenge.date).toDateString() !== pktToday().toDateString()) {
      return NextResponse.json({ error: "This daily challenge is no longer active" }, { status: 403 })
    }
  } else {
    if (!challenge.weekStart || pktDateKey(challenge.weekStart).toDateString() !== pktMonday().toDateString()) {
      return NextResponse.json({ error: "This weekly challenge is no longer active" }, { status: 403 })
    }
  }

  const attempt = await prisma.challengeAttempt.findUnique({
    where: { challengeId_email: { challengeId, email } },
  })
  if (!attempt) {
    return NextResponse.json({ error: "Start the challenge first" }, { status: 400 })
  }
  if (attempt.submittedAt) {
    return NextResponse.json({ error: "You have already attempted this challenge" }, { status: 409 })
  }

  const questionIds: string[] = JSON.parse(attempt.questionIds || "[]")
  const questions = await prisma.challengeQuestion.findMany({
    where: { id: { in: questionIds } },
  })
  const qById = new Map(questions.map(q => [q.id, q]))

  const results: { questionId: string; selectedAnswer: string; correct: boolean; correctAnswer: string; points: number }[] = []
  let score = 0
  for (const answer of answers) {
    if (!qById.has(answer.questionId)) continue
    const q = qById.get(answer.questionId)!
    const correct = answer.selectedAnswer === q.correctAnswer
    if (correct) score++
    results.push({ questionId: q.id, selectedAnswer: answer.selectedAnswer, correct, correctAnswer: q.correctAnswer, points: correct ? challenge.pointValue : 0 })
  }

  const pointsEarned = score * challenge.pointValue

  await prisma.challengeAttempt.update({
    where: { id: attempt.id },
    data: {
      score,
      total: questionIds.length,
      pointsEarned,
      answers: JSON.stringify(results.map(r => ({ questionId: r.questionId, selectedAnswer: r.selectedAnswer, correct: r.correct }))),
      submittedAt: new Date(),
    },
  })

  trackEvent("challenge_attempted", { challengeId, correct: score >= questionIds.length / 2 ? "yes" : "no" })

  notifyAdmin({
    title: "New Challenge Attempt",
    rows: [
      { label: "Name", value: name },
      { label: "Email", value: email },
      { label: "Challenge", value: challenge.title || challenge.id },
      { label: "Type", value: challenge.type === "DAILY" ? "Daily" : "Weekly" },
      { label: "Score", value: `${score}/${questionIds.length}` },
      { label: "Points", value: String(pointsEarned) },
      { label: "Time", value: formatDateTimePKT(attempt.createdAt) },
    ],
  })

  return NextResponse.json({
    success: true,
    score,
    total: questionIds.length,
    pointsEarned,
    results,
  })
}
