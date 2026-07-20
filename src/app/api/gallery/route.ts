import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const images = await prisma.galleryImage.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(images)
}

export async function POST(req: Request) {
  const { imageUrl, caption, matchId, seasonId } = await req.json()
  if (!imageUrl) return NextResponse.json({ error: "Image URL required" }, { status: 400 })

  const img = await prisma.galleryImage.create({
    data: { imageUrl, caption: caption || "", matchId: matchId || "", seasonId: seasonId || "" },
  })
  return NextResponse.json(img)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
  await prisma.galleryImage.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
