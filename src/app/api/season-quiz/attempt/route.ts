import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { WORKSPACE_OFFICIAL } from "@/lib/workspace"
import { MATCH_CONFIG } from "@/lib/config"
import { createHash } from "crypto"
import { verifyVerifiedEmailToken } from "@/lib/verified-email"

const TIME_LIMIT_MS = MATCH_CONFIG.seasonQuizTimeLimitSeconds * 1000
const GRACE_MS = MATCH_CONFIG.seasonQuizGraceSeconds * 1000

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = rateLimit(`season_quiz_attempt:${ip}`, RATE_LIMITS.QUIZ_ATTEMPT)
  if (!rl.allowed) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 })

  const body = await req.json()
  const { seasonId, name, email, answers, startedAt } = body

  const cleanName = String(name || "").trim().slice(0, 80)
  const cleanEmail = String(email || "").trim().toLowerCase().slice(0, 200)
  if (!seasonId || !cleanName || !cleanEmail || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: "Please provide your name, email and answers" }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return NextResponse.json({ error: "Please provide a valid email address" }, { status: 400 })
  }

  const verifiedEmail = verifyVerifiedEmailToken(String(body.verifiedToken || ""))
  if (!verifiedEmail || verifiedEmail !== cleanEmail) {
    return NextResponse.json({ error: "Email not verified. Please verify your email first." }, { status: 401 })
  }

  const season = await prisma.season.findFirst({ where: { id: seasonId, workspaceId: WORKSPACE_OFFICIAL } })
  if (!season) return NextResponse.json({ error: "Season not found" }, { status: 404 })
  if (season.seasonQuizLocked) {
    return NextResponse.json({ error: "This season quiz is now closed" }, { status: 403 })
  }

  const questions = await prisma.seasonQuiz.findMany({
    where: { seasonId, active: true, id: { in: answers.map((a: any) => a.questionId) } },
    select: { id: true, correctAnswer: true, pointValue: true },
  })
  if (questions.length === 0) return NextResponse.json({ error: "Quiz not found" }, { status: 404 })

  const alreadyAttempted = await prisma.seasonQuizAttempt.findFirst({
    where: { seasonQuiz: { seasonId }, email: cleanEmail },
    select: { id: true },
  })
  if (alreadyAttempted) {
    return NextResponse.json({ error: "You have already attempted this season quiz" }, { status: 409 })
  }

  const clientStartedAt = typeof startedAt === "number" && Number.isFinite(startedAt) ? startedAt : Date.now()

  const earliestExisting = await prisma.seasonQuizAttempt.findFirst({
    where: { seasonQuiz: { seasonId }, email: cleanEmail },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  })
  const anchor = earliestExisting ? Math.max(earliestExisting.createdAt.getTime(), clientStartedAt) : clientStartedAt
  if (Date.now() - anchor > TIME_LIMIT_MS + GRACE_MS) {
    return NextResponse.json({ error: "Time's up! The quiz has closed." }, { status: 403 })
  }

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
          name: cleanName,
          email: cleanEmail,
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
    uid: createHash("sha256").update(cleanEmail).digest("hex").slice(0, 10),
  })
}
