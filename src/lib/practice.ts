import { prisma } from "./prisma"
import { WORKSPACE_OFFICIAL, WORKSPACE_PRACTICE } from "./workspace"

const PLAYER_STAT_FIELDS = [
  "runs", "ballsFaced", "fours", "sixes", "threes", "dotBalls", "ones", "twos",
  "fifties", "hundreds", "highestScore", "notOuts", "ducks",
  "matchesPlayed", "wickets", "ballsBowled", "runsConceded", "maidens", "wides",
  "noBalls", "fiveWickets", "fourWickets", "hattricks", "bestBowlingWickets",
  "bestBowlingRuns", "bestBowlingBalls", "catches", "stumpings", "runOuts",
  "timesBowled", "timesCaught", "timesLbw", "timesStumped", "timesRunOut",
]

export async function cloneOfficialToPractice(sourceSeasonId?: string, targetName?: string) {
  const sourceSeasonIdResolved = sourceSeasonId || (await prisma.season.findFirst({ where: { workspaceId: WORKSPACE_OFFICIAL, isActive: true }, select: { id: true } }))?.id
  if (!sourceSeasonIdResolved) throw new Error("No official season to clone. Create an official season first.")

  const source = await prisma.season.findFirst({
    where: { id: sourceSeasonIdResolved, workspaceId: WORKSPACE_OFFICIAL },
    include: { teams: { include: { players: true } } },
  })
  if (!source) throw new Error("Official season not found")

  let practiceSeason = await prisma.season.findFirst({
    where: { workspaceId: WORKSPACE_PRACTICE, name: targetName || `${source.name} Practice` },
  })
  if (!practiceSeason) {
    practiceSeason = await prisma.season.create({
      data: {
        name: targetName || `${source.name} Practice`,
        year: source.year,
        workspaceId: WORKSPACE_PRACTICE,
        isActive: false,
      },
    })
  }

  await prisma.practiceCloneMapping.deleteMany({ where: { practiceSeasonId: practiceSeason.id } })

  let teamsCopied = 0
  let playersCopied = 0
  for (const team of source.teams) {
    const newTeam = await prisma.team.create({
      data: {
        name: team.name,
        shortName: team.shortName,
        logo: team.logo,
        color: team.color,
        headCoach: team.headCoach,
        location: team.location,
        seasonId: practiceSeason.id,
      },
    })
    await prisma.practiceCloneMapping.create({
      data: {
        sourceSeasonId: source.id,
        sourceTeamId: team.id,
        sourcePlayerId: "",
        practiceSeasonId: practiceSeason.id,
        practiceTeamId: newTeam.id,
        practicePlayerId: "",
      },
    })
    teamsCopied++

    for (const player of team.players) {
      const newPlayer = await prisma.player.create({
        data: {
          name: player.name,
          role: player.role,
          battingStyle: player.battingStyle,
          bowlingStyle: player.bowlingStyle,
          photo: player.photo,
          jerseyNumber: player.jerseyNumber,
          teamId: newTeam.id,
        },
      })
      await prisma.practiceCloneMapping.create({
        data: {
          sourceSeasonId: source.id,
          sourceTeamId: team.id,
          sourcePlayerId: player.id,
          practiceSeasonId: practiceSeason.id,
          practiceTeamId: newTeam.id,
          practicePlayerId: newPlayer.id,
        },
      })
      playersCopied++
    }
  }

  return { practiceSeason, sourceSeason: { id: source.id, name: source.name }, teamsCopied, playersCopied }
}

