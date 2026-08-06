import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"

const TOP_VISIBLE = 10

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const seasonId = searchParams.get("seasonId")
  if (!seasonId) return NextResponse.json({ error: "Missing seasonId" }, { status: 400 })

  const questions = await prisma.seasonQuiz.findMany({
    where: { seasonId, active: true },
    select: { id: true },
  })
  if (questions.length === 0) return NextResponse.json({ entries: [], top: TOP_VISIBLE })

  const quizIds = questions.map(q => q.id)
  const attempts = await prisma.seasonQuizAttempt.findMany({
    where: { seasonQuizId: { in: quizIds } },
    select: { email: true, name: true, score: true, createdAt: true },
  })

  const standings = await prisma.seasonQuizStanding.findMany({
    where: { seasonId },
    select: { email: true, isHidden: true, isShown: true },
  })
  const controlByEmail = new Map(standings.map(s => [s.email, s]))

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

  const ranked = [...byEmail.entries()]
    .sort((a, b) => b[1].score - a[1].score || a[1].lastAttempt.getTime() - b[1].lastAttempt.getTime())
    .map(([email, entry], i) => {
      const control = controlByEmail.get(email)
      const isHidden = control?.isHidden ?? false
      const isShown = control?.isShown ?? false
      const rank = i + 1
      return {
        ...entry,
        email,
        rank,
        isHidden,
        isShown,
        autoVisible: rank <= TOP_VISIBLE && !isHidden,
        visible: (rank <= TOP_VISIBLE && !isHidden) || isShown,
      }
    })

  return NextResponse.json({ entries: ranked, top: TOP_VISIBLE })
}

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { seasonId, email, action } = body

  if (!seasonId || !email || !["hide", "show", "auto"].includes(action)) {
    return NextResponse.json({ error: "seasonId, email and action (hide|show|auto) are required" }, { status: 400 })
  }

  const cleanEmail = String(email).trim().toLowerCase()
  const data =
    action === "hide"
      ? { isHidden: true, isShown: false }
      : action === "show"
        ? { isShown: true, isHidden: false }
        : { isHidden: false, isShown: false }

  const standing = await prisma.seasonQuizStanding.upsert({
    where: { seasonId_email: { seasonId, email: cleanEmail } },
    create: { seasonId, email: cleanEmail, ...data },
    update: data,
    select: { email: true, isHidden: true, isShown: true },
  })

  logAudit({
    action: `season_quiz_${action}`,
    entity: "season",
    entityId: seasonId,
    details: JSON.stringify({ email: cleanEmail }),
  })

  return NextResponse.json({ success: true, standing })
}
