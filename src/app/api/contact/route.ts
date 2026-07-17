import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function getIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
}

async function verifyCaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) return true
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secret}&response=${token}`,
    })
    const data = await res.json()
    return data.success === true
  } catch { return false }
}

export async function GET() {
  const contacts = await prisma.contact.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(contacts)
}

export async function POST(req: Request) {
  const ip = getIp(req)

  const recentCount = await prisma.contact.count({
    where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
  })
  if (recentCount >= 100) return NextResponse.json({ error: "Too many submissions" }, { status: 429 })

  const { name, email, subject, message, captchaToken } = await req.json()

  if (!name || !name.trim() || name.length > 200) return NextResponse.json({ error: "Invalid name" }, { status: 400 })
  if (!email || !email.trim() || email.length > 200) return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  if (!message || !message.trim() || message.length > 5000) return NextResponse.json({ error: "Invalid message" }, { status: 400 })
  if (subject && subject.length > 500) return NextResponse.json({ error: "Invalid subject" }, { status: 400 })

  if (captchaToken) {
    const valid = await verifyCaptcha(captchaToken)
    if (!valid) return NextResponse.json({ error: "Captcha verification failed" }, { status: 400 })
  }

  const contact = await prisma.contact.create({
    data: { name: name.trim(), email: email.trim(), subject: subject?.trim() || "", message: message.trim() },
  })
  return NextResponse.json(contact)
}
