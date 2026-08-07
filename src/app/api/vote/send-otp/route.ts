import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { otpRequestSchema } from "@/lib/validation"
import { verifyRecaptchaToken } from "@/lib/recaptcha"
import { sendOtpEmail } from "@/lib/email"

const SUBJECTS: Record<string, { subject: string; label: string }> = {
  potm: { subject: "Your OTP for Player of the Match vote - GSCL", label: "Player of the Match voting" },
  pos: { subject: "Your OTP for Player of the Season vote - GSCL", label: "Player of the Season voting" },
  quiz: { subject: "Your OTP for Match Quiz - GSCL", label: "Match Quiz" },
  seasonQuiz: { subject: "Your OTP for Season Quiz - GSCL", label: "Season Quiz" },
  prediction: { subject: "Your OTP for Match Predictions - GSCL", label: "Match Predictions" },
  contact: { subject: "Your OTP to send a message - GSCL", label: "contacting GSCL" },
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = rateLimit(`otp_send:${ip}`, RATE_LIMITS.OTP_SEND)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
  }

  const body = await req.json()
  const parsed = otpRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const purposeKey = typeof body.purpose === "string" ? body.purpose : "pos"
  const purpose = SUBJECTS[purposeKey] || SUBJECTS.pos
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "there"

  const recaptchaOk = await verifyRecaptchaToken(body.recaptchaToken)
  if (!recaptchaOk) {
    return NextResponse.json({ error: "Captcha verification failed. Please try again." }, { status: 400 })
  }

  const { email } = parsed.data
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

  await prisma.emailOtp.deleteMany({ where: { email } })
  await prisma.emailOtp.create({
    data: { email, otp, expiresAt },
  })

  try {
    await sendOtpEmail({
      email,
      name,
      otp,
      subject: purpose.subject,
      purpose: purpose.label,
    })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error("Email send error:", err)
    return NextResponse.json({ error: "Failed to send email. Check SMTP settings." }, { status: 500 })
  }
}
