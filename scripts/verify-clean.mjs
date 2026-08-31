import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

console.log("Remaining data:")
console.log(`  Teams: ${await prisma.team.count()}`)
console.log(`  Players: ${await prisma.player.count()}`)
console.log(`  Seasons: ${await prisma.season.count()}`)
console.log(`  Matches: ${await prisma.match.count()}`)
console.log(`  Innings: ${await prisma.inning.count()}`)
console.log(`  PlayerMatch: ${await prisma.playerMatch.count()}`)
console.log(`  News: ${await prisma.news.count()}`)
console.log(`  Contact: ${await prisma.contactMessage.count()}`)

const teams = await prisma.team.findMany({ select: { name: true, shortName: true } })
console.log(`\nTeams preserved: ${teams.map(t => t.shortName).join(', ')}`)

await prisma.$disconnect()
