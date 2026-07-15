import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const ratings = await prisma.rating.findMany()
  const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r.value, 0) / ratings.length : 0
  return NextResponse.json({ average: Math.round(avg * 10) / 10, total: ratings.length })
}

export async function POST(req: Request) {
  const { value } = await req.json()
  if (!value || value < 1 || value > 5) return NextResponse.json({ error: "Invalid rating" }, { status: 400 })
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
  const existing = await prisma.rating.findUnique({ where: { ip } })
  if (existing) {
    const updated = await prisma.rating.update({ where: { ip }, data: { value } })
    return NextResponse.json(updated)
  }
  const rating = await prisma.rating.create({ data: { value, ip } })
  return NextResponse.json(rating)
}
