import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")?.trim()
  const quizId = searchParams.get("quizId")

  if (!email || !quizId) {
    return NextResponse.json({ error: "Missing email or quizId" }, { status: 400 })
  }

  const attempt = await prisma.quizAttempt.findUnique({
    where: { quizId_email: { quizId, email } },
  })

  return NextResponse.json({ attempt })
}
