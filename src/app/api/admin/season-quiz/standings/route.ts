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
    select: { name: true, score: true, createdAt: true },
  })

  const standings = await prisma.seasonQuizStanding.findMany({
    where: { seasonId },
    select: { name: true, isHidden: true, isShown: true },
  })
  const controlByName = new Map(standings.map(s => [s.name, s]))

  const byName = new Map<string, { score: number; lastAttempt: Date }>()
  for (const a of attempts) {
    const existing = byName.get(a.name)
    if (existing) {
      existing.score += a.score
      if (a.createdAt > existing.lastAttempt) existing.lastAttempt = a.createdAt
    } else {
      byName.set(a.name, { score: a.score, lastAttempt: a.createdAt })
    }
  }

  const ranked = [...byName.entries()]
    .sort((a, b) => b[1].score - a[1].score || a[1].lastAttempt.getTime() - b[1].lastAttempt.getTime())
    .map(([name, entry], i) => {
      const control = controlByName.get(name)
      const isHidden = control?.isHidden ?? false
      const isShown = control?.isShown ?? false
      const rank = i + 1
      return {
        name,
        ...entry,
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
  const { seasonId, name, action } = body

  if (!seasonId || !name || !["hide", "show", "auto"].includes(action)) {
    return NextResponse.json({ error: "seasonId, name and action (hide|show|auto) are required" }, { status: 400 })
  }

  const cleanName = String(name).trim().slice(0, 80)
  const data =
    action === "hide"
      ? { isHidden: true, isShown: false }
      : action === "show"
        ? { isShown: true, isHidden: false }
        : { isHidden: false, isShown: false }

  const standing = await prisma.seasonQuizStanding.upsert({
    where: { seasonId_name: { seasonId, name: cleanName } },
    create: { seasonId, name: cleanName, ...data },
    update: data,
    select: { name: true, isHidden: true, isShown: true },
  })

  logAudit({
    action: `season_quiz_${action}`,
    entity: "season",
    entityId: seasonId,
    details: JSON.stringify({ name: cleanName }),
  })

  return NextResponse.json({ success: true, standing })
}
