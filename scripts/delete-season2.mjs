import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const s = await p.season.findFirst({ where: { name: 'Season 2' } })
if (s) {
  await p.playerMatch.deleteMany({ where: { match: { seasonId: s.id } } })
  await p.prediction.deleteMany({ where: { match: { seasonId: s.id } } })
  await p.inning.deleteMany({ where: { match: { seasonId: s.id } } })
  await p.match.deleteMany({ where: { seasonId: s.id } })
  await p.player.deleteMany({ where: { team: { seasonId: s.id } } })
  await p.team.deleteMany({ where: { seasonId: s.id } })
  await p.season.delete({ where: { id: s.id } })
  console.log('Deleted Season 2')
} else {
  console.log('No Season 2 found')
}
await p.$disconnect()
