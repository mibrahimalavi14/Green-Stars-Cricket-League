import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const players = await p.player.findMany({ include: { team: true }, orderBy: [{ team: { shortName: 'asc' } }, { name: 'asc' }] })
for (const pl of players) {
  console.log(`${pl.name.padEnd(25)} | ${pl.team.shortName.padEnd(5)} | Bat: ${pl.battingStyle.padEnd(15)} | Bowl: ${pl.bowlingStyle}`)
}
console.log(`\nTotal: ${players.length} players`)
await p.$disconnect()
