import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function GET() {
  const notifications = await prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 20 })
  const unread = notifications.filter((n) => !n.read).length
  return NextResponse.json({ notifications, unread })
}

export async function POST(req: Request) {
  const cookieStore = await cookies()
  if (cookieStore.get("admin_auth")?.value !== "true") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { title, body: notifBody, type, link } = body
  if (!title || !notifBody) return NextResponse.json({ error: "Title and body are required" }, { status: 400 })
  const notification = await prisma.notification.create({ data: { title, body: notifBody, type: type || "info", link: link || "" } })
  return NextResponse.json({ notification })
}
