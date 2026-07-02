import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const matches = await prisma.match.findMany({
    include: { team1: true, team2: true, season: true, innings: true },
    orderBy: { date: "asc" },
  })
  return NextResponse.json(matches)
}

export async function POST(req: Request) {
  const body = await req.json()
  const match = await prisma.match.create({
    data: { ...body, date: new Date(body.date) },
  })
  return NextResponse.json(match)
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, ...data } = body
  const match = await prisma.match.update({ where: { id }, data })
  return NextResponse.json(match)
}
