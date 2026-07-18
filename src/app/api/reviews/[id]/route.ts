import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  if (typeof body.approved !== "boolean") return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const review = await prisma.review.update({ where: { id }, data: { approved: body.approved } })
  return NextResponse.json(review)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.review.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
