import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { otpVerifySchema } from "@/lib/validation"
import { createVerifiedEmailToken } from "@/lib/verified-email"

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = rateLimit(`otp_verify:${ip}`, RATE_LIMITS.OTP_VERIFY)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 })
  }

  const body = await req.json()
  const parsed = otpVerifySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { email, otp } = parsed.data

  const record = await prisma.emailOtp.findFirst({
    where: { email, otp, used: false, expiresAt: { gte: new Date() } },
  })
  if (!record) {
    return NextResponse.json({ error: "Invalid or expired OTP. Please request a new code." }, { status: 400 })
  }

  await prisma.emailOtp.update({ where: { id: record.id }, data: { used: true } })

  return NextResponse.json({ success: true, verifiedToken: createVerifiedEmailToken(email) })
}
