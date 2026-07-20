import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const quizId = searchParams.get("quizId")

  if (!quizId) {
    return NextResponse.json({ error: "Missing quizId" }, { status: 400 })
  }

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId },
    orderBy: [{ correct: "desc" }, { createdAt: "asc" }],
  })

  return NextResponse.json(attempts)
}
