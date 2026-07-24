import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export async function GET() {
  const teams = await prisma.team.findMany()
  return NextResponse.json(teams)
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const team = await prisma.team.create({ data: body })
  return NextResponse.json(team)
}

export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await prisma.team.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
