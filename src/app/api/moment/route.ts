import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function GET() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  let moment = await prisma.momentOfTheDay.findFirst({
    where: {
      active: true,
      date: {
        gte: todayStart,
      },
    },
    orderBy: { date: "desc" },
  })

  if (!moment) {
    moment = await prisma.momentOfTheDay.findFirst({
      where: { active: true },
      orderBy: { date: "desc" },
    })
  }

  return NextResponse.json({ moment: moment || null })
}

export async function POST(req: Request) {
  const cookieStore = await cookies()
  if (cookieStore.get("admin_auth")?.value !== "true") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { title, description, imageUrl, link, type, date } = body

  if (!title || !date) {
    return NextResponse.json({ error: "Title and date are required" }, { status: 400 })
  }

  const moment = await prisma.momentOfTheDay.create({
    data: {
      title,
      description: description || "",
      imageUrl: imageUrl || "",
      link: link || "",
      type: type || "highlight",
      date: new Date(date),
    },
  })

  return NextResponse.json({ moment })
}
