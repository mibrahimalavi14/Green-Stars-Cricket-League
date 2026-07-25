import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { contactSchema } from "@/lib/validation"

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || ""
  const isAdmin = cookie.includes("admin_auth=true")
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const contacts = await prisma.contact.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(contacts)
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = rateLimit(`contact:${ip}`, RATE_LIMITS.CONTACT)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many submissions. Try again later." }, { status: 429 })
  }

  const body = await req.json()
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { name, email, subject, message } = parsed.data

  const contact = await prisma.contact.create({
    data: { name: name.trim(), email: email.trim(), subject: subject?.trim() || "", message: message.trim() },
  })
  return NextResponse.json(contact)
}
