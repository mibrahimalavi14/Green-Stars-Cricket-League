import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim()
  if (typeof body.role === "string" && body.role.trim()) data.role = body.role.trim()
  if (typeof body.photo === "string") data.photo = body.photo.trim()
  if (typeof body.quote === "string") data.quote = body.quote.trim()
  if (body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder))) data.sortOrder = Number(body.sortOrder)
  if (typeof body.active === "boolean") data.active = body.active

  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 })

  const member = await prisma.managementMember.update({ where: { id }, data })
  return NextResponse.json(member)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.managementMember.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
