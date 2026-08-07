import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { WORKSPACE_OFFICIAL } from "@/lib/workspace"
import { createHash } from "crypto"

const TOP_VISIBLE = 10

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const seasonId = searchParams.get("seasonId")

  if (!seasonId) return NextResponse.json({ error: "Missing seasonId" }, { status: 400 })

  const season = await prisma.season.findFirst({ where: { id: seasonId, workspaceId: WORKSPACE_OFFICIAL } })
  if (!season) return NextResponse.json({ error: "Season not found" }, { status: 404 })

  const questions = await prisma.seasonQuiz.findMany({
    where: { seasonId, active: true },
    select: { id: true },
  })
  if (questions.length === 0) return NextResponse.json({ entries: [], top: TOP_VISIBLE })

  const quizIds = questions.map(q => q.id)
  const attempts = await prisma.seasonQuizAttempt.findMany({
    where: { seasonQuizId: { in: quizIds } },
    select: { name: true, email: true, score: true, createdAt: true },
  })

  const standings = await prisma.seasonQuizStanding.findMany({
    where: { seasonId },
    select: { name: true, isHidden: true, isShown: true },
  })
  const controlByName = new Map(standings.map(s => [s.name, s]))

  const byEmail = new Map<string, { name: string; score: number; lastAttempt: Date }>()
  for (const a of attempts) {
    const key = a.email
    const existing = byEmail.get(key)
    if (existing) {
      existing.score += a.score
      if (a.createdAt > existing.lastAttempt) existing.lastAttempt = a.createdAt
    } else {
      byEmail.set(key, { name: a.name, score: a.score, lastAttempt: a.createdAt })
    }
  }

  const ranked = [...byEmail.entries()]
    .sort((a, b) => b[1].score - a[1].score || a[1].lastAttempt.getTime() - b[1].lastAttempt.getTime())
    .map(([email, entry], i) => {
      const control = controlByName.get(entry.name)
      const isHidden = control?.isHidden ?? false
      const isShown = control?.isShown ?? false
      const rank = i + 1
      const visible = (rank <= TOP_VISIBLE && !isHidden) || isShown
      const uid = createHash("sha256").update(email).digest("hex").slice(0, 10)
      return { name: entry.name, score: entry.score, lastAttempt: entry.lastAttempt, rank, uid, visible }
    })

  return NextResponse.json({ entries: ranked.filter(e => e.visible), top: TOP_VISIBLE })
}
