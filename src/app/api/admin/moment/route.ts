import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function PATCH(req: Request) {
  const cookieStore = await cookies()
  if (cookieStore.get("admin_auth")?.value !== "true") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { id, active } = body

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 })
  }

  const moment = await prisma.momentOfTheDay.update({
    where: { id },
    data: { active },
  })

  return NextResponse.json({ moment })
}

export async function DELETE(req: Request) {
  const cookieStore = await cookies()
  if (cookieStore.get("admin_auth")?.value !== "true") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 })
  }

  await prisma.momentOfTheDay.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
