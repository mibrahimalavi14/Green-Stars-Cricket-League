import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

// 1. Create Season 2
const season = await p.season.create({
  data: {
    name: "Season 2",
    year: 2026,
    isActive: false,
    scheduleAnnounced: true,
  }
})
console.log(`Created Season 2: ${season.id}`)

// 2. Create 8 teams with their players
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
      name: tc.name,
      shortName: tc.shortName,
      color: tc.color,
      logo: `/team-logos/${tc.shortName.toLowerCase()}.png`,
      captainName: tc.player.name,
      location: "Lahore",
      seasonId: season.id,
    }
  })
  teamIds.push(team.id)

  // Create main player
  const player = await p.player.create({
    data: {
      name: tc.player.name,
      role: tc.player.role,
      battingStyle: tc.player.battingStyle,
      bowlingStyle: tc.player.bowlingStyle,
      teamId: team.id,
      photo: `/images/players/${tc.player.name.replace(/\s+/g, '_')}.jpg`,
    }
  })
  console.log(`  ${team.shortName}: ${tc.player.name} (${player.id})`)

  // Create alternate player if specified
  if (tc.altName) {
    const alt = await p.player.create({
      data: {
        name: tc.altName,
        role: tc.altRole || "All-rounder",
        battingStyle: "Right-handed",
        bowlingStyle: "Right-arm fast",
        teamId: team.id,
        photo: `/placeholder-player.svg`,
      }
    })
    console.log(`  ${team.shortName}: ${tc.altName} (alternate) (${alt.id})`)
  }
}

console.log(`\nCreated ${teamIds.length} teams`)

// 3. Generate single round robin fixtures (28 matches)
// Using circle method for 8 teams
const teams = [...teamIds]
const n = teams.length
const rounds = []

// Circle algorithm for round robin
const fixed = teams[0]
const rest = teams.slice(1)

for (let r = 0; r < n - 1; r++) {
  const round = []
  // Pair fixed with current last
  round.push([fixed, rest[rest.length - 1]])
  // Pair the rest
  for (let i = 0; i < (rest.length - 1) / 2; i++) {
    round.push([rest[i], rest[rest.length - 2 - i]])
  }
  rounds.push(round)
  // Rotate: move last element to position 1
  const last = rest.pop()
  rest.splice(1, 0, last)
}

// Flatten rounds into match list with alternating venues
const allMatches = []
for (const round of rounds) {
  for (const [h, a] of round) {
    allMatches.push({ team1Id: h, team2Id: a })
  }
}

console.log(`\nGenerated ${allMatches.length} fixtures`)

// 4. Assign dates
// July: Fri 17, Sat 18, Sun 19, Fri 24, Sat 25, Sun 26, Fri 31 (7 days × 3 = 21)
// Aug: Sun 2, Sun 9 (2 days × 3 = 6) = 27, need 1 more: Sun 16 Aug
const dateSlots = [
  // July - first weekend
  new Date("2026-07-17T11:00:00.000Z"), // Fri 4pm
  new Date("2026-07-17T12:00:00.000Z"),
  new Date("2026-07-17T13:00:00.000Z"),
  new Date("2026-07-18T11:00:00.000Z"), // Sat
  new Date("2026-07-18T12:00:00.000Z"),
  new Date("2026-07-18T13:00:00.000Z"),
  new Date("2026-07-19T11:00:00.000Z"), // Sun
  new Date("2026-07-19T12:00:00.000Z"),
  new Date("2026-07-19T13:00:00.000Z"),
  // July - second weekend
  new Date("2026-07-24T11:00:00.000Z"), // Fri
  new Date("2026-07-24T12:00:00.000Z"),
  new Date("2026-07-24T13:00:00.000Z"),
  new Date("2026-07-25T11:00:00.000Z"), // Sat
  new Date("2026-07-25T12:00:00.000Z"),
  new Date("2026-07-25T13:00:00.000Z"),
  new Date("2026-07-26T11:00:00.000Z"), // Sun
  new Date("2026-07-26T12:00:00.000Z"),
  new Date("2026-07-26T13:00:00.000Z"),
  // July - third Friday
  new Date("2026-07-31T11:00:00.000Z"),
  new Date("2026-07-31T12:00:00.000Z"),
  new Date("2026-07-31T13:00:00.000Z"),
  // August Sundays
  new Date("2026-08-02T11:00:00.000Z"),
  new Date("2026-08-02T12:00:00.000Z"),
  new Date("2026-08-02T13:00:00.000Z"),
  new Date("2026-08-09T11:00:00.000Z"),
  new Date("2026-08-09T12:00:00.000Z"),
  new Date("2026-08-09T13:00:00.000Z"),
  new Date("2026-08-16T11:00:00.000Z"), // 28th match
]

const venues = ["Al-Kabir Cricket Road", "AWT Cricket Ground"]

let matchNo = 1
for (let i = 0; i < allMatches.length; i++) {
  const m = allMatches[i]
  const date = dateSlots[i]
  const venue = i % 2 === 0 ? venues[0] : venues[1] // alternate venues

  // Skip if we've exhausted dates (shouldn't happen if counts match)
  if (!date) {
    console.log(`  WARNING: No date slot for match ${matchNo}`)
    continue
  }

  await p.match.create({
    data: {
      seasonId: season.id,
      team1Id: m.team1Id,
      team2Id: m.team2Id,
      matchNo: matchNo++,
      date,
      venue,
      status: "upcoming",
      result: "",
      team1Score: "",
      team2Score: "",
    }
  })
}

console.log(`\nCreated ${matchNo - 1} matches`)
console.log("Season 2 setup complete!")

await p.$disconnect()
