import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const teams = await prisma.team.findMany()
  return NextResponse.json(teams)
}

export async function POST(req: Request) {
  const body = await req.json()
  const team = await prisma.team.create({ data: body })
  return NextResponse.json(team)
}
