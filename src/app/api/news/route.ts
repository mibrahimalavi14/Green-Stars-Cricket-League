import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export async function GET() {
  const news = await prisma.news.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(news)
}

export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
  await prisma.news.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  const news = await prisma.news.create({
    data: { ...body, type: body.type || "general", slug, published: true },
  })

  try {
    const { sendPushNotification } = await import("@/lib/push")
    await sendPushNotification({
      title: "New News",
      body: news.title,
      link: `/news/${slug}`,
    })
  } catch (pushErr) {
    console.error("Push notification failed:", pushErr)
  }

  return NextResponse.json(news)
}
