import { prisma } from "../src/lib/prisma"

async function main() {
  // Delete existing data
  await prisma.playerMatch.deleteMany()
  await prisma.prediction.deleteMany()
  await prisma.inning.deleteMany()
  await prisma.match.deleteMany()
  await prisma.player.deleteMany()
  await prisma.team.deleteMany()
  await prisma.season.deleteMany()
  await prisma.predictionLock.deleteMany()

  // Create season
  const season = await prisma.season.create({
    data: { name: "GSCL 2026", year: 2026, isActive: true, scheduleAnnounced: true },
  })

  // Create teams
  const teams = await Promise.all([
    prisma.team.create({ data: { name: "Karachi Kings", shortName: "KK", color: "#1e3a5f", seasonId: season.id } }),
    prisma.team.create({ data: { name: "Lahore Qalandars", shortName: "LQ", color: "#00b894", seasonId: season.id } }),
    prisma.team.create({ data: { name: "Islamabad United", shortName: "IU", color: "#e17055", seasonId: season.id } }),
    prisma.team.create({ data: { name: "Multan Sultans", shortName: "MS", color: "#6c5ce7", seasonId: season.id } }),
  ])

  // Create players
  for (const team of teams) {
    await prisma.player.createMany({
      data: [
        { name: `${team.shortName} Batter 1`, role: "Batsman", teamId: team.id, battingStyle: "Right-handed" },
        { name: `${team.shortName} Batter 2`, role: "Batsman", teamId: team.id, battingStyle: "Left-handed" },
        { name: `${team.shortName} All-Rounder`, role: "All-Rounder", teamId: team.id, battingStyle: "Right-handed", bowlingStyle: "Right-arm fast" },
        { name: `${team.shortName} Bowler 1`, role: "Bowler", teamId: team.id, bowlingStyle: "Right-arm fast" },
        { name: `${team.shortName} Bowler 2`, role: "Bowler", teamId: team.id, bowlingStyle: "Left-arm spin" },
      ],
    })
  }

  // Create matches with scores
  const now = new Date()
  const matches = [
    { team1Idx: 0, team2Idx: 1, date: new Date(now.getTime() - 86400000 * 5), status: "completed", team1Score: "185/4", team2Score: "170/8", result: "Karachi Kings won by 15 runs" },
    { team1Idx: 2, team2Idx: 3, date: new Date(now.getTime() - 86400000 * 4), status: "completed", team1Score: "200/3", team2Score: "190/6", result: "Islamabad United won by 10 runs" },
    { team1Idx: 0, team2Idx: 2, date: new Date(now.getTime() - 86400000 * 3), status: "completed", team1Score: "160/8", team2Score: "162/4", result: "Islamabad United won by 6 wickets" },
    { team1Idx: 1, team2Idx: 3, date: new Date(now.getTime() - 86400000 * 2), status: "completed", team1Score: "210/5", team2Score: "180/9", result: "Lahore Qalandars won by 30 runs" },
    { team1Idx: 0, team2Idx: 3, date: new Date(now.getTime() + 86400000 * 5), status: "upcoming", team1Score: "", team2Score: "", result: "" },
    { team1Idx: 1, team2Idx: 2, date: new Date(now.getTime() + 86400000 * 7), status: "upcoming", team1Score: "", team2Score: "", result: "" },
  ]

  for (const m of matches) {
    const match = await prisma.match.create({
      data: {
        seasonId: season.id,
        team1Id: teams[m.team1Idx].id,
        team2Id: teams[m.team2Idx].id,
        date: m.date,
        venue: "National Stadium",
        status: m.status,
        team1Score: m.team1Score,
        team2Score: m.team2Score,
        result: m.result,
      },
    })

    // Add sample player performances for completed matches
    if (m.status === "completed") {
      const [r1] = m.team1Score.split("/")
      const [r2] = m.team2Score.split("/")
      const team1Players = await prisma.player.findMany({ where: { teamId: teams[m.team1Idx].id } })
      const team2Players = await prisma.player.findMany({ where: { teamId: teams[m.team2Idx].id } })

      for (const p of team1Players) {
        const battingRuns = Math.floor(Math.random() * 60)
        await prisma.playerMatch.create({
          data: {
            playerId: p.id,
            matchId: match.id,
            teamId: teams[m.team1Idx].id,
            battingRuns,
            ballsFaced: Math.floor(Math.random() * 40) + 5,
            fours: Math.floor(Math.random() * 6),
            sixes: Math.floor(Math.random() * 3),
            isOut: Math.random() > 0.3,
            bowlingWickets: Math.floor(Math.random() * 3),
            bowlingRuns: Math.floor(Math.random() * 40) + 10,
            ballsBowled: Math.floor(Math.random() * 18) + 6,
          },
        })
      }
      for (const p of team2Players) {
        const battingRuns = Math.floor(Math.random() * 50)
        await prisma.playerMatch.create({
          data: {
            playerId: p.id,
            matchId: match.id,
            teamId: teams[m.team2Idx].id,
            battingRuns,
            ballsFaced: Math.floor(Math.random() * 35) + 5,
            fours: Math.floor(Math.random() * 5),
            sixes: Math.floor(Math.random() * 2),
            isOut: Math.random() > 0.3,
            bowlingWickets: Math.floor(Math.random() * 2),
            bowlingRuns: Math.floor(Math.random() * 35) + 10,
            ballsBowled: Math.floor(Math.random() * 18) + 6,
          },
        })
      }
    }
  }

  // Recalculate stats inline - simple implementation
  const teams_all = await prisma.team.findMany({ where: { seasonId: season.id } })
  for (const team of teams_all) {
    const wins = await prisma.match.count({ where: { OR: [{ team1Id: team.id }, { team2Id: team.id }], status: "completed" } })
    await prisma.player.updateMany({ where: { teamId: team.id }, data: { matchesPlayed: wins } })
  }

  console.log("Demo data created successfully!")
}

main().catch(console.error)
