import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function getIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
}

async function verifyCaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) return true
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secret}&response=${token}`,
    })
    const data = await res.json()
    return data.success === true
  } catch { return false }
}

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
  const ip = getIp(req)

  const recentCount = await prisma.review.count({
    where: { ip, createdAt: { gte: new Date(Date.now() - 86400000) } },
  })
  if (recentCount >= 3) return NextResponse.json({ error: "Too many reviews. Try again later." }, { status: 429 })

  const { name, email, city, rating, comment, captchaToken } = await req.json()

  if (!name || !name.trim() || name.length > 100) return NextResponse.json({ error: "Invalid name" }, { status: 400 })
  if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: "Invalid rating" }, { status: 400 })
  if (!comment || !comment.trim() || comment.length > 1000) return NextResponse.json({ error: "Invalid comment" }, { status: 400 })
  if (email && email.length > 200) return NextResponse.json({ error: "Invalid email" }, { status: 400 })

  if (captchaToken) {
    const valid = await verifyCaptcha(captchaToken)
    if (!valid) return NextResponse.json({ error: "Captcha verification failed" }, { status: 400 })
  }

  const review = await prisma.review.create({
    data: {
      name: name.trim(),
      email: email?.trim() || "",
      city: city?.trim() || "",
      rating,
      comment: comment.trim(),
      ip,
      approved: false,
    },
  })

  return NextResponse.json({ success: true, review: { id: review.id, name: review.name, city: review.city, rating: review.rating, comment: review.comment, createdAt: review.createdAt } })
}
