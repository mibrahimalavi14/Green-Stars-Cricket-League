import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const players = await prisma.player.findMany({ include: { team: true } })
  return NextResponse.json(players)
}

export async function POST(req: Request) {
  const body = await req.json()
  const player = await prisma.player.create({ data: body })
  return NextResponse.json(player)
}
