import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim().toLowerCase()
  if (!q || q.length < 1) return NextResponse.json({ results: [] })

  const [players, teams, matches, news, seasons] = await Promise.all([
    prisma.player.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 5,
      include: { team: { select: { shortName: true, logo: true } } },
    }),
    prisma.team.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 3,
    }),
    prisma.match.findMany({
      where: {
        OR: [
          { team1: { name: { contains: q, mode: "insensitive" } } },
          { team2: { name: { contains: q, mode: "insensitive" } } },
          { venue: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      include: { team1: { select: { shortName: true } }, team2: { select: { shortName: true } } },
    }),
    prisma.news.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      take: 3,
    }),
    prisma.season.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 3,
    }),
  ])

  const results = [
    ...players.map(p => ({ label: p.name, href: `/players/${p.id}`, sub: `${p.team?.shortName || ""} · Player`, icon: "player" })),
    ...teams.map(t => ({ label: t.name, href: `/teams/${t.id}`, sub: "Team", icon: "team" })),
    ...matches.map(m => ({ label: `${m.team1.shortName} vs ${m.team2.shortName}`, href: `/matches/${m.id}`, sub: `${m.status} · ${m.venue || "TBD"}`, icon: "match" })),
    ...news.map(n => ({ label: n.title, href: `/news/${n.id}`, sub: "News", icon: "news" })),
    ...seasons.map(s => ({ label: s.name, href: `/seasons/${s.id}`, sub: "Season", icon: "season" })),
  ]

  return NextResponse.json({ results })
}
