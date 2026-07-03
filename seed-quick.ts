import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Check if data exists
  const existingSeasons = await prisma.season.findMany()
  if (existingSeasons.length > 0) {
    console.log("Data already exists, skipping seed")
    return
  }

  // 1. Create Season
  const season = await prisma.season.create({
    data: { name: "GSCL 2026", year: 2026, isActive: true },
  })
  console.log("Season created:", season.id)

  // 2. Create Teams
  const teams = await Promise.all([
    prisma.team.create({ data: { name: "Karachi Kings", shortName: "KK", color: "#1e3a5f", seasonId: season.id } }),
    prisma.team.create({ data: { name: "Lahore Qalandars", shortName: "LQ", color: "#00a651", seasonId: season.id } }),
    prisma.team.create({ data: { name: "Islamabad United", shortName: "IU", color: "#e41e26", seasonId: season.id } }),
    prisma.team.create({ data: { name: "Peshawar Zalmi", shortName: "PZ", color: "#ffcc00", seasonId: season.id } }),
  ])
  console.log("Teams created:", teams.length)

  // 3. Create Players
  const playersData = [
    { name: "Babar Azam", role: "Batsman", teamId: teams[0].id },
    { name: "Shaheen Afridi", role: "Bowler", teamId: teams[1].id },
    { name: "Shadab Khan", role: "All-rounder", teamId: teams[2].id },
    { name: "Wahab Riaz", role: "Bowler", teamId: teams[3].id },
    { name: "Mohammad Rizwan", role: "Wicket-keeper", teamId: teams[0].id },
    { name: "Fakhar Zaman", role: "Batsman", teamId: teams[1].id },
  ]
  const players = await Promise.all(
    playersData.map(p => prisma.player.create({ data: p }))
  )
  console.log("Players created:", players.length)

  // 4. Create Matches (completed)
  const match1 = await prisma.match.create({
    data: {
      seasonId: season.id,
      team1Id: teams[0].id,
      team2Id: teams[1].id,
      date: new Date("2026-03-15"),
      venue: "National Stadium, Karachi",
      status: "completed",
      team1Score: "185/4 (20 ov)",
      team2Score: "170/6 (20 ov)",
      result: "Karachi Kings won by 15 runs",
      tossWinner: teams[0].id,
      tossDecision: "bat",
    },
  })

  const match2 = await prisma.match.create({
    data: {
      seasonId: season.id,
      team1Id: teams[2].id,
      team2Id: teams[3].id,
      date: new Date("2026-03-16"),
      venue: "Rawalpindi Stadium",
      status: "completed",
      team1Score: "200/3 (20 ov)",
      team2Score: "145/8 (20 ov)",
      result: "Islamabad United won by 55 runs",
      tossWinner: teams[3].id,
      tossDecision: "bowl",
    },
  })

  const match3 = await prisma.match.create({
    data: {
      seasonId: season.id,
      team1Id: teams[0].id,
      team2Id: teams[2].id,
      date: new Date("2026-03-20"),
      venue: "National Stadium, Karachi",
      status: "upcoming",
    },
  })

  console.log("Matches created: 2 completed, 1 upcoming")

  // 5. Create some performances for match1
  const perf1 = await prisma.playerMatch.create({
    data: {
      playerId: players[0].id, // Babar
      matchId: match1.id,
      teamId: teams[0].id,
      battingRuns: 75,
      ballsFaced: 52,
      fours: 8,
      sixes: 2,
      isOut: false,
      catches: 1,
    },
  })

  const perf2 = await prisma.playerMatch.create({
    data: {
      playerId: players[4].id, // Rizwan
      matchId: match1.id,
      teamId: teams[0].id,
      battingRuns: 42,
      ballsFaced: 35,
      fours: 3,
      sixes: 1,
      isOut: true,
      dismissalType: "caught",
      catches: 2,
      stumpings: 1,
    },
  })

  const perf3 = await prisma.playerMatch.create({
    data: {
      playerId: players[1].id, // Shaheen
      matchId: match1.id,
      teamId: teams[1].id,
      bowlingWickets: 3,
      bowlingRuns: 28,
      ballsBowled: 24,
      maidens: 0,
      catches: 0,
    },
  })

  console.log("Performances created:", 3)

  // 6. Recalculate stats
  await recalcStats(season.id)

  console.log("\nSeed completed successfully!")
  console.log("\nVisit: https://green-stars-cricket-league.vercel.app/seasons")
}

async function recalcStats(seasonId: string) {
  const matches = await prisma.match.findMany({ where: { seasonId, status: "completed" } })
  const teams = await prisma.team.findMany({ where: { seasonId } })

  // Points table
  for (const team of teams) {
    const tm1 = matches.filter(m => m.team1Id === team.id)
    const tm2 = matches.filter(m => m.team2Id === team.id)
    let played = tm1.length + tm2.length
    let won = 0, lost = 0, tied = 0
    let nrr = 0

    for (const m of matches) {
      if (m.result.includes(team.name) && !m.result.includes("tied")) won++
      else if (!m.result.includes("tied") && m.result) lost++
      if (m.result.includes("tied")) tied++
    }

    // Update team with stats — no NRR/W/L/T fields, just skip
    console.log(`${team.name}: P=${played} W=${won} L=${lost} T=${tied}`)
  }

  // Player stats
  const players = await prisma.player.findMany({ where: { team: { seasonId } }, include: { team: true } })
  for (const player of players) {
    const perfs = await prisma.playerMatch.findMany({ where: { playerId: player.id } })
    const runs = perfs.reduce((s, p) => s + p.battingRuns, 0)
    const wickets = perfs.reduce((s, p) => s + p.bowlingWickets, 0)
    const ballsFaced = perfs.reduce((s, p) => s + p.ballsFaced, 0)
    const fours = perfs.reduce((s, p) => s + p.fours, 0)
    const sixes = perfs.reduce((s, p) => s + p.sixes, 0)
    const ballsBowled = perfs.reduce((s, p) => s + p.ballsBowled, 0)
    const runsConceded = perfs.reduce((s, p) => s + p.bowlingRuns, 0)
    const catches = perfs.reduce((s, p) => s + p.catches, 0)
    const stumpings = perfs.reduce((s, p) => s + p.stumpings, 0)
    const matchesPlayed = perfs.length

    // Count 50s and 100s
    let fifties = 0, hundreds = 0
    for (const p of perfs) {
      if (p.battingRuns >= 100) hundreds++
      else if (p.battingRuns >= 50) fifties++
    }

    await prisma.player.update({
      where: { id: player.id },
      data: {
        runs, ballsFaced, fours, sixes, fifties, hundreds,
        wickets, ballsBowled, runsConceded, matchesPlayed, catches, stumpings,
      },
    })
    console.log(`  Stats updated: ${player.name} (R:${runs} W:${wickets})`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
