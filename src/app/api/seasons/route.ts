import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const seasons = await prisma.season.findMany({ orderBy: { year: "desc" } })
  return NextResponse.json(seasons)
}

export async function POST(req: Request) {
  const body = await req.json()
  const season = await prisma.season.create({ data: body })
  return NextResponse.json(season)
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, ...data } = body
  const season = await prisma.season.update({ where: { id }, data })
  return NextResponse.json(season)
}
