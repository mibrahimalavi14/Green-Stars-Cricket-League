import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { contactSchema } from "@/lib/validation"
import { verifyRecaptchaToken } from "@/lib/recaptcha"
import { verifyVerifiedEmailToken } from "@/lib/verified-email"
import { notifyAdmin } from "@/lib/email"
import { isAdminAuthenticated } from "@/lib/admin-auth"

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

  const honeypot = typeof body.website === "string" ? body.website : ""
  if (honeypot) {
    return NextResponse.json({ success: true })
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { name, email, subject, message, purpose, phone, company, sponsorshipType, budgetRange, verifiedToken, recaptchaToken } = parsed.data

  if (purpose === "sponsorship") {
    const verifiedEmail = verifyVerifiedEmailToken(verifiedToken || "")
    if (!verifiedEmail || verifiedEmail !== email.toLowerCase()) {
      return NextResponse.json({ error: "Email verification required." }, { status: 401 })
    }
  } else {
    const recaptchaOk = await verifyRecaptchaToken(recaptchaToken)
    if (!recaptchaOk) {
      return NextResponse.json({ error: "Captcha verification failed. Please try again." }, { status: 400 })
    }
  }

  const emailRl = rateLimit(`contact_email:${email.toLowerCase()}`, RATE_LIMITS.CONTACT)
  if (!emailRl.allowed) {
    return NextResponse.json({ error: "Too many submissions. Try again later." }, { status: 429 })
  }

  const contact = await prisma.contact.create({
    data: {
      name: name.trim(),
      email: email.trim(),
      subject: subject?.trim() || "",
      message: message.trim(),
      purpose,
      phone: phone?.trim() || "",
      company: company?.trim() || "",
      sponsorshipType: sponsorshipType?.trim() || "",
      budgetRange: budgetRange?.trim() || "",
    },
  })

  const isSponsorship = purpose === "sponsorship"
  notifyAdmin({
    title: isSponsorship ? "New Sponsorship Message" : "New Contact Message",
    rows: [
      { label: "Type", value: isSponsorship ? "Sponsorship" : "General Inquiry" },
      { label: "Name", value: name.trim() },
      { label: "Email", value: email.trim() },
      { label: "Company / Brand", value: company?.trim() || "" },
      { label: "Phone / WhatsApp", value: phone?.trim() || "" },
      { label: "Sponsorship Type", value: sponsorshipType?.trim() || "" },
      { label: "Budget Range", value: budgetRange?.trim() || "" },
      { label: "Subject", value: subject?.trim() || "" },
    ],
    message: message.trim(),
  })

  return NextResponse.json(contact)
}

export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
  await prisma.contact.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
