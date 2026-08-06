import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get("name")
  const quizId = searchParams.get("quizId")

  if (!name || !quizId) {
    return NextResponse.json({ error: "Missing name or quizId" }, { status: 400 })
  }

  const attempt = await prisma.quizAttempt.findUnique({
    where: { quizId_name: { quizId, name } },
  })

  return NextResponse.json({ attempt })
}
