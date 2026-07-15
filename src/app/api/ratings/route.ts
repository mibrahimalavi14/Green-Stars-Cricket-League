import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function getIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || req.headers.get("x-vercel-forwarded-for") || "unknown"
}

export async function GET(req: Request) {
  const ratings = await prisma.rating.findMany()
  const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r.value, 0) / ratings.length : 0
  const ip = getIp(req)
  const existing = await prisma.rating.findUnique({ where: { ip } })
  return NextResponse.json({ average: Math.round(avg * 10) / 10, total: ratings.length, userVote: existing?.value || 0 })
}

export async function POST(req: Request) {
  const { value } = await req.json()
  if (!value || value < 1 || value > 5) return NextResponse.json({ error: "Invalid rating" }, { status: 400 })
  const ip = getIp(req)
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
