import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  if (cookieStore.get("admin_auth")?.value !== "true") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const moments = await prisma.momentOfTheDay.findMany({
    orderBy: { date: "desc" },
  })

  return NextResponse.json({ moments })
}
