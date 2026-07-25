import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { otpVerifySchema } from "@/lib/validation"

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
  const { name } = body

  const record = await prisma.emailOtp.findFirst({
    where: { email, otp, used: false, expiresAt: { gte: new Date() } },
  })

  if (!record) {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
  }

  await prisma.emailOtp.update({ where: { id: record.id }, data: { used: true } })

  const userId = "user_" + Buffer.from(email).toString("base64").replace(/=/g, "")

  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) {
    await prisma.user.create({
      data: { id: userId, name: name || "Guest", email },
    })
  }

  return NextResponse.json({ success: true, userId, name: name || existing?.name || "Guest" })
}
