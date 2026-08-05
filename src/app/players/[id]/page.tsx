import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ShareButtons } from "@/components/ShareButtons"
import { PlayerStatsClient } from "./PlayerStatsClient"

export const dynamic = "force-dynamic"

async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const player = await prisma.player.findUnique({
    where: { id },
    include: { team: true },
  })
  if (!player) notFound()

  const [performances, seasons, transfers] = await Promise.all([
    prisma.playerMatch.findMany({
      where: { playerId: player.id },
      include: {
        match: { include: { team1: true, team2: true, season: true } },
      },
      orderBy: { match: { date: "desc" } },
    }),
    prisma.season.findMany({ orderBy: { year: "desc" } }),
    prisma.playerTransfer.findMany({
      where: { playerId: player.id },
      include: { season: { select: { id: true, name: true, year: true } } },
      orderBy: [{ transferDate: "desc" }, { createdAt: "desc" }],
    }),
  ])

  const transferTeamIds = new Set<string>()
  for (const t of transfers) {
    if (t.fromTeamId) transferTeamIds.add(t.fromTeamId)
    transferTeamIds.add(t.toTeamId)
  }
  const transferTeams = await prisma.team.findMany({ where: { id: { in: [...transferTeamIds] } }, select: { id: true, name: true, shortName: true, logo: true, color: true } })
  const transferTeamMap = new Map(transferTeams.map(t => [t.id, t]))
  const transfersWithTeams = transfers.map(t => ({
    ...t,
    fromTeam: t.fromTeamId ? transferTeamMap.get(t.fromTeamId) || null : null,
    toTeam: transferTeamMap.get(t.toTeamId) || null,
  }))

  const seasonStats = seasons.map(s => {
    const p = performances.filter(x => x.match.seasonId === s.id)
    const runs = p.reduce((a, x) => a + x.battingRuns, 0)
    const ballsFaced = p.reduce((a, x) => a + x.ballsFaced, 0)
    const wickets = p.reduce((a, x) => a + x.bowlingWickets, 0)
    const ballsBowled = p.reduce((a, x) => a + x.ballsBowled, 0)
    const runsConceded = p.reduce((a, x) => a + x.bowlingRuns, 0)
    const fours = p.reduce((a, x) => a + x.fours, 0)
    const sixes = p.reduce((a, x) => a + x.sixes, 0)
    const dismissals = p.filter(x => x.isOut).length
    const catches = p.reduce((a, x) => a + x.catches, 0)
    const stumpings = p.reduce((a, x) => a + x.stumpings, 0)
    const inns = p.length
    return {
      seasonId: s.id,
      seasonName: s.name,
      seasonYear: s.year,
      inns, runs, ballsFaced, wickets, ballsBowled, runsConceded,
      fours, sixes, dismissals, catches, stumpings,
      hs: Math.max(...p.map(x => x.battingRuns), 0),
    }
  }).filter(s => s.inns > 0)

  const activePerfs = performances.filter(x => x.match.season?.isActive)

  const playerAwards = await prisma.seasonAward.findMany({
    where: { playerId: player.id },
    include: { season: { select: { id: true, name: true, year: true } } },
    orderBy: { season: { year: "desc" } },
  })

  return (
    <PlayerStatsClient
      player={JSON.parse(JSON.stringify(player))}
      performances={JSON.parse(JSON.stringify(performances))}
      seasonStats={JSON.parse(JSON.stringify(seasonStats))}
      activePerfs={JSON.parse(JSON.stringify(activePerfs))}
      transfers={JSON.parse(JSON.stringify(transfersWithTeams))}
      awards={JSON.parse(JSON.stringify(playerAwards))}
    />
  )
}

export default PlayerDetailPage
