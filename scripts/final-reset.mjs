import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const season = await prisma.season.findFirst({ where: { name: "Season 1" } })
if (!season) { console.log("Season 1 not found"); process.exit(1) }

// Delete all data for this season (match cascade deletes PlayerMatch/Inning/Prediction)
await prisma.match.deleteMany({ where: { seasonId: season.id } })
await prisma.player.deleteMany({ where: { team: { seasonId: season.id } } })
await prisma.team.deleteMany({ where: { seasonId: season.id } })

console.log("Old data cleaned")

await prisma.season.update({ where: { id: season.id }, data: { isActive: true, scheduleAnnounced: true, winnerId: "" } })

// Create 6 teams
const teamData = [
  { name: "Alpha Warriors", shortName: "AW", color: "#dc2626", players: [
    { name: "Ahmed Bhatti", role: "All-rounder", battingStyle: "Left-handed", bowlingStyle: "Right-arm fast", captain: true, photo: "/images/players/Ahmed Bhatti.png" },
    { name: "Usman Bhatti", role: "All-rounder", battingStyle: "Right-handed", bowlingStyle: "Right-arm fast", captain: false, photo: "/images/players/Usman Bhatti.png" },
  ]},
  { name: "Dragon Knights", shortName: "DK", color: "#7c3aed", players: [
    { name: "Chaudhary Abdullah", role: "All-rounder", battingStyle: "Right-handed", bowlingStyle: "Right-arm fast", captain: true, photo: "/images/players/Chaudhary Abdullah.png" },
    { name: "Malik Aun Awan", role: "All-rounder", battingStyle: "Right-handed", bowlingStyle: "Right-arm fast", captain: false, photo: "/images/players/Malik Aun Awan.svg" },
  ]},
  { name: "Elite Rangers", shortName: "ER", color: "#2563eb", players: [
    { name: "Ahmed Raza", role: "Bowler", battingStyle: "Right-handed", bowlingStyle: "Right-arm fast", captain: true, photo: "/images/players/Ahmed Raza.png" },
    { name: "Abubakar Saddique", role: "Batsman", battingStyle: "Right-handed", bowlingStyle: "Right-arm off break", captain: false, photo: "/images/players/Abubakar Saddique.png" },
  ]},
  { name: "Falcon Strikers", shortName: "FS", color: "#ca8a04", players: [
    { name: "Farhan Rasool", role: "Batsman", battingStyle: "Right-handed", bowlingStyle: "Right-arm fast", captain: true, photo: "/images/players/Farhan Rasool.jpg" },
    { name: "Zain Manais", role: "All-rounder", battingStyle: "Right-handed", bowlingStyle: "Right-arm fast", captain: false, photo: "/images/players/Zain Manais.svg" },
  ]},
  { name: "Legends XI", shortName: "LX", color: "#059669", players: [
    { name: "Malik Taha Qaiser", role: "All-rounder", battingStyle: "Right-handed", bowlingStyle: "Right-arm fast", captain: true, photo: "/images/players/Malik Taha Qaiser.png" },
    { name: "Abdulrehman Farhan", role: "Batsman", battingStyle: "Right-handed", bowlingStyle: "Right-arm off break", captain: false, photo: "/images/players/Abdulrehman Farhan.png" },
  ]},
  { name: "Power Panthers", shortName: "PP", color: "#e11d48", players: [
    { name: "Muhammad Sarib", role: "All-rounder", battingStyle: "Right-handed", bowlingStyle: "Right-arm fast", captain: true, photo: "/images/players/Muhammad Sarib.svg" },
    { name: "Muhammad Shanawar", role: "All-rounder", battingStyle: "Right-handed", bowlingStyle: "Right-arm fast", captain: false, photo: "/images/players/Muhammad Shanawar.svg" },
  ]},
]

const teamIds = []
for (const td of teamData) {
  const team = await prisma.team.create({
    data: {
      name: td.name, shortName: td.shortName, color: td.color,
      logo: `/images/teams/${td.name.replace(/\s+/g, '-')}.jpg`,
      captainName: td.players.find(p => p.captain).name,
      location: "Lahore", seasonId: season.id,
    }
  })
  teamIds.push(team.id)
  for (const pd of td.players) {
    await prisma.player.create({
      data: {
        name: pd.name, role: pd.role,
        battingStyle: pd.battingStyle, bowlingStyle: pd.bowlingStyle,
        teamId: team.id,
        photo: pd.photo,
      }
    })
  }
  console.log(`${team.shortName}: ${td.players.map(p => p.name).join(', ')}`)
}

