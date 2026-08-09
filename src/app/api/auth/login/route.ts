import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { loginSchema } from "@/lib/validation"
import { verifyPassword, createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/session"

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = rateLimit(`auth_login:${ip}`, RATE_LIMITS.AUTH_ATTEMPT)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 })
  }

  const body = await req.json()
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const email = parsed.data.email.toLowerCase()

  const account = await prisma.quizAccount.findUnique({
    where: { email },
    select: { name: true, email: true, passwordHash: true },
  })
  if (!account || !verifyPassword(parsed.data.password, account.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
  }

  const res = NextResponse.json({ user: { name: account.name, email: account.email } })
  res.cookies.set(SESSION_COOKIE, createSessionToken(account.email, account.name), sessionCookieOptions())
  return res
}
