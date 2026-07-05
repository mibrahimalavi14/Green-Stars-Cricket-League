import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const news = await prisma.news.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(news)
}

export async function POST(req: Request) {
  const body = await req.json()
  const slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  const news = await prisma.news.create({
    data: { ...body, type: body.type || "general", slug, published: true },
  })
  return NextResponse.json(news)
}
