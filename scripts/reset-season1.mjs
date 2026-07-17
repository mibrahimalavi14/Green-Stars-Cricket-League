import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

// Find Season 1
let season = await p.season.findFirst({ where: { name: "Season 1" } })
if (!season) {
  season = await p.season.findFirst({ where: { isActive: true } })
}
if (!season) {
  console.log("No season found!")
  process.exit(1)
}
console.log(`Using season: ${season.name} (${season.id})`)

// Delete all related data for this season
console.log("Deleting existing data...")

// Delete ratings (they're global, but fine)
// Delete contacts (global)
// Delete season predictions
await p.seasonPrediction.deleteMany({ where: { seasonId: season.id } })
// Delete prediction locks
await p.predictionLock.deleteMany({ where: { seasonId: season.id } })
// Delete predictions
await p.prediction.deleteMany({ where: { match: { seasonId: season.id } } })
// Delete innings
await p.inning.deleteMany({ where: { match: { seasonId: season.id } } })
// Delete player matches
await p.playerMatch.deleteMany({ where: { match: { seasonId: season.id } } })
// Delete matches
await p.match.deleteMany({ where: { seasonId: season.id } })
// Delete players
await p.player.deleteMany({ where: { team: { seasonId: season.id } } })
// Delete teams
await p.team.deleteMany({ where: { seasonId: season.id } })

console.log("All old data deleted")

// Update season
await p.season.update({
  where: { id: season.id },
  data: { isActive: true, scheduleAnnounced: true, winnerId: "" }
})

// Create 8 teams
const teamConfigs = [
  { name: "Alpha Warriors", shortName: "AW", color: "#dc2626", player: { name: "Ahmed Bhatti", role: "All-rounder", battingStyle: "Left-handed", bowlingStyle: "Right-arm fast" } },
  { name: "Dragon Knights", shortName: "DK", color: "#7c3aed", player: { name: "Chaudhary Abdullah", role: "Batsman", battingStyle: "Right-handed", bowlingStyle: "Right-arm fast" }, altName: "Muhammad Aun Awan", altRole: "All-rounder" },
  { name: "Elite Rangers", shortName: "ER", color: "#2563eb", player: { name: "Abdulrehman Farhan", role: "Bowler", battingStyle: "Right-handed", bowlingStyle: "Right-arm off break" } },
  { name: "Falcon Strikers", shortName: "FS", color: "#ca8a04", player: { name: "Abubakar Saddique", role: "Batsman", battingStyle: "Right-handed", bowlingStyle: "Right-arm fast" } },
  { name: "Legends XI", shortName: "LX", color: "#059669", player: { name: "Malik Taha Qaiser", role: "All-rounder", battingStyle: "Right-handed", bowlingStyle: "Right-arm fast" } },
  { name: "Power Panthers", shortName: "PP", color: "#e11d48", player: { name: "Farhan Rasool", role: "Batsman", battingStyle: "Right-handed", bowlingStyle: "Right-arm fast" }, altName: "Muhammad Zain", altRole: "Bowler" },
  { name: "Thunder Hawks", shortName: "TH", color: "#0891b2", player: { name: "Ahmed Raza", role: "Bowler", battingStyle: "Right-handed", bowlingStyle: "Right-arm fast" } },
  { name: "Green Gladiators", shortName: "GG", color: "#16a34a", player: { name: "Usman Bhatti", role: "All-rounder", battingStyle: "Right-handed", bowlingStyle: "Right-arm fast" } },
]

const teamIds = []
for (const tc of teamConfigs) {
  const team = await p.team.create({
    data: {
      name: tc.name, shortName: tc.shortName, color: tc.color,
      logo: `/images/teams/${tc.shortName.toLowerCase()}.png`,
      captainName: tc.player.name, location: "Lahore",
      seasonId: season.id,
    }
  })
  teamIds.push(team.id)

  await p.player.create({
    data: {
      name: tc.player.name, role: tc.player.role,
      battingStyle: tc.player.battingStyle, bowlingStyle: tc.player.bowlingStyle,
      teamId: team.id, photo: `/images/players/${tc.player.name.replace(/\s+/g, '_')}.jpg`,
    }
  })

  if (tc.altName) {
    await p.player.create({
      data: {
        name: tc.altName, role: tc.altRole || "All-rounder",
        battingStyle: "Right-handed", bowlingStyle: "Right-arm fast",
        teamId: team.id, photo: `/placeholder-player.svg`,
      }
    })
  }
  console.log(`  ${team.shortName} - ${tc.player.name}${tc.altName ? ` / ${tc.altName}` : ''}`)
}

