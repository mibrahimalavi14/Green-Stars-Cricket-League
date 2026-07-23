import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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
  const recentCount = await prisma.review.count({
    where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
  })
  if (recentCount >= 20) return NextResponse.json({ error: "Too many reviews. Try again later." }, { status: 429 })

  const { name, email, city, rating, comment } = await req.json()

  if (!name || !name.trim() || name.length > 100) return NextResponse.json({ error: "Invalid name" }, { status: 400 })
  if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: "Invalid rating" }, { status: 400 })
  if (!comment || !comment.trim() || comment.length > 1000) return NextResponse.json({ error: "Invalid comment" }, { status: 400 })
  if (email && email.length > 200) return NextResponse.json({ error: "Invalid email" }, { status: 400 })

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