export async function resetPractice() {
  const practiceSeasons = await prisma.season.findMany({ where: { workspaceId: WORKSPACE_PRACTICE }, select: { id: true } })
  const seasonIds = practiceSeasons.map(s => s.id)

  const practiceMatches = await prisma.match.findMany({ where: { seasonId: { in: seasonIds } }, select: { id: true } })
  const matchIds = practiceMatches.map(m => m.id)

  await prisma.playerMatch.deleteMany({ where: { matchId: { in: matchIds } } })
  await prisma.squadMember.deleteMany({ where: { matchId: { in: matchIds } } })
  await prisma.prediction.deleteMany({ where: { matchId: { in: matchIds } } })
  await prisma.quiz.deleteMany({ where: { matchId: { in: matchIds } } })
  await prisma.potmVote.deleteMany({ where: { matchId: { in: matchIds } } })
  await prisma.ballEvent.deleteMany({ where: { matchId: { in: matchIds } } })
  await prisma.superOverInnings.deleteMany({ where: { matchId: { in: matchIds } } })
  await prisma.matchNotes.deleteMany({ where: { matchId: { in: matchIds } } })
  await prisma.inning.deleteMany({ where: { matchId: { in: matchIds } } })
  await prisma.match.deleteMany({ where: { id: { in: matchIds } } })

  await prisma.seasonAward.deleteMany({ where: { seasonId: { in: seasonIds } } })
  await prisma.teamHonor.deleteMany({ where: { seasonId: { in: seasonIds } } })
  await prisma.playerTransfer.deleteMany({ where: { seasonId: { in: seasonIds } } })
  await prisma.fairPlayRecord.deleteMany({ where: { seasonId: { in: seasonIds } } })
  await prisma.leaguePenalty.deleteMany({ where: { seasonId: { in: seasonIds } } })
  await prisma.teamCaptaincy.deleteMany({ where: { seasonId: { in: seasonIds } } })
  await prisma.seasonSnapshot.deleteMany({ where: { seasonId: { in: seasonIds } } })
  await prisma.seasonQuiz.deleteMany({ where: { seasonId: { in: seasonIds } } })
  await prisma.seasonPrediction.deleteMany({ where: { seasonId: { in: seasonIds } } })

  const resetStats = Object.fromEntries(PLAYER_STAT_FIELDS.map(f => [f, 0]))
  await prisma.player.updateMany({
    where: { team: { season: { workspaceId: WORKSPACE_PRACTICE } } },
    data: { ...resetStats, highestScoreNotOut: false },
  })

  await prisma.practiceCloneMapping.deleteMany({ where: { practiceSeasonId: { in: seasonIds } } })

  return { matchesDeleted: matchIds.length, seasonsReset: seasonIds.length }
}

export async function promotePracticeMatch(practiceMatchId: string) {
  const practiceMatch = await prisma.match.findFirst({
    where: { id: practiceMatchId, season: { workspaceId: WORKSPACE_PRACTICE }, status: "completed" },
    include: { team1: true, team2: true },
  })
  if (!practiceMatch) throw new Error("Completed practice match not found")

  const officialSeason = await prisma.season.findFirst({ where: { workspaceId: WORKSPACE_OFFICIAL, isActive: true } })
  if (!officialSeason) throw new Error("No active official season. Create/activate an official season first.")

  const t1Map = await prisma.practiceCloneMapping.findFirst({ where: { practiceTeamId: practiceMatch.team1Id, practiceSeasonId: practiceMatch.seasonId } })
  const t2Map = await prisma.practiceCloneMapping.findFirst({ where: { practiceTeamId: practiceMatch.team2Id, practiceSeasonId: practiceMatch.seasonId } })
  if (!t1Map || !t2Map) throw new Error("Practice teams were not created from an official clone — cannot promote")

  const officialTeam1 = await prisma.team.findFirst({ where: { id: t1Map.sourceTeamId, season: { workspaceId: WORKSPACE_OFFICIAL } } })
  const officialTeam2 = await prisma.team.findFirst({ where: { id: t2Map.sourceTeamId, season: { workspaceId: WORKSPACE_OFFICIAL } } })
  if (!officialTeam1 || !officialTeam2) throw new Error("Official counterpart teams not found")

  const lastMatch = await prisma.match.findFirst({ where: { seasonId: officialSeason.id }, orderBy: { matchNo: "desc" }, select: { matchNo: true } })
  const matchNo = (lastMatch?.matchNo || 0) + 1

  const tossWinnerId = practiceMatch.tossWinner === practiceMatch.team1Id
    ? officialTeam1.id
    : practiceMatch.tossWinner === practiceMatch.team2Id
      ? officialTeam2.id
      : practiceMatch.tossWinner || ""

  const match = await prisma.match.create({
    data: {
      seasonId: officialSeason.id,
      team1Id: officialTeam1.id,
      team2Id: officialTeam2.id,
      matchNo,
      stage: practiceMatch.stage || "league",
      date: new Date(practiceMatch.date),
      venue: practiceMatch.venue,
      status: "upcoming",
      tossWinner: tossWinnerId,
      tossDecision: practiceMatch.tossDecision || "",
      umpire1: practiceMatch.umpire1 || "",
      umpire2: practiceMatch.umpire2 || "",
      thirdUmpire: practiceMatch.thirdUmpire || "",
      matchReferee: practiceMatch.matchReferee || "",
      officialScorer: practiceMatch.officialScorer || "",
      tossTime: practiceMatch.tossTime || "",
      matchStartTime: practiceMatch.matchStartTime || "",
    },
  })

  const members = await prisma.squadMember.findMany({ where: { matchId: practiceMatchId } })
  let squadCopied = 0
  for (const member of members) {
    const pm = await prisma.practiceCloneMapping.findFirst({
      where: { practicePlayerId: member.playerId, practiceSeasonId: practiceMatch.seasonId },
    })
    if (!pm || !pm.sourcePlayerId) continue
    await prisma.squadMember.create({
      data: { matchId: match.id, playerId: pm.sourcePlayerId, teamId: pm.sourceTeamId, role: member.role },
    })
    squadCopied++
  }

  return { match, squadCopied }
}

