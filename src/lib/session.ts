import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto"
import { verifyVerifiedEmailToken } from "@/lib/verified-email"

export const SESSION_COOKIE = "gscl_session"
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

function sessionSecret(): string {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || ""
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  try {
    const test = scryptSync(password, salt, 64).toString("hex")
    return timingSafeEqual(Buffer.from(test, "hex"), Buffer.from(hash, "hex"))
  } catch {
    return false
  }
}

export function createSessionToken(email: string, name: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email: email.toLowerCase(), name, exp: Date.now() + SESSION_TTL_MS }),
  ).toString("base64url")
  const sig = createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url")
  return `${payload}.${sig}`
}

export function readSessionToken(token: string | undefined | null): { email: string; name: string } | null {
  if (!token || !sessionSecret()) return null
  const [payload, sig] = token.split(".")
  if (!payload || !sig) return null

  const expected = createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url")
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      email?: unknown
      name?: unknown
      exp?: unknown
    }
    if (typeof data.email !== "string" || typeof data.name !== "string" || typeof data.exp !== "number") return null
    if (Date.now() > data.exp) return null
    return { email: data.email, name: data.name }
  } catch {
    return null
  }
}

export function getSession(req: Request): { email: string; name: string } | null {
  const cookieHeader = req.headers.get("cookie") || ""
  let token: string | null = null
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=")
    if (k === SESSION_COOKIE) token = rest.join("=")
  }
  return readSessionToken(token)
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  }
}

export function isEmailAuthorized(req: Request, verifiedToken: string | undefined | null, email: string): boolean {
  const clean = email.toLowerCase()
  const verifiedEmail = verifyVerifiedEmailToken(verifiedToken)
  if (verifiedEmail && verifiedEmail === clean) return true
  const session = getSession(req)
  return !!session && session.email === clean
}
