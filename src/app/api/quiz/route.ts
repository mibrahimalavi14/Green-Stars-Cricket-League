import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get("matchId")

  const where: any = { active: true }
  if (matchId) where.matchId = matchId

  const quizzes = await prisma.quiz.findMany({
    where,
    include: {
      match: { include: { team1: true, team2: true } },
      _count: { select: { attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(quizzes)
}

export async function POST(req: Request) {
  const cookieStore = await cookies()
  if (cookieStore.get("admin_auth")?.value !== "true") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { matchId, question, options, correctAnswer, pointValue } = body

  if (!matchId || !question || !options || !correctAnswer) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const quiz = await prisma.quiz.create({
    data: {
      matchId,
      question,
      options: JSON.stringify(options),
      correctAnswer,
      pointValue: pointValue || 10,
    },
  })
  return NextResponse.json(quiz)
}

export async function DELETE(req: Request) {
  const cookieStore = await cookies()
  if (cookieStore.get("admin_auth")?.value !== "true") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing quiz id" }, { status: 400 })
  }

  await prisma.quiz.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
