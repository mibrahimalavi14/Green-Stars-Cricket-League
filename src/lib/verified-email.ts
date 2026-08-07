import { createHmac, timingSafeEqual } from "crypto"

const TOKEN_TTL_MS = 30 * 60 * 1000

function tokenSecret(): string {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || ""
}

export function createVerifiedEmailToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email: email.toLowerCase(), exp: Date.now() + TOKEN_TTL_MS }),
  ).toString("base64url")
  const sig = createHmac("sha256", tokenSecret())
    .update(payload)
    .digest("base64url")
  return `${payload}.${sig}`
}

export function verifyVerifiedEmailToken(token: string | undefined | null): string | null {
  if (!token || !tokenSecret()) return null
  const [payload, sig] = token.split(".")
  if (!payload || !sig) return null

  const expected = createHmac("sha256", tokenSecret())
    .update(payload)
    .digest("base64url")
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      email?: unknown
      exp?: unknown
    }
    if (typeof data.email !== "string" || typeof data.exp !== "number") return null
    if (Date.now() > data.exp) return null
    return data.email
  } catch {
    return null
  }
}
