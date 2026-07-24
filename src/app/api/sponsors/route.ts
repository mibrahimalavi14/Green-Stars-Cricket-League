import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export async function GET() {
  const sponsors = await prisma.sponsor.findMany({ where: { active: true }, orderBy: { order: "asc" } })
  return NextResponse.json(sponsors)
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, logo, website, tier, order } = await req.json()
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })
  const s = await prisma.sponsor.create({ data: { name, logo: logo || "", website: website || "", tier: tier || "platinum", order: order || 0 } })
  return NextResponse.json(s)
}

export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
  await prisma.sponsor.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
