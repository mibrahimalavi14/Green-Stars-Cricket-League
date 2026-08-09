import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { challengeSchema } from "@/lib/validation"

function pktMidnight(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) + 5 * 60 * 60 * 1000)
}

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  const where = type ? { type } : {}
  const [daily, weekly] = await Promise.all([
    prisma.challenge.findMany({
      where: { ...where, type: "DAILY" },
      orderBy: { date: "desc" },
      take: 60,
      include: { _count: { select: { attempts: true } } },
    }),
    prisma.challenge.findMany({
      where: { ...where, type: "WEEKLY" },
      orderBy: { weekStart: "desc" },
      take: 60,
      include: { _count: { select: { attempts: true } } },
    }),
  ])
  return NextResponse.json({ daily, weekly })
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = challengeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { type, title, question, options, correctAnswer, pointValue, active } = parsed.data

  if (type === "DAILY") {
    if (!body.date || typeof body.date !== "string") {
      return NextResponse.json({ error: "Date is required for a daily challenge" }, { status: 400 })
    }
    const date = pktMidnight(body.date)
    const existing = await prisma.challenge.findUnique({ where: { type_date: { type, date } } })
    if (existing) {
      return NextResponse.json({ error: "A daily challenge already exists for this date" }, { status: 409 })
    }
    const challenge = await prisma.challenge.create({
      data: { type, title, question, options: JSON.stringify(options), correctAnswer, pointValue, active, date },
    })
    return NextResponse.json({ challenge })
  }

  if (type === "WEEKLY") {
    if (!body.weekStart || typeof body.weekStart !== "string") {
      return NextResponse.json({ error: "Week is required for a weekly challenge" }, { status: 400 })
    }
    const weekStart = pktMidnight(body.weekStart)
    const challenge = await prisma.challenge.create({
      data: { type, title, question, options: JSON.stringify(options), correctAnswer, pointValue, active, weekStart },
    })
    return NextResponse.json({ challenge })
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 })
}

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (typeof body.title === "string") data.title = body.title
  if (typeof body.question === "string") data.question = body.question
  if (Array.isArray(body.options)) data.options = JSON.stringify(body.options)
  if (typeof body.correctAnswer === "string") data.correctAnswer = body.correctAnswer
  if (typeof body.pointValue === "number") data.pointValue = body.pointValue
  if (typeof body.active === "boolean") data.active = body.active

  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 })

  const challenge = await prisma.challenge.update({ where: { id }, data })
  return NextResponse.json({ challenge })
}

export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const id = typeof body.id === "string" ? body.id : null
  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 })

  await prisma.challenge.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
