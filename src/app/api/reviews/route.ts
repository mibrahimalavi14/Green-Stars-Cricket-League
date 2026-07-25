import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { reviewSchema } from "@/lib/validation"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const isAdmin = url.searchParams.get("admin") === "true"

  const where = isAdmin ? {} : { approved: true }

  const [reviews, agg] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.review.aggregate({
      where: { approved: true },
      _avg: { rating: true },
      _count: true,
    }),
  ])

  const sanitized = reviews.map(r => ({
    id: r.id,
    name: r.name,
    city: r.city,
    rating: r.rating,
    comment: r.comment,
    approved: r.approved,
    createdAt: r.createdAt,
    ...(isAdmin ? { email: r.email } : {}),
  }))

  return NextResponse.json({
    reviews: sanitized,
    average: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
    total: agg._count,
  })
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = rateLimit(`review:${ip}`, RATE_LIMITS.REVIEW)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many reviews. Try again later." }, { status: 429 })
  }

  const body = await req.json()
  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { name, rating, comment } = parsed.data
  const { email, city } = body

  const review = await prisma.review.create({
    data: {
      name: name.trim(),
      email: email?.trim() || "",
      city: city?.trim() || "",
      rating,
      comment: comment.trim(),
      approved: false,
    },
  })

  return NextResponse.json({ success: true, review: { id: review.id, name: review.name, city: review.city, rating: review.rating, comment: review.comment, createdAt: review.createdAt } })
}
