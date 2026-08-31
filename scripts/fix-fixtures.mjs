import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const season = await p.season.findFirst({ where: { name: "Season 2" } })
if (!season) { console.log("Season 2 not found"); process.exit(1) }

// Delete existing matches for season 2
await p.playerMatch.deleteMany({ where: { match: { seasonId: season.id } } })
await p.inning.deleteMany({ where: { match: { seasonId: season.id } } })
await p.match.deleteMany({ where: { seasonId: season.id } })

// Get teams sorted by name
const teams = await p.team.findMany({ where: { seasonId: season.id }, orderBy: { shortName: 'asc' } })
const teamIds = teams.map(t => t.id)
const n = teamIds.length
console.log(`Teams (${n}): ${teams.map(t => t.shortName).join(', ')}`)

// Correct round robin algorithm
const rounds = []
const list = [...teamIds] // mutable copy

for (let r = 0; r < n - 1; r++) {
  const round = []
  for (let i = 0; i < n / 2; i++) {
    round.push([list[i], list[n - 1 - i]])
  }
  rounds.push(round)
  // Rotate: keep first fixed, rotate rest clockwise
  const last = list[n - 1]
  for (let i = n - 1; i >= 2; i--) {
    list[i] = list[i - 1]
  }
  list[1] = last
}

// Verify uniqueness
const seen = new Set()
for (const round of rounds) {
  for (const [h, a] of round) {
    const key = [h, a].sort().join('-')
    if (seen.has(key)) console.log(`DUPLICATE: ${key}`)
    seen.add(key)
  }
}
console.log(`Total unique matches: ${seen.size} (expected ${n * (n - 1) / 2})`)

// Flatten
const allMatches = []
for (const round of rounds) {
  for (const [h, a] of round) {
    allMatches.push({ team1Id: h, team2Id: a })
  }
}

// Date slots (28 matches)
const dateSlots = [
  new Date("2026-07-17T11:00:00.000Z"),
  new Date("2026-07-17T12:00:00.000Z"),
  new Date("2026-07-17T13:00:00.000Z"),
  new Date("2026-07-18T11:00:00.000Z"),
  new Date("2026-07-18T12:00:00.000Z"),
  new Date("2026-07-18T13:00:00.000Z"),
  new Date("2026-07-19T11:00:00.000Z"),
  new Date("2026-07-19T12:00:00.000Z"),
  new Date("2026-07-19T13:00:00.000Z"),
  new Date("2026-07-24T11:00:00.000Z"),
  new Date("2026-07-24T12:00:00.000Z"),
  new Date("2026-07-24T13:00:00.000Z"),
  new Date("2026-07-25T11:00:00.000Z"),
  new Date("2026-07-25T12:00:00.000Z"),
  new Date("2026-07-25T13:00:00.000Z"),
  new Date("2026-07-26T11:00:00.000Z"),
  new Date("2026-07-26T12:00:00.000Z"),
  new Date("2026-07-26T13:00:00.000Z"),
  new Date("2026-07-31T11:00:00.000Z"),
  new Date("2026-07-31T12:00:00.000Z"),
  new Date("2026-07-31T13:00:00.000Z"),
  new Date("2026-08-02T11:00:00.000Z"),
  new Date("2026-08-02T12:00:00.000Z"),
  new Date("2026-08-02T13:00:00.000Z"),
  new Date("2026-08-09T11:00:00.000Z"),
  new Date("2026-08-09T12:00:00.000Z"),
  new Date("2026-08-09T13:00:00.000Z"),
  new Date("2026-08-16T11:00:00.000Z"),
]

const venues = ["Al-Kabir Cricket Road", "AWT Cricket Ground"]

let matchNo = 1
for (let i = 0; i < allMatches.length; i++) {
  const m = allMatches[i]
  await p.match.create({
    data: {
      seasonId: season.id,
      team1Id: m.team1Id,
      team2Id: m.team2Id,
      matchNo: matchNo++,
      date: dateSlots[i],
      venue: i % 2 === 0 ? venues[0] : venues[1],
      status: "upcoming",
    }
  })
}

console.log(`Created ${matchNo - 1} matches`)

// Show final schedule
const finalMatches = await p.match.findMany({ where: { seasonId: season.id }, orderBy: { matchNo: 'asc' }, include: { team1: true, team2: true } })
for (const m of finalMatches) {
  const d = new Date(m.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" })
  const t = new Date(m.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })
  console.log(`M${String(m.matchNo).padEnd(2)} | ${d.padEnd(8)} ${t.padEnd(10)} | ${m.team1.shortName.padEnd(5)} vs ${m.team2.shortName.padEnd(5)} | ${m.venue}`)
}

await p.$disconnect()
