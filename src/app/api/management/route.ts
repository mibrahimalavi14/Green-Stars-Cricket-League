import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export async function GET() {
  const members = await prisma.managementMember.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, role: true, photo: true, quote: true, sortOrder: true },
  })
  return NextResponse.json(members)
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const role = typeof body.role === "string" ? body.role.trim() : ""
  if (!name || !role) return NextResponse.json({ error: "Name and role are required" }, { status: 400 })

  const member = await prisma.managementMember.create({
    data: {
      name,
      role,
      photo: typeof body.photo === "string" ? body.photo.trim() : "",
      quote: typeof body.quote === "string" ? body.quote.trim() : "",
      sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    },
  })
  return NextResponse.json(member)
}
