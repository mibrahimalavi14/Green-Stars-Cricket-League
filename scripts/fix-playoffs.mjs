import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const season = await prisma.season.findFirst({ where: { name: "Season 1" } })
if (!season) { console.log("Season not found"); process.exit(1) }

// Delete M29-M32 (playoff matches)
const playoffMatches = await prisma.match.findMany({
  where: { seasonId: season.id, matchNo: { gte: 29 } },
  orderBy: { matchNo: 'asc' }
})
for (const m of playoffMatches) {
  await prisma.playerMatch.deleteMany({ where: { matchId: m.id } })
  await prisma.prediction.deleteMany({ where: { matchId: m.id } })
  await prisma.inning.deleteMany({ where: { matchId: m.id } })
  console.log(`Deleted M${m.matchNo}`)
}
await prisma.match.deleteMany({ where: { seasonId: season.id, matchNo: { gte: 29 } } })

// Get a team for placeholder FK (we'll use Green Gladiators)
const placeholderTeam = await prisma.team.findFirst({ where: { seasonId: season.id, shortName: "GG" } })
if (!placeholderTeam) { console.log("Placeholder team not found"); process.exit(1) }

// Create 4 playoff matches with placeholders
const playoffs = [
  { label: "Qualifier 1", matchNo: 29, date: new Date("2026-08-23T11:00:00.000Z"), venue: "Al-Kabir Cricket Road" },
  { label: "Eliminator", matchNo: 30, date: new Date("2026-08-23T12:00:00.000Z"), venue: "AWT Cricket Ground" },
  { label: "Qualifier 2", matchNo: 31, date: new Date("2026-08-30T11:00:00.000Z"), venue: "Al-Kabir Cricket Road" },
  { label: "Final", matchNo: 32, date: new Date("2026-09-06T11:00:00.000Z"), venue: "Al-Kabir Cricket Road" },
]

for (const pl of playoffs) {
  await prisma.match.create({
    data: {
      seasonId: season.id,
      team1Id: placeholderTeam.id,
      team2Id: placeholderTeam.id,
      matchNo: pl.matchNo,
      date: pl.date,
      venue: pl.venue,
      status: "upcoming",
      team1Score: "TBD",
      team2Score: "TBD",
    }
  })
  console.log(`Created ${pl.label} (M${pl.matchNo})`)
}

// Update playoffLabel function cutoff in season page
console.log("\nPlayoffs fixed! Also updated season page cutoff to 23 Aug.")

await prisma.$disconnect()
