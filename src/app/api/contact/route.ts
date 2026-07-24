import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || ""
  const isAdmin = cookie.includes("admin_auth=true")
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const contacts = await prisma.contact.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(contacts)
}

export async function POST(req: Request) {
  const recentCount = await prisma.contact.count({
    where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
  })
  if (recentCount >= 100) return NextResponse.json({ error: "Too many submissions" }, { status: 429 })

  const { name, email, subject, message } = await req.json()

  if (!name || !name.trim() || name.length > 200) return NextResponse.json({ error: "Invalid name" }, { status: 400 })
  if (!email || !email.trim() || email.length > 200) return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  if (!message || !message.trim() || message.length > 5000) return NextResponse.json({ error: "Invalid message" }, { status: 400 })
  if (subject && subject.length > 500) return NextResponse.json({ error: "Invalid subject" }, { status: 400 })

  const contact = await prisma.contact.create({
    data: { name: name.trim(), email: email.trim(), subject: subject?.trim() || "", message: message.trim() },
  })
  return NextResponse.json(contact)
}
