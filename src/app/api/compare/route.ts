import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const player1Id = searchParams.get("player1Id")
  const player2Id = searchParams.get("player2Id")

  if (!player1Id || !player2Id) {
    return NextResponse.json({ error: "Both player1Id and player2Id are required" }, { status: 400 })
  }

  const [player1, player2] = await Promise.all([
    prisma.player.findUnique({ where: { id: player1Id }, include: { team: true } }),
    prisma.player.findUnique({ where: { id: player2Id }, include: { team: true } }),
  ])

  if (!player1 || !player2) {
    return NextResponse.json({ error: "Player(s) not found" }, { status: 404 })
  }

  return NextResponse.json({ player1, player2 })
}
