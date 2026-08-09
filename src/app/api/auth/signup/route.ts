import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { signupSchema } from "@/lib/validation"
import { hashPassword, createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/session"

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = rateLimit(`auth_signup:${ip}`, RATE_LIMITS.AUTH_ATTEMPT)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 })
  }

  const body = await req.json()
  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const name = parsed.data.name
  const email = parsed.data.email.toLowerCase()

  const existing = await prisma.quizAccount.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists. Please sign in." }, { status: 409 })
  }

  const account = await prisma.quizAccount.create({
    data: { name, email, passwordHash: hashPassword(parsed.data.password) },
    select: { name: true, email: true },
  })

  const res = NextResponse.json({ user: account })
  res.cookies.set(SESSION_COOKIE, createSessionToken(email, name), sessionCookieOptions())
  return res
}
