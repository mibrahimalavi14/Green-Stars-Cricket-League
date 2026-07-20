import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.json()
  const { quizId, email, name, selectedAnswer } = body

  if (!quizId || !email || !selectedAnswer) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const existing = await prisma.quizAttempt.findUnique({
    where: { quizId_email: { quizId, email } },
  })
  if (existing) {
    return NextResponse.json({ error: "You have already attempted this quiz" }, { status: 409 })
  }

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } })
  if (!quiz || !quiz.active) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
  }

  const correct = selectedAnswer === quiz.correctAnswer

  await prisma.quizAttempt.create({
    data: {
      quizId,
      email,
      name: name || "Anonymous",
      selectedAnswer,
      correct,
    },
  })

  return NextResponse.json({
    correct,
    correctAnswer: quiz.correctAnswer,
    points: correct ? quiz.pointValue : 0,
  })
}
