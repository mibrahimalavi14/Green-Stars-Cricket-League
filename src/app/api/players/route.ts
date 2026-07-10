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

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, ...data } = body
  const player = await prisma.player.update({ where: { id }, data })
  return NextResponse.json(player)
}
