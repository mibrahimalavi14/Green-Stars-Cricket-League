import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const season = await prisma.season.findFirst({ where: { name: "Season 1" } })
if (!season) { console.log("Season not found"); process.exit(1) }

// Delete all existing matches
const existing = await prisma.match.findMany({ where: { seasonId: season.id } })
for (const m of existing) {
  await prisma.playerMatch.deleteMany({ where: { matchId: m.id } })
  await prisma.prediction.deleteMany({ where: { matchId: m.id } })
  await prisma.inning.deleteMany({ where: { matchId: m.id } })
}
await prisma.match.deleteMany({ where: { seasonId: season.id } })
console.log("Deleted all existing matches")

// Get teams sorted
const teams = await prisma.team.findMany({ where: { seasonId: season.id }, orderBy: { shortName: 'asc' } })
const tIds = teams.map(t => t.id)
console.log(`Teams: ${teams.map(t => t.shortName).join(', ')}`)

// Generate 28 league matches (correct round robin)
const list = [...tIds]
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

const allLeagueMatches = rounds.flat()

// Date slots for July (Fri-Sun, 4 per day: 4,5,6,7 PM)
const timeSlots = [
  "2026-07-17T11:00:00.000Z", "2026-07-17T12:00:00.000Z", "2026-07-17T13:00:00.000Z", "2026-07-17T14:00:00.000Z",
  "2026-07-18T11:00:00.000Z", "2026-07-18T12:00:00.000Z", "2026-07-18T13:00:00.000Z", "2026-07-18T14:00:00.000Z",
  "2026-07-19T11:00:00.000Z", "2026-07-19T12:00:00.000Z", "2026-07-19T13:00:00.000Z", "2026-07-19T14:00:00.000Z",
  "2026-07-24T11:00:00.000Z", "2026-07-24T12:00:00.000Z", "2026-07-24T13:00:00.000Z", "2026-07-24T14:00:00.000Z",
  "2026-07-25T11:00:00.000Z", "2026-07-25T12:00:00.000Z", "2026-07-25T13:00:00.000Z", "2026-07-25T14:00:00.000Z",
  "2026-07-26T11:00:00.000Z", "2026-07-26T12:00:00.000Z", "2026-07-26T13:00:00.000Z", "2026-07-26T14:00:00.000Z",
  "2026-07-31T11:00:00.000Z", "2026-07-31T12:00:00.000Z", "2026-07-31T13:00:00.000Z", "2026-07-31T14:00:00.000Z",
]

const venues = ["Al-Kabir Cricket Road", "AWT Cricket Ground"]

let matchNo = 1
for (let i = 0; i < allLeagueMatches.length; i++) {
  const [t1, t2] = allLeagueMatches[i]
  await prisma.match.create({
    data: {
      seasonId: season.id, team1Id: t1, team2Id: t2, matchNo: matchNo++,
      date: new Date(timeSlots[i]), venue: i % 2 === 0 ? venues[0] : venues[1],
      status: "upcoming",
    }
  })
}
console.log(`Created 28 league matches (Jul 17-31, Fri-Sun, 4 matches/day)`)

// Playoffs: Q1, Eliminator, Q2 on 23 Aug | Final on 6 Sep
const placeholderTeam = teams.find(t => t.shortName === "GG")
const playoffs = [
  { label: "Qualifier 1", date: new Date("2026-08-23T11:00:00.000Z"), venue: "Al-Kabir Cricket Road" },
  { label: "Eliminator", date: new Date("2026-08-23T12:00:00.000Z"), venue: "AWT Cricket Ground" },
  { label: "Qualifier 2", date: new Date("2026-08-23T13:00:00.000Z"), venue: "Al-Kabir Cricket Road" },
  { label: "Final", date: new Date("2026-09-06T11:00:00.000Z"), venue: "Al-Kabir Cricket Road" },
]
for (const pl of playoffs) {
  await prisma.match.create({
    data: {
      seasonId: season.id, team1Id: placeholderTeam.id, team2Id: placeholderTeam.id,
      matchNo: matchNo++, date: pl.date, venue: pl.venue,
      status: "upcoming", team1Score: "TBD", team2Score: "TBD",
    }
  })
  console.log(`Created ${pl.label} - ${pl.date.toLocaleDateString("en-GB", { timeZone: "Asia/Karachi" })}`)
}

// Show schedule
const allMatches = await prisma.match.findMany({ where: { seasonId: season.id }, orderBy: { matchNo: 'asc' }, include: { team1: true, team2: true } })
console.log("\n=== FINAL SCHEDULE ===")
for (const m of allMatches) {
  const d = new Date(m.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", weekday: "short" })
  const t = new Date(m.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })
  const pLabel = m.matchNo >= 29 ? ["(Q1)","(Elim)","(Q2)","(Final)"][m.matchNo-29] : ""
  console.log(`M${String(m.matchNo).padEnd(2)} | ${d.padEnd(16)} ${t.padEnd(10)} | ${m.team1.shortName.padEnd(5)} vs ${m.team2.shortName.padEnd(5)} | ${m.venue.padEnd(25)} ${pLabel}`)
}

await prisma.$disconnect()
