import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export async function GET() {
  const seasons = await prisma.season.findMany({ orderBy: { year: "desc" } })
  return NextResponse.json(seasons)
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const season = await prisma.season.create({ data: body })
  return NextResponse.json(season)
}

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const { id, ...data } = body
  const season = await prisma.season.update({ where: { id }, data })
  return NextResponse.json(season)
}