export async function getPracticeReport() {
  const practiceSeasons = await prisma.season.findMany({ where: { workspaceId: WORKSPACE_PRACTICE }, select: { id: true, name: true, year: true } })
  const seasonIds = practiceSeasons.map(s => s.id)

  const matches = await prisma.match.findMany({ where: { seasonId: { in: seasonIds } }, include: { innings: true } })
  const completed = matches.filter(m => m.status === "completed")

  let balls = 0
  let runs = 0
  let wickets = 0
  let wides = 0
  let noBalls = 0
  let byes = 0
  let legByes = 0
  for (const inn of completed.flatMap(m => m.innings)) {
    balls += inn.balls
    runs += inn.runs
    wickets += inn.wickets
    try {
      const ballsData = JSON.parse(inn.ballsData || "[]") as any[]
      for (const b of ballsData) {
        if (b.isWide) wides++
        if (b.isNoBall) noBalls++
        if (b.byes > 0) byes++
        if (b.legByes > 0) legByes++
      }
    } catch {
      // ignore malformed ball data
    }
  }

  const practiceInnings = await prisma.inning.findMany({ where: { match: { seasonId: { in: seasonIds } } }, select: { id: true } })
  const innIdSet = new Set(practiceInnings.map(i => i.id))
  const undoEvents = await prisma.analyticsEvent.findMany({ where: { event: "undo_used" }, select: { metadata: true } })
  let undoCount = 0
  for (const ev of undoEvents) {
    try {
      const meta = JSON.parse(ev.metadata || "{}") as any
      if (meta.inningsId && innIdSet.has(meta.inningsId)) undoCount++
    } catch {
      // ignore malformed metadata
    }
  }

  const totalBalls = balls
  const accuracy = totalBalls > 0 ? Math.max(0, Math.min(100, Math.round((1 - undoCount / totalBalls) * 100))) : 100

  const totalMs = completed.reduce((acc, m) => acc + (m.updatedAt.getTime() - m.createdAt.getTime()), 0)
  const timeMinutes = Math.round(totalMs / 60000)

  return {
    seasons: practiceSeasons,
    matches: matches.length,
    completed: completed.length,
    balls,
    runs,
    wickets,
    extras: { wides, noBalls, byes, legByes, total: wides + noBalls + byes + legByes },
    undoCount,
    accuracy,
    timeMinutes,
  }
}
