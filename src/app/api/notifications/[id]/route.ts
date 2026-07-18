import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const notification = await prisma.notification.update({ where: { id }, data: { read: body.read } })
  return NextResponse.json({ notification })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  if (cookieStore.get("admin_auth")?.value !== "true") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.notification.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