// Delete old Muhammad Zain (alternate) if exists
const oldZain = await prisma.player.findFirst({ where: { name: "Muhammad Zain" } })
if (oldZain) { await prisma.player.delete({ where: { id: oldZain.id } }); console.log("Deleted old Muhammad Zain") }

// 30 league matches - double round robin for 6 teams
const teams6 = [...teamIds]
const n = 6

// First round robin
const rounds1 = []
const list = [...teams6]
for (let r = 0; r < n - 1; r++) {
  const round = []
  for (let i = 0; i < n / 2; i++) {
    round.push([list[i], list[n - 1 - i]])
  }
  rounds1.push(round)
  const last = list[n - 1]
  for (let i = n - 1; i >= 2; i--) list[i] = list[i - 1]
  list[1] = last
}
// Second round robin - swap each pairing
const secondRound = rounds1.flat().map(([t1, t2]) => [t2, t1])
const allMatches = [...rounds1.flat(), ...secondRound]
console.log(`\n${allMatches.length} league matches generated`)

// Schedule: 4 matches/day, July Fri-Sun + Aug Sun
const timeSlots = [
  "2026-07-17T11:00:00.000Z","2026-07-17T12:00:00.000Z","2026-07-17T13:00:00.000Z","2026-07-17T14:00:00.000Z",
  "2026-07-18T11:00:00.000Z","2026-07-18T12:00:00.000Z","2026-07-18T13:00:00.000Z","2026-07-18T14:00:00.000Z",
  "2026-07-19T11:00:00.000Z","2026-07-19T12:00:00.000Z","2026-07-19T13:00:00.000Z","2026-07-19T14:00:00.000Z",
  "2026-07-24T11:00:00.000Z","2026-07-24T12:00:00.000Z","2026-07-24T13:00:00.000Z","2026-07-24T14:00:00.000Z",
  "2026-07-25T11:00:00.000Z","2026-07-25T12:00:00.000Z","2026-07-25T13:00:00.000Z","2026-07-25T14:00:00.000Z",
  "2026-07-26T11:00:00.000Z","2026-07-26T12:00:00.000Z","2026-07-26T13:00:00.000Z","2026-07-26T14:00:00.000Z",
  "2026-07-31T11:00:00.000Z","2026-07-31T12:00:00.000Z","2026-07-31T13:00:00.000Z","2026-07-31T14:00:00.000Z",
  "2026-08-02T11:00:00.000Z","2026-08-02T12:00:00.000Z",
]
const venues = ["AWT Shift", "AWT Shift"]
let matchNo = 1
for (let i = 0; i < allMatches.length; i++) {
  const [t1, t2] = allMatches[i]
  await prisma.match.create({
    data: {
      seasonId: season.id, team1Id: t1, team2Id: t2, matchNo: matchNo++,
      date: new Date(timeSlots[i]), venue: i % 2 === 0 ? venues[0] : venues[1],
      status: "upcoming",
    }
  })
}

// Playoffs
const gg = await prisma.team.findFirst({ where: { seasonId: season.id, shortName: "AW" } })
const playoffs = [
  { label: "Qualifier 1", matchNo: 31, date: new Date("2026-08-09T11:00:00.000Z"), venue: "AWT Shift" },
  { label: "Eliminator", matchNo: 32, date: new Date("2026-08-09T12:00:00.000Z"), venue: "AWT Shift" },
  { label: "Qualifier 2", matchNo: 33, date: new Date("2026-08-09T13:00:00.000Z"), venue: "AWT Shift" },
  { label: "Final", matchNo: 34, date: new Date("2026-08-16T11:00:00.000Z"), venue: "AWT Shift" },
]
for (const pl of playoffs) {
  await prisma.match.create({
    data: {
      seasonId: season.id, team1Id: gg.id, team2Id: gg.id, matchNo: pl.matchNo,
      date: pl.date, venue: pl.venue, status: "upcoming", team1Score: "TBD", team2Score: "TBD",
    }
  })
}

// Show schedule
const all = await prisma.match.findMany({ where: { seasonId: season.id }, orderBy: { matchNo: 'asc' }, include: { team1: true, team2: true } })
console.log(`\nTotal: ${all.length} matches`)
for (const m of all) {
  const d = new Date(m.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", weekday: "short" })
  const t = new Date(m.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })
  const label = m.matchNo >= 31 ? ["(Q1)","(Elim)","(Q2)","(Final)"][m.matchNo-31] : ""
  console.log(`M${String(m.matchNo).padEnd(2)} | ${d.padEnd(16)} ${t.padEnd(10)} | ${m.team1.shortName.padEnd(5)} vs ${m.team2.shortName.padEnd(5)} ${label}`)
}

await prisma.$disconnect()
