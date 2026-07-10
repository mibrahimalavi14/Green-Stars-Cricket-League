import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.match.updateMany({
    where: { status: "upcoming", date: { lte: new Date() } },
    data: { status: "live" },
  })
  const match = await prisma.match.findFirst({
    where: { status: "live" },
    include: { team1: true, team2: true, innings: true },
  })
  return NextResponse.json(match)
}
