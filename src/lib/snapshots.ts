import { prisma } from "./prisma"
import { recalcPointsTable } from "./stats"
import { computeAllRecords } from "./records"

export async function saveSeasonSnapshot(seasonId: string, matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { matchNo: true },
  })
  if (!match) return

  const pointsTable = await recalcPointsTable(seasonId)

  const season = await prisma.season.findUnique({ where: { id: seasonId } })
  if (!season) return

  const teams = await prisma.team.findMany({
    where: { seasonId },
    select: { id: true, name: true },
  })

  const performances = await prisma.playerMatch.findMany({
    where: { match: { seasonId, status: "completed" } },
    include: { player: true },
  })

  const orangeCap: { playerId: string; playerName: string; teamName: string; runs: number; matches: number }[] = []
  const purpleCap: { playerId: string; playerName: string; teamName: string; wickets: number; matches: number }[] = []

  const playerStats: Record<string, { name: string; teamId: string; runs: number; wickets: number; matches: Set<string> }> = {}

  for (const p of performances) {
    if (!playerStats[p.playerId]) {
      playerStats[p.playerId] = { name: p.player.name, teamId: p.teamId, runs: 0, wickets: 0, matches: new Set() }
    }
    const ps = playerStats[p.playerId]
    ps.runs += p.battingRuns
    ps.wickets += p.bowlingWickets
    ps.matches.add(p.matchId)
  }

  for (const [pid, ps] of Object.entries(playerStats)) {
    const teamName = teams.find(t => t.id === ps.teamId)?.name || "Unknown"
    if (ps.runs > 0) orangeCap.push({ playerId: pid, playerName: ps.name, teamName, runs: ps.runs, matches: ps.matches.size })
    if (ps.wickets > 0) purpleCap.push({ playerId: pid, playerName: ps.name, teamName, wickets: ps.wickets, matches: ps.matches.size })
  }

  orangeCap.sort((a, b) => b.runs - a.runs)
  purpleCap.sort((a, b) => b.wickets - a.wickets)

  const { teamRecords, playerRecords } = await computeAllRecords()

  await prisma.seasonSnapshot.upsert({
    where: { seasonId_matchId: { seasonId, matchId } },
    update: {
      matchNo: match.matchNo,
      pointsTable: pointsTable as any,
      orangeCap: orangeCap.slice(0, 10) as any,
      purpleCap: purpleCap.slice(0, 10) as any,
      records: { teamRecords: teamRecords.slice(0, 30), playerRecords: playerRecords.slice(0, 30) } as any,
    },
    create: {
      seasonId,
      matchId,
      matchNo: match.matchNo,
      pointsTable: pointsTable as any,
      orangeCap: orangeCap.slice(0, 10) as any,
      purpleCap: purpleCap.slice(0, 10) as any,
      records: { teamRecords: teamRecords.slice(0, 30), playerRecords: playerRecords.slice(0, 30) } as any,
    },
  })
}

export async function recalcEverything(seasonId?: string) {
  const seasons = seasonId
    ? [await prisma.season.findUnique({ where: { id: seasonId } })].filter(Boolean)
    : await prisma.season.findMany()

  for (const season of seasons) {
    if (!season) continue
    await recalcPointsTable(season.id)
  }

  const { recalcPlayerStats } = await import("./stats")
  await recalcPlayerStats()

  return { success: true, seasonsReprocessed: seasons.length }
}
