import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getLevel, QUIZ_BADGES, pktDateKey, pktToday } from "@/lib/quiz-levels"

function checkBadge(id: string, stats: { totalAttempts: number; correct: number; dailyStreak: number; totalPoints: number; hasPerfectSeason: boolean }) {
  switch (id) {
    case "first_step": return stats.totalAttempts >= 1
    case "sharp_shooter": return stats.correct >= 5
    case "quiz_master": return stats.correct >= 10
    case "daily_3": return stats.dailyStreak >= 3
    case "daily_7": return stats.dailyStreak >= 7
    case "season_perfect": return stats.hasPerfectSeason
    case "high_roller": return stats.totalPoints >= 500
    case "legend": return stats.totalPoints >= 1800
    default: return false
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")?.trim()
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 })

  const [quizAttempts, seasonAttempts, challengeAttempts] = await Promise.all([
    prisma.quizAttempt.findMany({ where: { email }, select: { correct: true, quiz: { select: { pointValue: true } } } }),
    prisma.seasonQuizAttempt.findMany({ where: { email }, select: { seasonQuizId: true, score: true, total: true } }),
    prisma.challengeAttempt.findMany({ where: { email }, select: { score: true, submittedAt: true, pointsEarned: true, challenge: { select: { type: true, date: true } } } }),
  ])

  const matchPoints = quizAttempts.reduce((s, a) => s + (a.correct ? a.quiz.pointValue : 0), 0)
  const seasonPoints = seasonAttempts.reduce((s, a) => s + a.score, 0)
  const challengePoints = challengeAttempts.reduce((s, a) => s + a.pointsEarned, 0)
  const totalPoints = matchPoints + seasonPoints + challengePoints

  const correct =
    quizAttempts.filter(a => a.correct).length +
    seasonAttempts.filter(a => a.score > 0).length +
    challengeAttempts.filter(a => a.submittedAt && a.score > 0).length
  const totalAttempts = quizAttempts.length + seasonAttempts.length + challengeAttempts.filter(a => a.submittedAt).length

  const daySet = new Set(
    challengeAttempts
      .filter(a => a.challenge.type === "DAILY" && a.submittedAt && a.score > 0 && a.challenge.date)
      .map(a => pktDateKey(a.challenge.date!).toDateString())
  )
  let dailyStreak = 0
  const cursor = new Date(pktToday())
  if (!daySet.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1)
  while (daySet.has(cursor.toDateString())) {
    dailyStreak++
    cursor.setDate(cursor.getDate() - 1)
  }

  const bySeason = new Map<string, { score: number; total: number }>()
  for (const a of seasonAttempts) {
    const g = bySeason.get(a.seasonQuizId) || { score: 0, total: 0 }
    g.score += a.score
    g.total += a.total
    bySeason.set(a.seasonQuizId, g)
  }
  const hasPerfectSeason = [...bySeason.values()].some(g => g.total > 0 && g.score === g.total)

  const stats = { totalAttempts, correct, dailyStreak, totalPoints, hasPerfectSeason }
  const badges = QUIZ_BADGES.map(b => ({ ...b, unlocked: checkBadge(b.id, stats) }))

  return NextResponse.json({
    totalPoints,
    correct,
    totalAttempts,
    dailyStreak,
    matchPoints,
    seasonPoints,
    challengePoints,
    level: getLevel(totalPoints),
    badges,
  })
}
