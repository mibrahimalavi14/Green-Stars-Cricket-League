import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const { email, otp, name } = await req.json()
  if (!email || !otp) {
    return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 })
  }

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
