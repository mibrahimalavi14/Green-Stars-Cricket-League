import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

console.log("Clearing all data except teams, players, season...")

// Delete in order (respect FK constraints)
const delPM = await prisma.playerMatch.deleteMany()
console.log(`  PlayerMatch: ${delPM.count} deleted`)

const delInn = await prisma.inning.deleteMany()
console.log(`  Innings: ${delInn.count} deleted`)

const delMatch = await prisma.match.deleteMany()
console.log(`  Matches: ${delMatch.count} deleted`)

const delContact = await prisma.contactMessage?.deleteMany?.() || 0
console.log(`  Contact messages: ${delContact} deleted`)

const delNews = await prisma.news?.deleteMany?.() || 0
console.log(`  News: ${delNews} deleted`)

console.log("\nData cleaned. Teams, players, and season preserved.")
console.log("Ready for re-scheduling on new platform!")

await prisma.$disconnect()
