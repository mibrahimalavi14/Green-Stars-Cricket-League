import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim().toLowerCase()
  if (!q || q.length < 1) return NextResponse.json({ results: [] })

  const [players, teams] = await Promise.all([
    prisma.player.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 8,
      include: { team: { select: { shortName: true } } },
    }),
    prisma.team.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 5,
    }),
  ])

  const results = [
    ...players.map(p => ({ label: p.name, href: `/players/${p.id}`, sub: p.team?.shortName || "" })),
    ...teams.map(t => ({ label: t.name, href: `/teams/${t.id}`, sub: "Team" })),
  ]

  return NextResponse.json({ results })
}
