import { prisma } from "@/lib/prisma"
import { LiveScoreClient } from "@/components/LiveScoreClient"

export const dynamic = "force-dynamic"

async function LivePage() {
  const liveMatch = await prisma.match.findFirst({
    where: { status: "live" },
    include: {
      team1: true,
      team2: true,
      innings: true,
    },
  })

  let team1Players: { id: string; name: string }[] = []
  let team2Players: { id: string; name: string }[] = []

  if (liveMatch) {
    team1Players = await prisma.player.findMany({
      where: { teamId: liveMatch.team1Id },
      select: { id: true, name: true },
    })
    team2Players = await prisma.player.findMany({
      where: { teamId: liveMatch.team2Id },
      select: { id: true, name: true },
    })
  }

  // Fallback: recently completed match (last 6 hours) so fans see the final scorecard
  let recentMatch = null
  if (!liveMatch) {
    recentMatch = await prisma.match.findFirst({
      where: {
        status: "completed",
        updatedAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      },
      orderBy: { updatedAt: "desc" },
      include: { team1: true, team2: true, innings: true },
    })
    if (recentMatch) {
      team1Players = await prisma.player.findMany({
        where: { teamId: recentMatch.team1Id },
        select: { id: true, name: true },
      })
      team2Players = await prisma.player.findMany({
        where: { teamId: recentMatch.team2Id },
        select: { id: true, name: true },
      })
    }
  }

  const upcomingMatches = await prisma.match.findMany({
    where: { status: "upcoming" },
    include: { team1: true, team2: true },
    orderBy: { date: "asc" },
    take: 5,
  })

  const displayMatch = liveMatch || recentMatch

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Live Scoring</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Real-time ball-by-ball updates</p>

      <LiveScoreClient
        liveMatch={displayMatch ? { ...displayMatch, team1Players, team2Players } as any : null}
        upcomingMatches={upcomingMatches as any[]}
        showRecentCompleted
      />
    </div>
  )
}

export default LivePage
