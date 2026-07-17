import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const altPlayers = await p.player.findMany({ where: { name: { in: ["Muhammad Aun Awan", "Muhammad Zain"] } } })
for (const pl of altPlayers) {
  await p.player.update({
    where: { id: pl.id },
    data: { photo: `/images/players/${pl.name}.svg` }
  })
  console.log(`Updated: ${pl.name} -> /images/players/${pl.name}.svg`)
}

await p.$disconnect()
