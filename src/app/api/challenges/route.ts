import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { trackEvent } from "@/lib/analytics"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { challengeAttemptSchema } from "@/lib/validation"
import { verifyVerifiedEmailToken } from "@/lib/verified-email"
import { notifyAdmin } from "@/lib/email"
import { formatDateTimePKT } from "@/lib/utils"
import { pktToday, pktMonday, pktDateKey } from "@/lib/quiz-levels"

function serializeChallenge(c: { id: string; type: string; title: string; question: string; options: string; pointValue: number }) {
  return {
    id: c.id,
    type: c.type,
    title: c.title,
    question: c.question,
    options: JSON.parse(c.options || "[]") as string[],
    pointValue: c.pointValue,
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
    prisma.challenge.findFirst({ where: { type: "DAILY", active: true, date: { gte: today, lt: tomorrow } } }),
    prisma.challenge.findMany({ where: { type: "WEEKLY", active: true, weekStart: { gte: monday, lt: nextMonday } } }),
    email ? prisma.challengeAttempt.findMany({ where: { email } }) : Promise.resolve([]),
  ])

  const attemptMap = new Map(attempts.map(a => [a.challengeId, a]))

  return NextResponse.json({
    daily: daily
      ? {
          ...serializeChallenge(daily),
          attempt: attemptMap.get(daily.id)
            ? { correct: attemptMap.get(daily.id)!.correct, pointsEarned: attemptMap.get(daily.id)!.pointsEarned, createdAt: attemptMap.get(daily.id)!.createdAt.toISOString() }
            : null,
        }
      : null,
    weekly: weekly.map(c => ({
      ...serializeChallenge(c),
      attempt: attemptMap.get(c.id)
        ? { correct: attemptMap.get(c.id)!.correct, pointsEarned: attemptMap.get(c.id)!.pointsEarned, createdAt: attemptMap.get(c.id)!.createdAt.toISOString() }
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

  const { challengeId, name, email, selectedAnswer } = parsed.data

  const verifiedEmail = verifyVerifiedEmailToken(parsed.data.verifiedToken)
  if (!verifiedEmail || verifiedEmail !== email.toLowerCase()) {
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

  const existing = await prisma.challengeAttempt.findUnique({
    where: { challengeId_email: { challengeId, email } },
  })
  if (existing) {
    return NextResponse.json({ error: "You have already attempted this challenge" }, { status: 409 })
  }

  const correct = selectedAnswer === challenge.correctAnswer
  const pointsEarned = correct ? challenge.pointValue : 0

  const attempt = await prisma.challengeAttempt.create({
    data: { challengeId, name, email, selectedAnswer, correct, pointsEarned },
  })

  trackEvent("challenge_attempted", { challengeId, correct: correct ? "yes" : "no" })

  notifyAdmin({
    title: "New Challenge Attempt",
    rows: [
      { label: "Name", value: name },
      { label: "Email", value: email },
      { label: "Challenge", value: challenge.title || challenge.question.slice(0, 60) },
      { label: "Type", value: challenge.type === "DAILY" ? "Daily" : "Weekly" },
      { label: "Result", value: correct ? "Correct" : "Incorrect" },
      { label: "Points", value: String(pointsEarned) },
      { label: "Time", value: formatDateTimePKT(attempt.createdAt) },
    ],
  })

  return NextResponse.json({
    success: true,
    correct,
    correctAnswer: challenge.correctAnswer,
    pointsEarned,
  })
}