// Generate 28 fixtures (correct round robin)
const list = [...teamIds]
const rounds = []
for (let r = 0; r < 7; r++) {
  const round = []
  for (let i = 0; i < 4; i++) {
    round.push([list[i], list[7 - i]])
  }
  rounds.push(round)
  const last = list[7]
  for (let i = 7; i >= 2; i--) list[i] = list[i - 1]
  list[1] = last
}

const allMatches = rounds.flat()
console.log(`\nGenerated ${allMatches.length} matches`)

const dateSlots = [
  new Date("2026-07-17T11:00:00.000Z"), new Date("2026-07-17T12:00:00.000Z"), new Date("2026-07-17T13:00:00.000Z"),
  new Date("2026-07-18T11:00:00.000Z"), new Date("2026-07-18T12:00:00.000Z"), new Date("2026-07-18T13:00:00.000Z"),
  new Date("2026-07-19T11:00:00.000Z"), new Date("2026-07-19T12:00:00.000Z"), new Date("2026-07-19T13:00:00.000Z"),
  new Date("2026-07-24T11:00:00.000Z"), new Date("2026-07-24T12:00:00.000Z"), new Date("2026-07-24T13:00:00.000Z"),
  new Date("2026-07-25T11:00:00.000Z"), new Date("2026-07-25T12:00:00.000Z"), new Date("2026-07-25T13:00:00.000Z"),
  new Date("2026-07-26T11:00:00.000Z"), new Date("2026-07-26T12:00:00.000Z"), new Date("2026-07-26T13:00:00.000Z"),
  new Date("2026-07-31T11:00:00.000Z"), new Date("2026-07-31T12:00:00.000Z"), new Date("2026-07-31T13:00:00.000Z"),
  new Date("2026-08-02T11:00:00.000Z"), new Date("2026-08-02T12:00:00.000Z"), new Date("2026-08-02T13:00:00.000Z"),
  new Date("2026-08-09T11:00:00.000Z"), new Date("2026-08-09T12:00:00.000Z"), new Date("2026-08-09T13:00:00.000Z"),
  new Date("2026-08-16T11:00:00.000Z"),
]

const venues = ["Al-Kabir Cricket Road", "AWT Cricket Ground"]

let matchNo = 1
for (let i = 0; i < allMatches.length; i++) {
  const [t1, t2] = allMatches[i]
  await p.match.create({
    data: {
      seasonId: season.id, team1Id: t1, team2Id: t2, matchNo: matchNo++,
      date: dateSlots[i], venue: i % 2 === 0 ? venues[0] : venues[1],
      status: "upcoming",
    }
  })
}

console.log(`Created ${matchNo - 1} matches`)

// Verify
const matches = await p.match.findMany({ where: { seasonId: season.id }, orderBy: { matchNo: 'asc' }, include: { team1: true, team2: true } })
console.log("\n=== FINAL SCHEDULE ===")
for (const m of matches) {
  const d = new Date(m.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" })
  const t = new Date(m.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })
  console.log(`M${String(m.matchNo).padEnd(2)} | ${d.padEnd(8)} ${t.padEnd(10)} | ${m.team1.shortName.padEnd(5)} vs ${m.team2.shortName.padEnd(5)} | ${m.venue}`)
}

// Verify each team has 7 matches
for (const tid of teamIds) {
  const count = matches.filter(m => m.team1Id === tid || m.team2Id === tid).length
  const team = matches.find(m => m.team1Id === tid || m.team2Id === tid)
  const sn = team ? (team.team1Id === tid ? team.team1.shortName : team.team2.shortName) : '?'
  console.log(`  ${sn}: ${count} matches`)
}

await p.$disconnect()
console.log("\nDone!")
