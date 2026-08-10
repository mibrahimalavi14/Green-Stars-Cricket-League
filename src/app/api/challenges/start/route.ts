import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { challengeStartSchema } from "@/lib/validation"
import { isEmailAuthorized } from "@/lib/session"
import { pktToday, pktMonday, pktDateKey } from "@/lib/quiz-levels"
import { MATCH_CONFIG } from "@/lib/config"

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = rateLimit(`challenge-start:${ip}`, RATE_LIMITS.CHALLENGE_START)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
  }

  const body = await req.json()
  const parsed = challengeStartSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { challengeId, name, email, verifiedToken } = parsed.data

  if (!isEmailAuthorized(req, verifiedToken, email)) {
    return NextResponse.json({ error: "Email not verified. Please verify your email first." }, { status: 401 })
  }

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: { questions: true },
  })
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

  if (challenge.questions.length < MATCH_CONFIG.challengeQuestionCount) {
    return NextResponse.json({ error: "Challenge doesn't have enough questions yet" }, { status: 409 })
  }

  const existing = await prisma.challengeAttempt.findUnique({
    where: { challengeId_email: { challengeId, email } },
  })
  if (existing && existing.submittedAt) {
    return NextResponse.json({ error: "You have already attempted this challenge" }, { status: 409 })
  }

  const serving = Math.min(MATCH_CONFIG.challengeQuestionCount, challenge.questions.length)
  const picked = shuffle(challenge.questions).slice(0, serving).map(q => ({
    id: q.id,
    question: q.question,
    options: shuffle(JSON.parse(q.options || "[]") as string[]),
  }))

  const attempt = existing && !existing.submittedAt
    ? await prisma.challengeAttempt.update({
        where: { id: existing.id },
        data: { questionIds: JSON.stringify(picked.map(q => q.id)), total: serving },
      })
    : await prisma.challengeAttempt.create({
        data: {
          challengeId,
          name,
          email,
          questionIds: JSON.stringify(picked.map(q => q.id)),
          total: serving,
        },
      })

  return NextResponse.json({
    attemptId: attempt.id,
    questionCount: serving,
    timeLimitSeconds: challenge.timeLimitSeconds,
    pointValue: challenge.pointValue,
    questions: picked,
  })
}
