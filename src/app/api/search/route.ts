import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { trackEvent } from "@/lib/analytics"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim().toLowerCase()
  if (!q || q.length < 1) return NextResponse.json({ results: [] })

  const qNum = /^\d+$/.test(q) ? parseInt(q, 10) : null
  const playerNameMatches = await prisma.player.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    select: { id: true },
    take: 5,
  })
  const playerIds = playerNameMatches.map(p => p.id)

  const [players, teams, matches, news, seasons] = await Promise.all([
    prisma.player.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          ...(qNum !== null ? [{ jerseyNumber: qNum }] : []),
        ],
      },
      take: 5,
      include: { team: { select: { shortName: true, logo: true } } },
    }),
    prisma.team.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { captainName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 3,
    }),
    prisma.match.findMany({
      where: {
        OR: [
          { team1: { name: { contains: q, mode: "insensitive" } } },
          { team2: { name: { contains: q, mode: "insensitive" } } },
          { venue: { contains: q, mode: "insensitive" } },
          { umpire1: { contains: q, mode: "insensitive" } },
          { umpire2: { contains: q, mode: "insensitive" } },
          ...(qNum !== null ? [{ matchNo: qNum }] : []),
          ...(playerIds.length ? [{ manOfMatch: { in: playerIds } }] : []),
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
    ...players.map(p => ({ label: p.name, href: `/players/${p.id}`, sub: `${p.team?.shortName || ""}${p.jerseyNumber != null ? ` · #${p.jerseyNumber}` : ""} · Player`, icon: "player" })),
    ...teams.map(t => ({ label: t.name, href: `/teams/${t.id}`, sub: "Team", icon: "team" })),
    ...matches.map(m => ({ label: `${m.team1.shortName} vs ${m.team2.shortName}`, href: `/matches/${m.id}`, sub: `${m.matchNo > 0 ? `M${m.matchNo} · ` : ""}${m.status} · ${m.venue || "TBD"}`, icon: "match" })),
    ...news.map(n => ({ label: n.title, href: `/news/${n.id}`, sub: "News", icon: "news" })),
    ...seasons.map(s => ({ label: s.name, href: `/seasons/${s.id}`, sub: "Season", icon: "season" })),
  ]

  trackEvent("search_query", { query: q, resultCount: results.length })

  return NextResponse.json({ results })
}
