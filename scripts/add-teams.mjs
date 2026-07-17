import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const season = await prisma.season.findFirst({ where: { name: "Season 1" } })
if (!season) { console.log("Season 1 not found"); process.exit(1) }

// Add 2 new teams (skip if already exist)
const newTeams = [
  { name: "Thunder Hawks", shortName: "TH", color: "#f59e0b", logo: "/images/teams/Thunder-Hawks.jpg", location: "Haripur", seasonId: season.id },
  { name: "Green Gladiators", shortName: "GG", color: "#16a34a", logo: "/images/teams/green-gladiators.jpg", location: "Haripur", seasonId: season.id },
]

for (const t of newTeams) {
  const exists = await prisma.team.findFirst({ where: { name: t.name, seasonId: season.id } })
  if (!exists) {
    await prisma.team.create({ data: t })
    console.log(`  Created: ${t.name}`)
  } else {
    console.log(`  Already exists: ${t.name}`)
  }
}

// Update all existing teams' location to Haripur
const updated = await prisma.team.updateMany({
  where: { seasonId: season.id, location: { not: "Haripur" } },
  data: { location: "Haripur" },
})
if (updated.count > 0) console.log(`  Updated ${updated.count} team locations to Haripur`)

// Remove headCoach from all teams
const cleared = await prisma.team.updateMany({
  where: { seasonId: season.id, headCoach: { not: "" } },
  data: { headCoach: "" },
})
if (cleared.count > 0) console.log(`  Cleared headCoach for ${cleared.count} teams`)

const allTeams = await prisma.team.findMany({ where: { seasonId: season.id }, select: { name: true, shortName: true, location: true } })
console.log(`\nTotal teams: ${allTeams.length}`)
console.log(allTeams.map(t => `  ${t.shortName} - ${t.name} (${t.location})`).join("\n"))

await prisma.$disconnect()
