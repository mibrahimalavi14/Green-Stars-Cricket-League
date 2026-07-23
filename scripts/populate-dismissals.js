const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  const players = await prisma.player.findMany()
  const updates = []
  for (const player of players) {
    const pms = await prisma.playerMatch.findMany({
      where: { playerId: player.id },
      select: { isOut: true },
    })
    const dismissals = pms.filter((m) => m.isOut).length
    updates.push(
      prisma.player.update({
        where: { id: player.id },
        data: { dismissals },
      })
    )
  }
  await prisma.$transaction(updates)
  console.log("Done:", updates.length, "players updated")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
