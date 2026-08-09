import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createHash } from "crypto"
import { pktToday, pktMonday } from "@/lib/quiz-levels"

const TOP_N = 20

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const period = searchParams.get("period") || "overall"
  const meEmail = searchParams.get("email")?.trim().toLowerCase() || ""

  const today = pktToday()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const monday = pktMonday()
  const nextMonday = new Date(monday)
  nextMonday.setDate(nextMonday.getDate() + 7)

  const where =
    period === "daily"
      ? { challenge: { type: "DAILY", date: { gte: today, lt: tomorrow } } }
      : period === "weekly"
        ? { challenge: { type: "WEEKLY", weekStart: { gte: monday, lt: nextMonday } } }
        : {}

  const attempts = await prisma.challengeAttempt.findMany({
    where,
    select: { email: true, name: true, pointsEarned: true, createdAt: true },
  })

  const byEmail = new Map<string, { points: number; name: string; lastAt: number }>()
  for (const a of attempts) {
    const email = a.email.toLowerCase()
    const cur = byEmail.get(email)
    const ts = a.createdAt.getTime()
    if (!cur) {
      byEmail.set(email, { points: a.pointsEarned, name: a.name, lastAt: ts })
    } else {
      cur.points += a.pointsEarned
      if (ts > cur.lastAt) {
        cur.lastAt = ts
        cur.name = a.name
      }
    }
  }

  const rows = Array.from(byEmail.entries())
    .sort((a, b) => b[1].points - a[1].points || a[1].name.localeCompare(b[1].name))
    .slice(0, TOP_N)
    .map(([email, d], i) => ({
      rank: i + 1,
      uid: createHash("sha256").update(email).digest("hex").slice(0, 10),
      name: d.name,
      points: d.points,
      isMe: !!meEmail && email === meEmail,
    }))

  return NextResponse.json({ period, entries: rows })
}
