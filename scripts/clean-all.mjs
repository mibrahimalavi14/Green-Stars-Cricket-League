import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const season = await prisma.season.findFirst({ where: { name: "Season 1" } })
if (!season) { console.log("Season 1 not found"); process.exit(1) }

console.log("Cleaning all Season 1 data...")

// Delete season predictions first (FK constraint)
const sp = await prisma.seasonPrediction.deleteMany({ where: { seasonId: season.id } })
console.log(`  Season predictions: ${sp.count}`)

// Delete match predictions
const matches = await prisma.match.findMany({ where: { seasonId: season.id }, select: { id: true } })
const matchIds = matches.map(m => m.id)
if (matchIds.length > 0) {
  const p = await prisma.prediction.deleteMany({ where: { matchId: { in: matchIds } } })
  console.log(`  Match predictions: ${p.count}`)
}

// Delete playerMatch, innings, matches
const pm = await prisma.playerMatch.deleteMany({ where: { match: { seasonId: season.id } } })
console.log(`  PlayerMatch: ${pm.count}`)

const inn = await prisma.inning.deleteMany({ where: { match: { seasonId: season.id } } })
console.log(`  Innings: ${inn.count}`)

const m = await prisma.match.deleteMany({ where: { seasonId: season.id } })
console.log(`  Matches: ${m.count}`)

// Delete players
const pl = await prisma.player.deleteMany({ where: { team: { seasonId: season.id } } })
console.log(`  Players: ${pl.count}`)

// Delete news
const n = await prisma.news.deleteMany()
console.log(`  News: ${n.count}`)

console.log("\nDone! Only teams and season remain.")
await prisma.$disconnect()
