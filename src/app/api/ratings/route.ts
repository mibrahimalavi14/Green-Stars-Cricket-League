import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { ratingSchema } from "@/lib/validation"

export async function GET(req: Request) {
  const ratings = await prisma.rating.findMany()
  const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r.value, 0) / ratings.length : 0
  const ip = getClientIp(req)
  const existing = await prisma.rating.findUnique({ where: { ip } })
  return NextResponse.json({ average: Math.round(avg * 10) / 10, total: ratings.length, userVote: existing?.value || 0 })
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = rateLimit(`rating:${ip}`, RATE_LIMITS.RATING)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many ratings. Try again later." }, { status: 429 })
  }

  const body = await req.json()
  const parsed = ratingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { rating: value } = parsed.data

  const existing = await prisma.rating.findUnique({ where: { ip } })
  if (existing) {
    await prisma.rating.update({ where: { ip }, data: { value } })
  } else {
    await prisma.rating.create({ data: { value, ip } })
  }
  const ratings = await prisma.rating.findMany()
  const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r.value, 0) / ratings.length : 0
  return NextResponse.json({ average: Math.round(avg * 10) / 10, total: ratings.length, userVote: value })
}
